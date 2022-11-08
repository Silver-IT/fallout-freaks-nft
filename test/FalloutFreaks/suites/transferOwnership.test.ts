import { expect } from "chai";
import { ethers } from "hardhat";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  beforeEach(async function () {});

  it("should be successful to transfer ownership only by owners", async () => {
    await expect(
      ctx.falloutContract.connect(ctx.mod).transferOwnership(ctx.user1.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      ctx.falloutContract.transferOwnership(ctx.user1.address)
    ).to.emit(ctx.falloutContract, "OwnershipTransferred");
  });

  it("should be failed to set Zero address", async () => {
    await expect(
      ctx.falloutContract.transferOwnership(ethers.constants.AddressZero)
    ).to.be.revertedWith("Ownable: new owner is the zero address");
  });
}
