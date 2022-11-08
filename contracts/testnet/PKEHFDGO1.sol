// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@massless.io/smart-contract-library/contracts/royalty/Royalty.sol";
import "@massless.io/smart-contract-library/contracts/interfaces/IContractURI.sol";
import "@massless.io/smart-contract-library/contracts/sale/SaleState.sol";
import "@massless.io/smart-contract-library/contracts/signature/Signature.sol";
import "@massless.io/smart-contract-library/contracts/utils/PreAuthorisable.sol";
import "@massless.io/smart-contract-library/contracts/utils/ScaleNumber.sol";
import "@massless.io/smart-contract-library/contracts/utils/WithdrawalSplittable.sol";
import "../interfaces/IJungle.sol";
import "../PackTokenIds.sol";

error NotModeratorOrOwner();
error MustMintMinimumOne();
error SoldOut();
error TransactionMintLimit(uint256 limit);
error IncorrectValueJungle();
error IncorrectEthValue();
error NotYourToken();
error NotHoldingAnyTokens();
error UsedToken(uint256 jfgId);

contract PKEHFDGO1 is
    WithdrawalSplittable,
    AccessControl,
    PreAuthorisable,
    PackTokenIds,
    ScaleNumber,
    ERC1155Supply,
    ERC1155Burnable,
    Royalty,
    Signature,
    SaleState
{
    string private _name;
    string private _symbol;

    // Constants
    mapping(uint256 => uint256) public MAX_SUPPLY;
    uint256 public constant MAX_BATCH_MINT = 5;

    // can mint each level token?
    mapping(uint256 => bool) public canMint;

    address[] private BENEFICIARY_WALLETS = [
        address(0xFA60C3295Ea671E365B9A242551Cf1Ff314Bf045),
        address(0x8e5F332a0662C8c06BDD1Eed105Ba1C4800d4c2f),
        address(0x954BfE5137c8D2816cE018EFd406757f9a060e5f),
        address(0xd196e0aFacA3679C27FC05ba8C9D3ABBCD353b5D)
    ];
    uint256[] private BENEFICIARIES_PRIMARY = [3100, 3100, 1800, 2000];

    // Staking
    IJungle private _jungleContract;

    // Jungle Freaks Genesis
    IERC721 private _jfgContract;

    // Jungle Bank
    address public constant JUNGLE_BANK =
        0x8e5F332a0662C8c06BDD1Eed105Ba1C4800d4c2f;

    // Roles
    bytes32 public constant MODERATOR = keccak256("MODERATOR");

    // Events
    event Phase1MintBegins();
    event Phase2MintBegins();
    event MintEnds();

    constructor(
        address signer_,
        address moderator_,
        address royaltyReceiver_,
        IJungle jungleContract_,
        IERC721 jfgContract_,
        address[] memory _preAuthorized
    )
        ERC1155("https://api-hxs7r5kyjq-uc.a.run.app/{id}.json")
        Signature(signer_)
        PreAuthorisable(_preAuthorized)
    {
        _name = "PKEHFDGO1";
        _symbol = "PKEHFDGO1";

        MAX_SUPPLY[1] = 7000;
        MAX_SUPPLY[2] = 2995;
        MAX_SUPPLY[3] = 5;

        canMint[1] = true;
        canMint[2] = true;
        canMint[3] = true;

        _jungleContract = jungleContract_;
        _jfgContract = jfgContract_;

        _setRoyaltyReceiver(royaltyReceiver_);
        _setRoyaltyBasisPoints(500);

        setPrimarySalesSplits();

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(MODERATOR, moderator_);
    }

    modifier maxSupplyLimit(uint256 quantity_) {
        uint256 supplyLimit = _sumMintablesUntilLevel(3);

        if (quantity_ == 0) revert MustMintMinimumOne();
        if (quantity_ > supplyLimit) revert SoldOut();
        _;
    }

    modifier onlyAdmin() {
        if (!(owner() == _msgSender() || hasRole(MODERATOR, _msgSender())))
            revert NotModeratorOrOwner();
        _;
    }

    // Phase 1 Mint
    function phase1Mint(
        bytes calldata signature_,
        bytes32 salt_,
        uint256 jungle_,
        uint256[] calldata jfgIds_
    )
        external
        payable
        whenSaleIsActive("Phase1Mint")
        maxSupplyLimit(jfgIds_.length)
        onlySignedTx(
            keccak256(abi.encodePacked(_msgSender(), salt_, jungle_, jfgIds_)),
            signature_
        )
    {
        // Only owner of Jungle Freaks Genesis token can mint
        for (uint256 i = 0; i < jfgIds_.length; i++) {
            if (_jfgContract.ownerOf(jfgIds_[i]) != _msgSender())
                revert NotYourToken();
        }

        // Only unused Jungle Freaks Genesis token will be used to mint
        for (uint256 i = 0; i < jfgIds_.length; i++) {
            bool isUsedToken = usedTokenId(jfgIds_[i]);
            if (isUsedToken) revert UsedToken(jfgIds_[i]);
        }
        _setUsedTokenIds(jfgIds_);

        _processMint(salt_, jungle_, jfgIds_.length);
    }

    function startPhase1Mint() external onlyAdmin {
        _setSaleType("Phase1Mint");
        _setSaleState(State.ACTIVE);

        emit Phase1MintBegins();
    }

    // Phase 2 Mint
    function phase2Mint(
        bytes calldata signature_,
        bytes32 salt_,
        uint256 jungle_,
        uint256 quantity_
    )
        external
        payable
        whenSaleIsActive("Phase2Mint")
        maxSupplyLimit(quantity_)
        onlySignedTx(
            keccak256(
                abi.encodePacked(_msgSender(), salt_, jungle_, quantity_)
            ),
            signature_
        )
    {
        if (quantity_ > MAX_BATCH_MINT)
            revert TransactionMintLimit(MAX_BATCH_MINT);
        if (_jfgContract.balanceOf(_msgSender()) == 0)
            revert NotHoldingAnyTokens();

        _processMint(salt_, jungle_, quantity_);
    }

    function startPhase2Mint() external onlyAdmin {
        _setSaleType("Phase2Mint");
        _setSaleState(State.ACTIVE);

        emit Phase2MintBegins();
    }

    function endMint() external onlyAdmin {
        if (getSaleState() != State.ACTIVE) revert NoActiveSale();
        _setSaleState(State.FINISHED);
        // can't mint level 1 token any more.
        canMint[1] = false;
        emit MintEnds();
    }

    function _processMint(
        bytes32 randomness_,
        uint256 jungle_,
        uint256 quantity_
    ) internal {
        // Get the eth price when subsidised with jungle
        // Reverts when not a valid quantity of $JUNGLE
        uint256 ethPrice = holdersEthPrice(jungle_, quantity_);
        if (msg.value != ethPrice) revert IncorrectEthValue();

        if (jungle_ > 0) {
            _jungleContract.transferFrom(_msgSender(), JUNGLE_BANK, jungle_);
        }

        (
            uint256 mintsLevel1,
            uint256 mintsLevel2,
            uint256 mintsLevel3
        ) = _decideMintsPerLevel(randomness_, quantity_);

        if (mintsLevel1 > 0) _mint(_msgSender(), 1, mintsLevel1, "");
        if (mintsLevel2 > 0) _mint(_msgSender(), 2, mintsLevel2, "");
        if (mintsLevel3 > 0) _mint(_msgSender(), 3, mintsLevel3, "");
    }

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155Supply, ERC1155) {
        ERC1155Supply._beforeTokenTransfer(
            operator,
            from,
            to,
            ids,
            amounts,
            data
        );
    }

    // ----- Splittable Withdrawal Management -----

    function setPrimarySalesSplits() public onlyAdmin {
        setBeneficiaries(BENEFICIARY_WALLETS, BENEFICIARIES_PRIMARY);
    }

    // Utilities
    function _sumMintablesUntilLevel(uint256 level_)
        private
        view
        returns (uint256)
    {
        uint256 totalMintables = 0;

        if (level_ > 3) level_ = 3;

        for (uint256 i = 1; i <= level_; i++) {
            if (canMint[i] && MAX_SUPPLY[i] > totalSupply(i)) {
                totalMintables += MAX_SUPPLY[i] - totalSupply(i);
            }
        }
        return totalMintables;
    }

    function _decideMintsPerLevel(bytes32 randomness_, uint256 quantity_)
        private
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256[] memory randomNumbers = new uint256[](quantity_);
        for (uint256 i = 0; i < quantity_; i++) {
            randomNumbers[i] =
                uint256(
                    keccak256(abi.encodePacked(quantity_ + i, randomness_))
                ) %
                (10**9);
        }

        uint256 mintsLevel1 = 0;
        uint256 mintsLevel2 = 0;
        uint256 mintsLevel3 = 0;
        for (uint256 i = 0; i < quantity_; i++) {
            uint256 totalMintables = _sumMintablesUntilLevel(3) -
                (mintsLevel1 + mintsLevel2 + mintsLevel3);
            uint256 selectedNum = scale(randomNumbers[i], totalMintables, 9);

            if (selectedNum < _sumMintablesUntilLevel(1) - mintsLevel1) {
                mintsLevel1++;
            } else if (
                selectedNum <
                _sumMintablesUntilLevel(2) - (mintsLevel1 + mintsLevel2)
            ) {
                mintsLevel2++;
            } else if (
                selectedNum <
                _sumMintablesUntilLevel(3) -
                    (mintsLevel1 + mintsLevel2 + mintsLevel3)
            ) {
                mintsLevel3++;
            }
        }

        return (mintsLevel1, mintsLevel2, mintsLevel3);
    }

    function holdersEthPrice(uint256 j_, uint256 q_)
        public
        pure
        returns (uint256)
    {
        if (j_ == 0 ether) return 0.13 ether * q_;
        if (j_ == 150 ether * q_) return 0.065 ether * q_;
        if (j_ == 300 ether * q_) return 0 ether;

        revert IncorrectValueJungle();
    }

    // Administration
    function setSignerAddress(address signerAddress_) public onlyAdmin {
        _setSignerAddress(signerAddress_);
    }

    function setRoyaltyReceiver(address royaltyReceiver_) public onlyOwner {
        _setRoyaltyReceiver(royaltyReceiver_);
    }

    function setRoyaltyBasisPoints(uint32 royaltyBasisPoints_)
        public
        onlyOwner
    {
        _setRoyaltyBasisPoints(royaltyBasisPoints_);
    }

    function transferOwnership(address newOwner)
        public
        virtual
        override
        onlyOwner
    {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );

        _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
        _revokeRole(DEFAULT_ADMIN_ROLE, owner());
        _transferOwnership(newOwner);
    }

    // Compulsory overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, Royalty, AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IAccessControl).interfaceId ||
            interfaceId == type(IERC2981).interfaceId ||
            interfaceId == type(IContractURI).interfaceId ||
            interfaceId == type(IERC1155).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * Override isApprovedForAll to whitelist the trusted accounts to enable gas-free listings.
     */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        virtual
        override
        returns (bool isOperator)
    {
        if (_isAuthorizedAddress(_operator)) {
            return true;
        }

        return super.isApprovedForAll(_owner, _operator);
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }
}
