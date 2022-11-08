import { expect } from "chai";
import { ethers } from "hardhat";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should allow contract to receive ether", async () => {
    const value = ethers.utils.parseEther("1");

    await expect(
      ctx.owner.sendTransaction({
        to: ctx.falloutContract.address,
        value,
      })
    ).to.not.be.reverted;
  });
}
