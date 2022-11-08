import { expect } from "chai";
import { randomBytes } from "crypto";
import { ethers } from "hardhat";
import { smock } from "@defi-wonderland/smock";

import {
  StandardERC721__factory,
  StandardERC1155__factory,
  Signature,
} from "../../../typechain";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  let salt: string;
  beforeEach(async function () {
    // Default mints
    salt = "0x" + randomBytes(32).toString("hex");
  });

  it("should be successful to crystalMutationMint and be succesfully taken the mint details", async () => {
    const originalTokenIdsForUser1 = [
      101, 102, 103, 104, 105, 106, 107, 108, 109,
    ];
    const numberOfCrystals = 5;
    // Jungle Freaks Genesis Mock
    const jfgMockContractFactory = await smock.mock<StandardERC721__factory>(
      "StandardERC721",
      ctx.owner
    );
    const jfgMockContract = await jfgMockContractFactory.deploy();
    for (const ogTokenId of originalTokenIdsForUser1) {
      jfgMockContract.ownerOf
        .whenCalledWith(ogTokenId)
        .returns(ctx.user1.address);
    }
    jfgMockContract.ownerOf.whenCalledWith(301).returns(ctx.user3.address);

    // Jungle Freaks Crystal Mock
    const jfcMockContractFactory = await smock.mock<StandardERC1155__factory>(
      "StandardERC1155",
      ctx.owner
    );
    const jfcMockContract = await jfcMockContractFactory.deploy();
    for (const crystalTokenId of [1, 2, 3]) {
      jfcMockContract.balanceOf
        .whenCalledWith(ctx.user1.address, crystalTokenId)
        .returns(numberOfCrystals);
      jfcMockContract.burn
        .whenCalledWith(ctx.user1.address, crystalTokenId, 1)
        .returns();
    }

    // Jungle Freaks Mortor Club Mock
    const jfmcMockContractFactory = await smock.mock<StandardERC721__factory>(
      "StandardERC721",
      ctx.owner
    );
    const jfmcMockContract = await jfmcMockContractFactory.deploy();

    const mockContract = await ctx.mockFalloutContractFactory.deploy(
      ctx.signer.address,
      ctx.mod.address,
      ctx.royaltyReceiver.address,
      jfgMockContract.address,
      jfmcMockContract.address,
      jfcMockContract.address,
      ctx.jungleContract.address,
      ctx.preAuthorizedAddresses
    );
    await mockContract.deployed();

    await expect(mockContract.startCrystalMutationMint()).to.emit(
      mockContract,
      "CrystalMutationMintBegins"
    );

    const salt1 = ethers.utils.formatBytes32String("920220");
    const apiSignature1 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt1,
      ["uint32", "uint8"],
      [101, 1]
    );
    await expect(
      mockContract
        .connect(ctx.user1)
        .crystalMutationMint(apiSignature1, salt1, 101, 1)
    ).to.emit(mockContract, "Transfer");
    const [originalId1, level1, mintType1, mutationId1, aux1] =
      await mockContract.getMintDetails(0); // 101, 1, 1, 0, 0
    expect(originalId1).to.be.eq(101);
    expect(level1).to.be.eq(1);
    expect(mintType1).to.be.eq(1);
    expect(mutationId1).to.be.eq(0);
    expect(aux1).to.be.eq(0);

    const salt2 = ethers.utils.formatBytes32String("901227");
    const apiSignature2 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt2,
      ["uint32", "uint8"],
      [102, 1]
    );
    await expect(
      mockContract
        .connect(ctx.user1)
        .crystalMutationMint(apiSignature2, salt2, 102, 1)
    ).to.emit(mockContract, "Transfer");
    const [originalId2, level2, mintType2, mutationId2, aux2] =
      await mockContract.getMintDetails(1); // 102, 1, 1, 0, 0
    expect(originalId2).to.be.eq(102);
    expect(level2).to.be.eq(1);
    expect(mintType2).to.be.eq(1);
    expect(mutationId2).to.be.eq(0);
    expect(aux2).to.be.eq(0);

    const salt3 = ethers.utils.formatBytes32String("940315");
    const apiSignature3 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt3,
      ["uint32", "uint8"],
      [101, 2]
    );
    await expect(
      mockContract
        .connect(ctx.user1)
        .crystalMutationMint(apiSignature3, salt3, 101, 2)
    ).to.emit(mockContract, "Transfer");
    const [originalId3, level3, mintType3, mutationId3, aux3] =
      await mockContract.getMintDetails(2); // 101, 2, 1, 0, 0
    expect(originalId3).to.be.eq(101);
    expect(level3).to.be.eq(2);
    expect(mintType3).to.be.eq(1);
    expect(mutationId3).to.be.eq(0);
    expect(aux3).to.be.eq(0);

    const salt4 = ethers.utils.formatBytes32String("920114");
    const apiSignature4 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt4,
      ["uint32", "uint8"],
      [101, 1]
    );
    await expect(
      mockContract
        .connect(ctx.user1)
        .crystalMutationMint(apiSignature4, salt4, 101, 1)
    ).to.be.revertedWith("AlreadyUsedMutation");

    const salt5 = ethers.utils.formatBytes32String("951109");
    const apiSignature5 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt5,
      ["uint32", "uint8"],
      [100, 1]
    );
    await expect(
      mockContract
        .connect(ctx.user1)
        .crystalMutationMint(apiSignature5, salt5, 100, 1)
    ).to.be.revertedWith("ERC721: owner query for nonexistent token");

    const salt6 = ethers.utils.formatBytes32String("920814");
    const apiSignature6 = await signMintRequest(
      ctx.signer,
      ctx.user2.address,
      salt6,
      ["uint32", "uint8"],
      [101, 1]
    );
    await expect(
      mockContract
        .connect(ctx.user2)
        .crystalMutationMint(apiSignature6, salt6, 101, 1)
    ).to.be.revertedWith("NotGenesisOwner");

    const salt7 = ethers.utils.formatBytes32String("910427");
    const apiSignature7 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt7,
      ["uint32", "uint8"],
      [101, 3]
    );
    await expect(
      mockContract
        .connect(ctx.user1)
        .crystalMutationMint(apiSignature7, salt7, 101, 3)
    ).to.emit(mockContract, "Transfer");
    const [originalId4, level4, mintType4, mutationId4, aux4] =
      await mockContract.getMintDetails(3); // 101, 3, 1, 0, 0
    expect(originalId4).to.be.eq(101);
    expect(level4).to.be.eq(3);
    expect(mintType4).to.be.eq(1);
    expect(mutationId4).to.be.eq(0);
    expect(aux4).to.be.eq(0);

    const salt8 = ethers.utils.formatBytes32String("920102");
    const apiSignature8 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt8,
      ["uint32", "uint8"],
      [104, 3]
    );
    await expect(
      mockContract
        .connect(ctx.user1)
        .crystalMutationMint(apiSignature8, salt8, 104, 3)
    ).to.emit(mockContract, "Transfer");
    const [originalId5, level5, mintType5, mutationId5, aux5] =
      await mockContract.getMintDetails(4); // 104, 3, 1, 1, 0
    expect(originalId5).to.be.eq(104);
    expect(level5).to.be.eq(3);
    expect(mintType5).to.be.eq(1);
    expect(mutationId5).to.be.eq(1);
    expect(aux5).to.be.eq(0);

    const salt9 = ethers.utils.formatBytes32String("950107");
    const apiSignature9 = await signMintRequest(
      ctx.signer,
      ctx.user3.address,
      salt9,
      ["uint32", "uint8"],
      [301, 1]
    );
    await expect(
      mockContract
        .connect(ctx.user3)
        .crystalMutationMint(apiSignature9, salt9, 301, 1)
    ).to.be.revertedWith("NotCrystalOwner");

    const salt10 = ethers.utils.formatBytes32String("960302");
    const apiSignature10 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt10,
      ["uint32", "uint8"],
      [101, 2]
    );
    await expect(
      mockContract
        .connect(ctx.user1)
        .crystalMutationMint(apiSignature10, salt10, 101, 2)
    ).to.be.revertedWith("AlreadyUsedMutation");

    const salt11 = ethers.utils.formatBytes32String("960315");
    const apiSignature11 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt11,
      ["uint32", "uint8"],
      [101, 3]
    );
    await expect(
      mockContract
        .connect(ctx.user1)
        .crystalMutationMint(apiSignature11, salt11, 101, 3)
    ).to.be.revertedWith("AlreadyUsedMutation");
  });

  it("should fail to crystalMutationMint", async () => {
    // contract setup
    await expect(
      ctx.crystalContract.setAuthorizedAddress(
        ctx.falloutContract.address,
        true
      )
    ).to.not.be.reverted;
    await expect(
      ctx.jungleContract.setAuthorizedAddress(ctx.crystalContract.address, true)
    ).to.not.be.reverted;
    await expect(ctx.jungleContract.toggle()).to.not.be.reverted;
    expect(await ctx.jungleContract.live()).to.be.eq(true);
    await expect(ctx.crystalContract.startPhase2Mint()).to.not.be.reverted;
    await expect(ctx.falloutContract.startCrystalMutationMint()).to.not.be
      .reverted;

    // Mint
    const jungle = ethers.utils.parseEther("0");
    const price = ethers.utils.parseEther("0.13");
    const quantity = 3;

    // User 1
    {
      const apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256", "uint256"],
        [jungle.mul(quantity), quantity]
      );

      await ctx.jfgContract.safeMintTo(ctx.user1.address, quantity);
      await ctx.jfgContract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.jungleContract.address, true);

      await ctx.jungleContract.connect(ctx.user1).stakeById(["1"]);

      await expect(
        ctx.crystalContract
          .connect(ctx.user1)
          .phase2Mint(apiSignature, salt, jungle.mul(quantity), quantity, {
            value: price.mul(quantity),
          })
      ).to.emit(ctx.crystalContract, "TransferSingle");

      expect(
        (await ctx.crystalContract.balanceOf(ctx.user1.address, 1)).toNumber()
      ).to.be.greaterThan(0);
    }

    // User 1 mints with their genesis and crystal tokens
    const apiSignature1 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint32", "uint8"],
      ["0", "1"]
    );

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .crystalMutationMint(apiSignature1, salt, 0, 1)
    ).to.emit(ctx.falloutContract, "Transfer");

    // User 2 mints with their genesis and crystal tokens
    const apiSignature2 = await signMintRequest(
      ctx.signer,
      ctx.user2.address,
      salt,
      ["uint32", "uint8"],
      ["5", "1"]
    );

    await ctx.jfgContract.safeMintTo(ctx.user2.address, 3);

    await expect(
      ctx.falloutContract
        .connect(ctx.user2)
        .crystalMutationMint(apiSignature2, salt, 5, 1)
    ).to.be.revertedWith("NotCrystalOwner()");
  });
}
