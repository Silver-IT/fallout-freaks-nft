import { expect } from "chai";
import { formatBytes32String } from "ethers/lib/utils";
import { randomBytes } from "crypto";
import { ethers } from "hardhat";
import keccak256 from "keccak256";

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
    await expect(
      ctx.falloutContract.reservedRandomMint(salt, ctx.user8.address, 10)
    ).to.emit(ctx.falloutContract, "Transfer");
  });

  it("should allow admin to update authorized addresses", async () => {
    await expect(
      ctx.falloutContract.setAuthorizedAddress(ctx.user1.address, true)
    ).to.not.be.reverted;

    await expect(
      ctx.falloutContract
        .connect(ctx.mod)
        .setAuthorizedAddress(ctx.user1.address, false)
    ).to.be.revertedWith("NotAdminOrOwner");

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.user1.address, false)
    ).to.be.revertedWith("NotAdminOrOwner");
  });

  it("should burn a token because it's called by a pre authorized user", async () => {
    await expect(
      ctx.falloutContract.setAuthorizedAddress(ctx.user8.address, true)
    ).to.not.be.reverted;

    await expect(ctx.falloutContract.connect(ctx.user7).burn(1)).to.be.reverted;

    await expect(ctx.falloutContract.connect(ctx.user8).burn(2)).to.emit(
      ctx.falloutContract,
      "Transfer"
    );
  });
}
