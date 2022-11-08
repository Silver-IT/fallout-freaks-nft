import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { smock } from "@defi-wonderland/smock";

import {
  StandardERC721__factory,
  StandardERC1155__factory,
} from "../../../typechain";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  beforeEach(async function () {
    await expect(ctx.falloutContract.startAllowListMint()).to.emit(
      ctx.falloutContract,
      "AllowListMintBegins"
    );
  });

  it("should not be mintable with zero quantity and not enough value", async () => {
    const randomness_ = "920220";
    const salt = ethers.utils.formatBytes32String(randomness_);
    const root = ctx.merkleTree.getHexRoot();
    await expect(ctx.falloutContract.setMerkleRoot(root)).to.not.be.reverted;

    const leaf = ctx.leavesLookup[ctx.user1.address];
    const merkleProof = ctx.merkleTree.getHexProof(leaf);

    // Zero quantity
    const apiSignature1 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, 0]
    );

    const price = await ctx.falloutContract.MINT_PRICE();

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .allowListRandomMint(apiSignature1, salt, merkleProof, 0, {
          value: 0,
        })
    ).to.be.revertedWith("MustMintMinimumOne");

    // Not enough value
    const apiSignature2 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, 3]
    );

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .allowListRandomMint(apiSignature2, salt, merkleProof, 3, {
          value: 0,
        })
    ).to.be.revertedWith("NotEnoughEthProvided");
  });

  it("should be successful to allowListRandomMint and be succesfully taken the mint details", async () => {
    const quantity = 3;
    const randomness_ = "661222";
    const salt = ethers.utils.formatBytes32String(randomness_);
    const root = ctx.merkleTree.getHexRoot();
    await expect(ctx.falloutContract.setMerkleRoot(root)).to.not.be.reverted;

    const leaf = ctx.leavesLookup[ctx.user1.address];
    const merkleProof = ctx.merkleTree.getHexProof(leaf);

    const apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, quantity]
    );

    const price = await ctx.falloutContract.MINT_PRICE();

    // allowListRandomMint function call with signature
    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .allowListRandomMint(apiSignature, salt, merkleProof, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(
      (await ctx.falloutContract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    // [ originalId, level, mintType, mutationId, aux ]
    const [originalId1, level1, mintType1, mutationId1, aux1] =
      await ctx.falloutContract.getMintDetails(0); // 0, 1, 0, 0, 0
    expect(originalId1).to.be.eq(0);
    expect(level1).to.be.greaterThan(0);
    expect(mintType1).to.be.eq(0);
    expect(mutationId1).to.be.eq(0);
    expect(aux1).to.be.eq(0);
    const [originalId2, level2, mintType2, mutationId2, aux2] =
      await ctx.falloutContract.getMintDetails(1); // 0, 2, 0, 0, 0
    expect(originalId2).to.be.eq(0);
    expect(level2).to.be.greaterThan(0);
    expect(mintType2).to.be.eq(0);
    expect(mutationId2).to.be.eq(level1 == level2 ? 1 : 0);
    expect(aux2).to.be.eq(0);
    const [originalId3, level3, mintType3, mutationId3, aux3] =
      await ctx.falloutContract.getMintDetails(2); // 0, 1, 0, 1, 0
    expect(originalId3).to.be.eq(0);
    expect(level3).to.be.greaterThan(0);
    expect(mintType3).to.be.eq(0);
    expect(mutationId3).to.be.greaterThan(0);
    expect(aux3).to.be.eq(0);

    // console.log([originalId1, level1, mintType1, mutationId1, aux1]);
    // console.log([originalId2, level2, mintType2, mutationId2, aux2]);
    // console.log([originalId3, level3, mintType3, mutationId3, aux3]);
  });

  it("should be successful to publicRandomMint and be succesfully taken the mint details", async () => {
    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );

    const quantity = 3;
    const randomness_ = "901227";
    const salt = ethers.utils.formatBytes32String(randomness_);
    const apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user2.address,
      salt,
      ["uint8"],
      [quantity]
    );

    const price = await ctx.falloutContract.MINT_PRICE();

    // publicRandomMint function call with signature
    await expect(
      ctx.falloutContract
        .connect(ctx.user2)
        .publicRandomMint(apiSignature, salt, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(
      (await ctx.falloutContract.balanceOf(ctx.user2.address)).toNumber()
    ).to.be.eq(quantity);

    // [ originalId, level, mintType, mutationId, aux ]
    const [originalId1, level1, mintType1, mutationId1, aux1] =
      await ctx.falloutContract.getMintDetails(0);
    expect(originalId1).to.be.eq(0);
    expect(level1).to.be.greaterThan(0);
    expect(mintType1).to.be.eq(0);
    expect(mutationId1).to.be.eq(0);
    expect(aux1).to.be.eq(0);
    const [originalId2, level2, mintType2, mutationId2, aux2] =
      await ctx.falloutContract.getMintDetails(1);
    expect(originalId2).to.be.eq(0);
    expect(level2).to.be.greaterThan(0);
    expect(mintType2).to.be.eq(0);
    expect(mutationId2).to.be.eq(level1 == level2 ? 1 : 0);
    expect(aux2).to.be.eq(0);
    const [originalId3, level3, mintType3, mutationId3, aux3] =
      await ctx.falloutContract.getMintDetails(2);
    expect(originalId3).to.be.eq(0);
    expect(level3).to.be.greaterThan(0);
    expect(mintType3).to.be.eq(0);
    expect(mutationId3).to.be.greaterThan(0);
    expect(aux3).to.be.eq(0);

    // console.log([originalId1, level1, mintType1, mutationId1, aux1]);
    // console.log([originalId2, level2, mintType2, mutationId2, aux2]);
    // console.log([originalId3, level3, mintType3, mutationId3, aux3]);
  });

  it("should be discount for the genesis and motor club token holders", async () => {
    // Jungle Freaks Genesis Mock
    const jfgMockContractFactory = await smock.mock<StandardERC721__factory>(
      "StandardERC721",
      ctx.owner
    );
    const jfgMockContract = await jfgMockContractFactory.deploy();
    jfgMockContract.balanceOf.whenCalledWith(ctx.user1.address).returns(1);
    jfgMockContract.balanceOf.whenCalledWith(ctx.user2.address).returns(2);

    // Jungle Freaks Mortor Club Mock
    const jfmcMockContractFactory = await smock.mock<StandardERC721__factory>(
      "StandardERC721",
      ctx.owner
    );
    const jfmcMockContract = await jfmcMockContractFactory.deploy();
    jfmcMockContract.balanceOf.whenCalledWith(ctx.user1.address).returns(3);
    jfmcMockContract.balanceOf.whenCalledWith(ctx.user3.address).returns(4);

    const mockContract = await ctx.mockFalloutContractFactory.deploy(
      ctx.signer.address,
      ctx.mod.address,
      ctx.royaltyReceiver.address,
      jfgMockContract.address,
      jfmcMockContract.address,
      ctx.crystalContract.address,
      ctx.jungleContract.address,
      ctx.preAuthorizedAddresses
    );
    await mockContract.deployed();
    await expect(mockContract.startAllowListMint()).to.emit(
      mockContract,
      "AllowListMintBegins"
    );

    // Genesis + Motor Club holder with Allow List Mint
    const salt1 = ethers.utils.formatBytes32String("920220");
    const root = ctx.merkleTree.getHexRoot();
    await expect(mockContract.setMerkleRoot(root)).to.not.be.reverted;

    const leaf1 = ctx.leavesLookup[ctx.user1.address];
    const merkleProof1 = ctx.merkleTree.getHexProof(leaf1);

    const apiSignature1 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt1,
      ["bytes32[]", "uint8"],
      [merkleProof1, 2]
    );

    await expect(
      mockContract
        .connect(ctx.user1)
        .allowListRandomMint(apiSignature1, salt1, merkleProof1, 2, {
          value: ethers.utils.parseEther("0.2"),
        })
    ).to.emit(mockContract, "Transfer");

    // Genesis holder with Allow List Mint
    const salt2 = ethers.utils.formatBytes32String("901227");
    const leaf2 = ctx.leavesLookup[ctx.user2.address];
    const merkleProof2 = ctx.merkleTree.getHexProof(leaf2);
    const apiSignature2 = await signMintRequest(
      ctx.signer,
      ctx.user2.address,
      salt2,
      ["bytes32[]", "uint8"],
      [merkleProof2, 1]
    );

    await expect(
      mockContract
        .connect(ctx.user2)
        .allowListRandomMint(apiSignature2, salt2, merkleProof2, 1, {
          value: ethers.utils.parseEther("0.11"),
        })
    ).to.emit(mockContract, "Transfer");

    // Motor Club holder with Public Mint
    await expect(mockContract.startPublicMint()).to.emit(
      mockContract,
      "PublicMintBegins"
    );
    const salt3 = ethers.utils.formatBytes32String("940315");
    const apiSignature3 = await signMintRequest(
      ctx.signer,
      ctx.user3.address,
      salt3,
      ["uint8"],
      [3]
    );

    // publicRandomMint function call with signature
    await expect(
      mockContract
        .connect(ctx.user3)
        .publicRandomMint(apiSignature3, salt3, 3, {
          value: ethers.utils.parseEther("0.36"),
        })
    ).to.emit(mockContract, "Transfer");
  });
}
