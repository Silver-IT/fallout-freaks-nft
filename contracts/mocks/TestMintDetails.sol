// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TestMintDetails is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct MintDetails {
        uint32 originalId;
        uint32 level;
        uint32 mintType;
        uint32 mutationId;
        uint128 aux;
    }

    // Fallout Freaks Mint Log Details
    mapping(uint256 => MintDetails) private _mintDetails;

    constructor() ERC721("", "") {}

    function safeMintToExact(address walletAddress_, uint256 tokenId_) public {
        _safeMint(walletAddress_, tokenId_);
    }

    function setMintDetails(
        uint256 tokenId_,
        uint32 originalId_,
        uint32 level_,
        uint32 mintType_,
        uint32 mutationId_
    ) public {
        MintDetails memory tokenMintDetails = MintDetails({
            originalId: originalId_,
            level: level_,
            mintType: mintType_,
            mutationId: mutationId_,
            aux: uint128(0)
        });
        _mintDetails[tokenId_] = tokenMintDetails;
    }

    function getMintDetails(uint256 _tokenId)
        public
        view
        returns (MintDetails memory)
    {
        return _mintDetails[_tokenId];
    }

    function _baseURI() internal pure override returns (string memory) {
        return "";
    }
}
