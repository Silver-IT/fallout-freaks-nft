import { expect } from "chai";
import { ethers } from "hardhat";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should burn a token", async () => {
    const quantity = 10;
    const randomness_ = "901227";

    await expect(
      ctx.falloutContract.reservedRandomMint(
        ethers.utils.formatBytes32String(randomness_),
        ctx.user1.address,
        quantity
      )
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(
      (await ctx.falloutContract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.falloutContract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }

    await expect(ctx.falloutContract.connect(ctx.user1).burn(4)).to.emit(
      ctx.falloutContract,
      "Transfer"
    );

    expect(
      (await ctx.falloutContract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity - 1);

    expect((await ctx.falloutContract.totalSupply()).toNumber()).to.be.eq(
      quantity - 1
    );

    expect(await ctx.falloutContract.ownerOf(3)).to.be.eq(ctx.user1.address);

    await expect(ctx.falloutContract.ownerOf(4)).to.be.revertedWith(
      "OwnerQueryForNonexistentToken"
    );

    expect(await ctx.falloutContract.ownerOf(5)).to.be.eq(ctx.user1.address);
  });

  it("should fail to burn a token because it's called by the wrong user", async () => {
    const quantity = 10;
    const randomness_ = "920220";
    await expect(
      ctx.falloutContract.reservedRandomMint(
        ethers.utils.formatBytes32String(randomness_),
        ctx.user1.address,
        quantity
      )
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(
      (await ctx.falloutContract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.falloutContract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }

    await expect(
      ctx.falloutContract.connect(ctx.user2).burn(4)
    ).to.be.revertedWith("TransferCallerNotOwnerNorApproved");
  });

  it("should burn a token because it's called by an approved user", async () => {
    const quantity = 10;
    const randomness_ = "920220";
    await expect(
      ctx.falloutContract.reservedRandomMint(
        ethers.utils.formatBytes32String(randomness_),
        ctx.user1.address,
        quantity
      )
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(
      (await ctx.falloutContract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.falloutContract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.approved.address, true)
    ).to.emit(ctx.falloutContract, "ApprovalForAll");

    await expect(ctx.falloutContract.connect(ctx.approved).burn(4)).to.emit(
      ctx.falloutContract,
      "Transfer"
    );
  });
}
