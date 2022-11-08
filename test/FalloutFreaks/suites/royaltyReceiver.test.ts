import { expect } from "chai";
import { ethers } from "hardhat";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  beforeEach(async function () {});

  it("should updatable only for owner and admin", async () => {
    await expect(ctx.falloutContract.setRoyaltyReceiver(ctx.user1.address)).to
      .not.be.reverted;

    await expect(
      ctx.falloutContract.connect(ctx.mod).setRoyaltyReceiver(ctx.user1.address)
    ).to.be.revertedWith("NotAdminOrOwner");
  });

  it("should be failed to set Zero address and Zero basis", async () => {
    await expect(
      ctx.falloutContract.setRoyaltyReceiver(ethers.constants.AddressZero)
    ).to.be.revertedWith("ZeroReceiverAddress");

    await expect(
      ctx.falloutContract.setRoyaltyBasisPoints("0")
    ).to.be.revertedWith("ZeroReceiverBasisPoints");
  });
}
