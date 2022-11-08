import { expect } from "chai";
import { ethers } from "hardhat";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  beforeEach(async function () {
    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );
  });

  it("should allow contract to mint up to 3 tokens at once", async () => {
    const price = await ctx.falloutContract.MINT_PRICE();

    // Mint a token
    const salt1 = ethers.utils.formatBytes32String("920220");
    const apiSignature1 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt1,
      ["uint8"],
      [1]
    );

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .publicRandomMint(apiSignature1, salt1, 1, {
          value: price.mul(1),
        })
    ).to.emit(ctx.falloutContract, "Transfer");

    // Mint two tokens
    const salt2 = ethers.utils.formatBytes32String("901227");
    const apiSignature2 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt2,
      ["uint8"],
      [2]
    );

    // publicRandomMint function call with signature
    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .publicRandomMint(apiSignature2, salt2, 2, {
          value: price.mul(2),
        })
    ).to.emit(ctx.falloutContract, "Transfer");

    // Mint three tokens
    const salt3 = ethers.utils.formatBytes32String("940315");
    const apiSignature3 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt3,
      ["uint8"],
      [3]
    );

    // publicRandomMint function call with signature
    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .publicRandomMint(apiSignature3, salt3, 3, {
          value: price.mul(3),
        })
    ).to.emit(ctx.falloutContract, "Transfer");
  });

  it("should not allow contract to mint more than 4 tokens at once", async () => {
    const price = await ctx.falloutContract.MINT_PRICE();

    // Mint a token
    const salt1 = ethers.utils.formatBytes32String("920220");
    const apiSignature1 = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt1,
      ["uint8"],
      [4]
    );

    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .publicRandomMint(apiSignature1, salt1, 4, {
          value: price.mul(4),
        })
    ).to.be.revertedWith("MaxBatchMintLimitExceeded");
  });
}
