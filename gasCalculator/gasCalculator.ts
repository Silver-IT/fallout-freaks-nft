import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { Wallet } from "ethers";
import { expect } from "chai";
import {
  InsecureJungle,
  InsecureJungle__factory,
  JungleFreaksCrystal,
  RoyaltyReceiver,
  RoyaltyReceiver__factory,
  JungleFreaksCrystal__factory,
  StandardERC1155,
  StandardERC1155__factory,
  StandardERC20,
  StandardERC20__factory,
  StandardERC721,
  StandardERC721__factory,
} from "../typechain";
import { randomBytes } from "crypto";
import signMintRequest from "./utils/signMintRequest";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("JungleFreaksCrystalGasCalc", async () => {
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let approved: SignerWithAddress;
  let mod: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;
  let user6: SignerWithAddress;
  let user7: SignerWithAddress;
  let user8: SignerWithAddress;
  let user9: SignerWithAddress;

  let standardERC20Factory: StandardERC20__factory;
  let jfContractFactory: StandardERC721__factory;
  let jflContractFactory: StandardERC1155__factory;
  let rrContractFactory: RoyaltyReceiver__factory;
  let jungleContractFactory: InsecureJungle__factory;
  let contractFactory: JungleFreaksCrystal__factory;

  let allowList: Wallet[];
  let leaves: string[];
  let merkleTree: MerkleTree;

  beforeEach(async function () {
    [
      owner,
      signer,
      approved,
      mod,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      user8,
      user9,
    ] = await ethers.getSigners();

    standardERC20Factory = await ethers.getContractFactory(
      "StandardERC20",
      owner
    );

    // Jungle Freaks Contract Mock (ERC721)
    jfContractFactory = await ethers.getContractFactory(
      "StandardERC721",
      owner
    );

    // Legendary Jungle Freaks Contract Mock (ERC1155 - OpenSea StoreFront)
    jflContractFactory = await ethers.getContractFactory(
      "StandardERC1155",
      owner
    );

    // Royalty Receiver
    rrContractFactory = await ethers.getContractFactory(
      "RoyaltyReceiver",
      owner
    );

    // Jungle Contract
    jungleContractFactory = await ethers.getContractFactory(
      "InsecureJungle",
      owner
    );

    // Set up test contract
    contractFactory = await ethers.getContractFactory(
      "JungleFreaksCrystal",
      owner
    );

    // Allow list tests
    allowList = new Array(1000)
      .fill("")
      .map((_) => ethers.Wallet.createRandom().connect(ethers.provider));

    leaves = allowList.map((wallet: Wallet) =>
      ethers.utils.solidityKeccak256(["address"], [wallet.address])
    );

    merkleTree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
    });
  });

  let jfContract: StandardERC721;
  let jflContract: StandardERC1155;
  let standardERC20: StandardERC20;
  let jungleContract: InsecureJungle;
  let rrContract: RoyaltyReceiver;
  let contract: JungleFreaksCrystal;

  beforeEach(async function () {
    jfContract = await jfContractFactory.deploy();

    jflContract = await jflContractFactory.deploy();

    standardERC20 = await standardERC20Factory.deploy();
    await standardERC20.connect(approved).mint(ethers.utils.parseEther("100"));

    jungleContract = await jungleContractFactory.deploy(
      jfContract.address,
      jflContract.address
    );

    rrContract = await rrContractFactory.deploy();

    contract = await contractFactory.deploy(
      signer.address,
      mod.address,
      rrContract.address,
      jfContract.address,
      jflContract.address,
      jungleContract.address
    );
  });

  describe("When allow list minting", async () => {
    it("should allow minting with a valid signature and merkle proof", async () => {
      const root = merkleTree.getHexRoot();
      await contract.setMerkleRoot(root);
      await expect(contract.startAllowListMint()).to.emit(
        contract,
        "AllowListMintBegins"
      );

      const quantity = 10;

      await Promise.all(
        allowList.slice(500, 500 + quantity).map(async (wallet) => {
          await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("0.5"),
          });

          const merkleProof = merkleTree.getHexProof(
            ethers.utils.solidityKeccak256(["address"], [wallet.address])
          );
          const salt = "0x" + randomBytes(8).toString("hex");
          const price = await contract.SALE_PRICE();
          const apiSignature = await signMintRequest(
            signer,
            wallet.address,
            salt,
            ["bytes32[]"],
            [merkleProof]
          );

          // Mint
          return expect(
            contract
              .connect(wallet)
              .allowListMint(apiSignature, salt, merkleProof, {
                value: price,
              })
          ).to.emit(contract, "Transfer");
        })
      );

      expect((await contract.totalSupply()).toNumber()).to.eql(quantity);
    });
  });
  describe("When holders guarantee minting", async () => {
    it("should allow when holding 1 jungle freak", async () => {
      await expect(contract.startHoldersGuaranteeMint()).to.emit(
        contract,
        "HoldersGuaranteeMintBegins"
      );

      const quantity = 10;

      await Promise.all(
        allowList.slice(600, 600 + quantity).map(async (wallet) => {
          await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("0.5"),
          });

          await jfContract.safeMintTo(wallet.address, 1);

          const salt = "0x" + randomBytes(8).toString("hex");

          const jungle = ethers.utils.parseEther("0");

          const price = await contract.holdersEthPrice(jungle, 1);

          const apiSignature = await signMintRequest(
            signer,
            wallet.address,
            salt,
            ["uint256"],
            [jungle]
          );

          // Mint
          return expect(
            contract
              .connect(wallet)
              .holdersGuaranteeMint(apiSignature, salt, jungle, {
                value: price,
              })
          ).to.emit(contract, "Transfer");
        })
      );

      expect((await contract.totalSupply()).toNumber()).to.eql(quantity);
    });
  });
  describe("When holders minting", async () => {
    it("should allow when holding 1 jungle freak", async () => {
      await expect(contract.startHoldersMint()).to.emit(
        contract,
        "HoldersMintBegins"
      );

      const quantity = 10;

      await Promise.all(
        allowList.slice(700, 700 + quantity).map(async (wallet) => {
          await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("2"),
          });

          await jfContract.safeMintTo(wallet.address, 8);
          await jungleContract.mint(
            wallet.address,
            ethers.utils.parseEther("300")
          );
          await jungleContract
            .connect(wallet)
            .setAuthorizedAddress(contract.address, true);

          const quantity = 2;

          const salt = "0x" + randomBytes(8).toString("hex");

          const jungle = ethers.utils.parseEther("150");

          const price = await contract.holdersEthPrice(jungle, quantity);

          const apiSignature = await signMintRequest(
            signer,
            wallet.address,
            salt,
            ["uint256", "uint8"],
            [jungle, quantity]
          );

          // Mint
          return expect(
            contract
              .connect(wallet)
              .holdersMint(apiSignature, salt, jungle, quantity, {
                value: price,
              })
          ).to.emit(contract, "Transfer");
        })
      );

      expect((await contract.totalSupply()).toNumber()).to.eql(quantity * 2);
    });
  });
  describe("When public minting", async () => {
    it("should allow when holding 1 jungle freak", async () => {
      await expect(contract.startPublicMint()).to.emit(
        contract,
        "PublicMintBegins"
      );

      const quantity = 10;

      await Promise.all(
        allowList.slice(700, 700 + quantity).map(async (wallet) => {
          await owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("2"),
          });

          await jfContract.safeMintTo(wallet.address, 1);
          await jungleContract.mint(
            wallet.address,
            ethers.utils.parseEther("500")
          );
          await jungleContract
            .connect(wallet)
            .setAuthorizedAddress(contract.address, true);

          const quantity = 5;

          const salt = "0x" + randomBytes(8).toString("hex");

          const jungle = ethers.utils.parseEther("450");

          const price = await contract.publicEthPrice(jungle, quantity);

          const apiSignature = await signMintRequest(
            signer,
            wallet.address,
            salt,
            ["uint256", "uint8"],
            [jungle, quantity]
          );

          // Mint
          return expect(
            contract
              .connect(wallet)
              .publicMint(apiSignature, salt, jungle, quantity, {
                value: price,
              })
          ).to.emit(contract, "Transfer");
        })
      );

      expect((await contract.totalSupply()).toNumber()).to.eql(quantity * 5);
    });
  });
  describe("When minting reserved", async () => {
    it("should mint 100 from owner to user1", async () => {
      const quantity = 100;

      await expect(contract.reservedMint(user1.address, quantity)).to.emit(
        contract,
        "Transfer"
      );
    });
  });
});
