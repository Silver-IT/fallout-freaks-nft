import { expect } from "chai";
import { ethers } from "hardhat";

export default function suite() {
  const NOT_STARTED = 0;
  const ACTIVE = 1;
  const PAUSED = 2;
  const FINISHED = 3;

  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should end sale after allow list mint", async () => {
    await expect(ctx.falloutContract.endMint()).to.be.revertedWith(
      "NoActiveSale"
    );

    await expect(ctx.falloutContract.startAllowListMint()).to.emit(
      ctx.falloutContract,
      "AllowListMintBegins"
    );

    await expect(ctx.falloutContract.endMint()).to.emit(
      ctx.falloutContract,
      "MintEnds"
    );
  });

  it("should end sale after public mint", async () => {
    await expect(ctx.falloutContract.endMint()).to.be.revertedWith(
      "NoActiveSale"
    );

    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );

    await expect(ctx.falloutContract.endMint()).to.emit(
      ctx.falloutContract,
      "MintEnds"
    );
  });

  it("should end sale after crystal mutation mint", async () => {
    await expect(ctx.falloutContract.endMint()).to.be.revertedWith(
      "NoActiveSale"
    );

    await expect(ctx.falloutContract.startCrystalMutationMint()).to.emit(
      ctx.falloutContract,
      "CrystalMutationMintBegins"
    );

    await expect(ctx.falloutContract.endMint()).to.emit(
      ctx.falloutContract,
      "MintEnds"
    );
  });

  it("end sale no longer allows change of sale state", async () => {
    await expect(ctx.falloutContract.startAllowListMint()).to.emit(
      ctx.falloutContract,
      "AllowListMintBegins"
    );

    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );

    await expect(ctx.falloutContract.startCrystalMutationMint()).to.emit(
      ctx.falloutContract,
      "CrystalMutationMintBegins"
    );

    await expect(ctx.falloutContract.endMint()).to.emit(
      ctx.falloutContract,
      "MintEnds"
    );

    await expect(ctx.falloutContract.startAllowListMint()).to.be.revertedWith(
      "AllSalesFinished"
    );

    await expect(ctx.falloutContract.startPublicMint()).to.be.revertedWith(
      "AllSalesFinished"
    );

    await expect(
      ctx.falloutContract.startCrystalMutationMint()
    ).to.be.revertedWith("AllSalesFinished");

    await expect(ctx.falloutContract.endMint()).to.be.revertedWith(
      "AllSalesFinished"
    );
  });

  it("should set correct values for each sale state", async () => {
    expect(await ctx.falloutContract.getSaleType()).to.eql("None");

    await expect(ctx.falloutContract.startAllowListMint()).to.emit(
      ctx.falloutContract,
      "AllowListMintBegins"
    );

    expect(await ctx.falloutContract.getSaleType()).to.be.eql(
      "AllowListRandomMint"
    );

    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );

    expect(await ctx.falloutContract.getSaleType()).to.be.eql(
      "PublicRandomMint"
    );

    await expect(ctx.falloutContract.startCrystalMutationMint()).to.emit(
      ctx.falloutContract,
      "CrystalMutationMintBegins"
    );

    expect(await ctx.falloutContract.getSaleType()).to.be.eql(
      "CrystalMutationMint"
    );

    await expect(ctx.falloutContract.endMint()).to.emit(
      ctx.falloutContract,
      "MintEnds"
    );

    expect(await ctx.falloutContract.getSaleType()).to.be.eql("Finished");
    expect(await ctx.falloutContract.getSaleState()).to.be.eql(FINISHED);
  });

  it("pauses a sale state", async () => {
    await expect(ctx.falloutContract.startAllowListMint()).to.emit(
      ctx.falloutContract,
      "AllowListMintBegins"
    );
    await expect(ctx.falloutContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.falloutContract.getSaleState()).to.be.eql(PAUSED);

    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );
    await expect(ctx.falloutContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.falloutContract.getSaleState()).to.be.eql(PAUSED);

    await expect(ctx.falloutContract.startCrystalMutationMint()).to.emit(
      ctx.falloutContract,
      "CrystalMutationMintBegins"
    );
    await expect(ctx.falloutContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.falloutContract.getSaleState()).to.be.eql(PAUSED);
  });

  it("unpauses a paused sale state", async () => {
    await expect(ctx.falloutContract.startAllowListMint()).to.emit(
      ctx.falloutContract,
      "AllowListMintBegins"
    );
    await expect(ctx.falloutContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.falloutContract.getSaleState()).to.be.eql(PAUSED);
    expect(await ctx.falloutContract.getSaleType()).to.be.eql(
      "AllowListRandomMint"
    );
    await expect(ctx.falloutContract.unpauseMint()).to.not.be.reverted;
    expect(await ctx.falloutContract.getSaleState()).to.be.eql(ACTIVE);
    expect(await ctx.falloutContract.getSaleType()).to.be.eql(
      "AllowListRandomMint"
    );

    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );
    await expect(ctx.falloutContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.falloutContract.getSaleState()).to.be.eql(PAUSED);
    expect(await ctx.falloutContract.getSaleType()).to.be.eql(
      "PublicRandomMint"
    );
    await expect(ctx.falloutContract.unpauseMint()).to.not.be.reverted;
    expect(await ctx.falloutContract.getSaleState()).to.be.eql(ACTIVE);
    expect(await ctx.falloutContract.getSaleType()).to.be.eql(
      "PublicRandomMint"
    );

    await expect(ctx.falloutContract.startCrystalMutationMint()).to.emit(
      ctx.falloutContract,
      "CrystalMutationMintBegins"
    );
    await expect(ctx.falloutContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.falloutContract.getSaleState()).to.be.eql(PAUSED);
    expect(await ctx.falloutContract.getSaleType()).to.be.eql(
      "CrystalMutationMint"
    );
    await expect(ctx.falloutContract.unpauseMint()).to.not.be.reverted;
    expect(await ctx.falloutContract.getSaleState()).to.be.eql(ACTIVE);
    expect(await ctx.falloutContract.getSaleType()).to.be.eql(
      "CrystalMutationMint"
    );
  });

  it("can not pause a paused sale state", async () => {
    await expect(ctx.falloutContract.startAllowListMint()).to.emit(
      ctx.falloutContract,
      "AllowListMintBegins"
    );
    await expect(ctx.falloutContract.pauseMint()).to.not.be.reverted;
    await expect(ctx.falloutContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );

    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );
    await expect(ctx.falloutContract.pauseMint()).to.not.be.reverted;
    await expect(ctx.falloutContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );

    await expect(ctx.falloutContract.startCrystalMutationMint()).to.emit(
      ctx.falloutContract,
      "CrystalMutationMintBegins"
    );
    await expect(ctx.falloutContract.pauseMint()).to.not.be.reverted;
    await expect(ctx.falloutContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );
  });

  it("can not unpause an active sale state", async () => {
    await expect(ctx.falloutContract.startAllowListMint()).to.emit(
      ctx.falloutContract,
      "AllowListMintBegins"
    );
    await expect(ctx.falloutContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );

    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );
    await expect(ctx.falloutContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );

    await expect(ctx.falloutContract.startCrystalMutationMint()).to.emit(
      ctx.falloutContract,
      "CrystalMutationMintBegins"
    );
    await expect(ctx.falloutContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );
  });

  it("can not change pause state when no sale active", async () => {
    await expect(ctx.falloutContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );
    await expect(ctx.falloutContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );

    await expect(ctx.falloutContract.startCrystalMutationMint()).to.emit(
      ctx.falloutContract,
      "CrystalMutationMintBegins"
    );
    await expect(ctx.falloutContract.startAllowListMint()).to.emit(
      ctx.falloutContract,
      "AllowListMintBegins"
    );
    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );
    await expect(ctx.falloutContract.endMint()).to.emit(
      ctx.falloutContract,
      "MintEnds"
    );

    await expect(ctx.falloutContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );
    await expect(ctx.falloutContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );
  });
}
