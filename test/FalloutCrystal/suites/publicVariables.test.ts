import { expect } from "chai";
import { BigNumber } from "ethers";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should get mint limit equal to 5", async () => {
    expect(await ctx.crystalContract.MAX_BATCH_MINT()).to.equal(
      BigNumber.from(5)
    );
  });

  it("should get name", async () => {
    expect(await ctx.crystalContract.name()).to.equal(
      "Fallout Crystal"
    );
  });

  it("should get symbol", async () => {
    expect(await ctx.crystalContract.symbol()).to.equal(
      "FCR"
    );
  });
}
