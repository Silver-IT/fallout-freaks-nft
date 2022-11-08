import { expect } from "chai";
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
      await ctx.falloutContract.hasRole(DEFAULT_ADMIN_ROLE, ctx.owner.address)
    ).to.eq(true);

    await expect(
      ctx.falloutContract.transferOwnership(ctx.approved.address)
    ).to.emit(ctx.falloutContract, "OwnershipTransferred");

    expect(
      await ctx.falloutContract.hasRole(
        DEFAULT_ADMIN_ROLE,
        ctx.approved.address
      )
    ).to.eq(true);

    expect(
      await ctx.falloutContract.hasRole(DEFAULT_ADMIN_ROLE, ctx.owner.address)
    ).to.eq(false);

    expect(
      await ctx.falloutContract.hasRole(DEFAULT_ADMIN_ROLE, ctx.admin.address)
    ).to.eq(true);
  });

  it("should grant DEFAULT_ADMIN_ROLE after ownership transfer", async () => {
    await expect(
      ctx.falloutContract.transferOwnership(ctx.approved.address)
    ).to.emit(ctx.falloutContract, "OwnershipTransferred");

    expect(
      await ctx.falloutContract
        .connect(ctx.approved)
        .grantRole(DEFAULT_ADMIN_ROLE, ctx.user1.address)
    ).to.emit(ctx.falloutContract, "RoleGranted");

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .setBaseURI("ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/")
    ).to.emit(ctx.falloutContract, "BaseURIUpdated");

    expect(
      await ctx.falloutContract
        .connect(ctx.approved)
        .revokeRole(DEFAULT_ADMIN_ROLE, ctx.user1.address)
    ).to.emit(ctx.falloutContract, "RoleRevoked");

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .setBaseURI("ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/")
    ).to.be.revertedWith("NotAdminOrModerator");
  });

  it("should grant MODERATOR_ROLE after ownership transfer", async () => {
    await expect(
      ctx.falloutContract.transferOwnership(ctx.approved.address)
    ).to.emit(ctx.falloutContract, "OwnershipTransferred");

    expect(
      await ctx.falloutContract
        .connect(ctx.approved)
        .grantRole(MODERATOR_ROLE, ctx.user1.address)
    ).to.emit(ctx.falloutContract, "RoleGranted");

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .setBaseURI("ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/")
    ).to.emit(ctx.falloutContract, "BaseURIUpdated");

    expect(
      await ctx.falloutContract
        .connect(ctx.approved)
        .revokeRole(MODERATOR_ROLE, ctx.user1.address)
    ).to.emit(ctx.falloutContract, "RoleRevoked");

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .setBaseURI("ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/")
    ).to.be.revertedWith("NotAdminOrModerator");
  });
}
