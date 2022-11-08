import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { smock } from "@defi-wonderland/smock";
import { FalloutCrystal__factory, FalloutFreaks__factory } from "../typechain";

before(async function () {
  // Set wallet context
  const [
    owner,
    signer,
    approved,
    admin,
    mod,
    royaltyReceiver,
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
  this.owner = owner;
  this.signer = signer;
  this.approved = approved;
  this.admin = admin;
  this.mod = mod;
  this.royaltyReceiver = royaltyReceiver;
  this.user1 = user1;
  this.user2 = user2;
  this.user3 = user3;
  this.user4 = user4;
  this.user5 = user5;
  this.user6 = user6;
  this.user7 = user7;
  this.user8 = user8;
  this.user9 = user9;

  this.StandardERC20Factory = await ethers.getContractFactory(
    "StandardERC20",
    owner
  );

  // // Jungle Freaks Contract Mock (ERC721)
  // this.jfContractFactory = await ethers.getContractFactory(
  //   "StandardERC721",
  //   owner
  // );

  // Jungle Freaks Genesis Contract Mock (ERC721)
  this.jfgContractFactory = await ethers.getContractFactory(
    "StandardERC721",
    owner
  );

  // Legendary Jungle Freaks Contract Mock (ERC1155 - OpenSea StoreFront)
  this.jflContractFactory = await ethers.getContractFactory(
    "StandardERC1155",
    owner
  );

  // Royalty Receiver
  this.rrContractFactory = await ethers.getContractFactory(
    "FalloutFreaksRoyaltyReceiver",
    owner
  );

  // Jungle Contract
  this.jungleContractFactory = await ethers.getContractFactory(
    "InsecureJungle",
    owner
  );

  // Jungle Freaks Motor Club Contract Mock (ERC1155 - OpenSea StoreFront)
  this.jfmcContractFactory = await ethers.getContractFactory(
    "StandardERC721",
    owner
  );

  // Set up test contract
  this.crystalContractFactory = await ethers.getContractFactory(
    "FalloutCrystal",
    owner
  );

  // Set up mock test contract
  this.mockCrystalContractFactory = await smock.mock<FalloutCrystal__factory>(
    "FalloutCrystal",
    owner
  );

  // Set up test contract
  this.falloutContractFactory = await ethers.getContractFactory(
    "FalloutFreaks",
    owner
  );

  // Set up mock test contract
  this.mockFalloutContractFactory = await smock.mock<FalloutFreaks__factory>(
    "FalloutFreaks",
    owner
  );

  // Allow list tests
  this.allowList = [
    owner.address,
    signer.address,
    approved.address,
    user1.address,
    user2.address,
    user3.address,
    user4.address,
    user5.address,
  ];

  this.leavesLookup = Object.fromEntries(
    this.allowList.map((address: string) => [
      address,
      ethers.utils.solidityKeccak256(["address"], [address]),
    ])
  );

  this.merkleTree = new MerkleTree(
    Object.values(this.leavesLookup),
    keccak256,
    {
      sortPairs: true,
    }
  );

  this.legendaryCOFT =
    "64396628092031731206525383750081342765665389133291640817070595755125256486927";
  this.legendaryMTFM =
    "64396628092031731206525383750081342765665389133291640817070595754025744859163";

  this.brokenWalletFactory = await ethers.getContractFactory(
    "BrokenWallet",
    owner
  );

  // TODO: need to add something
  this.preAuthorizedAddresses = [];
});
