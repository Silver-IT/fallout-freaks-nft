import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should get price equal to 0.13 eth", async () => {
    expect(await ctx.falloutContract.MINT_PRICE()).to.eq(
      ethers.utils.parseEther("0.13")
    );
  });

  it("should get total mint quantity equal to 5000", async () => {
    expect(await ctx.falloutContract.MAX_MINT()).to.eq(BigNumber.from(5000));
  });

  it("should get total supply quantity equal to 15000", async () => {
    expect(await ctx.falloutContract.MAX_SUPPLY()).to.eq(BigNumber.from(15000));
  });

  it("should get mint limit equal to 3", async () => {
    expect(await ctx.falloutContract.MAX_BATCH_MINT()).to.equal(
      BigNumber.from(3)
    );
  });
}
