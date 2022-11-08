import { expect } from "chai";
import { BigNumber } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers } from "hardhat";
import keccak256 from "keccak256";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

  it("should transfer ownership", async () => {
    expect(
      await ctx.crystalContract.hasRole(DEFAULT_ADMIN_ROLE, ctx.owner.address)
    ).to.eq(true);
    await expect(
      ctx.crystalContract.transferOwnership(ctx.approved.address)
    ).to.emit(ctx.crystalContract, "OwnershipTransferred");
    expect(
      await ctx.crystalContract.hasRole(
        DEFAULT_ADMIN_ROLE,
        ctx.approved.address
      )
    ).to.eq(true);
    expect(
      await ctx.crystalContract.hasRole(DEFAULT_ADMIN_ROLE, ctx.owner.address)
    ).to.eq(false);

    expect(
      await ctx.crystalContract.hasRole(DEFAULT_ADMIN_ROLE, ctx.admin.address)
    ).to.eq(true);
  });

  it("should grant DEFAULT_ADMIN_ROLE after ownership transfer", async () => {
    await expect(
      ctx.crystalContract.transferOwnership(ctx.approved.address)
    ).to.emit(ctx.crystalContract, "OwnershipTransferred");

    expect(
      await ctx.crystalContract
        .connect(ctx.approved)
        .grantRole(DEFAULT_ADMIN_ROLE, ctx.user1.address)
    ).to.emit(ctx.crystalContract, "RoleGranted");

    await expect(
      ctx.crystalContract.connect(ctx.user1).startPhase2Mint()
    ).to.emit(ctx.crystalContract, "Phase2MintBegins");

    expect(
      await ctx.crystalContract
        .connect(ctx.approved)
        .revokeRole(DEFAULT_ADMIN_ROLE, ctx.user1.address)
    ).to.emit(ctx.crystalContract, "RoleRevoked");

    await expect(
      ctx.crystalContract.connect(ctx.user1).startPhase2Mint()
    ).to.be.revertedWith("NotAdminOrModerator");
  });

  it("should grant MODERATOR_ROLE after ownership transfer", async () => {
    await expect(
      ctx.crystalContract.transferOwnership(ctx.approved.address)
    ).to.emit(ctx.crystalContract, "OwnershipTransferred");

    expect(
      await ctx.crystalContract
        .connect(ctx.approved)
        .grantRole(MODERATOR_ROLE, ctx.user1.address)
    ).to.emit(ctx.crystalContract, "RoleGranted");

    await expect(
      ctx.crystalContract.connect(ctx.user1).startPhase2Mint()
    ).to.emit(ctx.crystalContract, "Phase2MintBegins");

    expect(
      await ctx.crystalContract
        .connect(ctx.approved)
        .revokeRole(MODERATOR_ROLE, ctx.user1.address)
    ).to.emit(ctx.crystalContract, "RoleRevoked");

    await expect(
      ctx.crystalContract.connect(ctx.user1).startPhase2Mint()
    ).to.be.revertedWith("NotAdminOrModerator");
  });
}
