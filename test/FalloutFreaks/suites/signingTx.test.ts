import { expect } from "chai";
import { randomBytes } from "crypto";
import { Contract, ethers } from "ethers";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  let salt: string;

  beforeEach(async function () {
    salt = "0x" + randomBytes(32).toString("hex");

    await expect(ctx.falloutContract.startAllowListMint()).to.emit(
      ctx.falloutContract,
      "AllowListMintBegins"
    );
  });

  it("should be successful to allowListRandomMint", async () => {
    const quantity = 2;

    const root = ctx.merkleTree.getHexRoot();
    await expect(ctx.falloutContract.setMerkleRoot(root)).to.not.be.reverted;

    const leaf = ctx.leavesLookup[ctx.user1.address];
    const merkleProof = ctx.merkleTree.getHexProof(leaf);

    const apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, quantity]
    );

    const price = await ctx.falloutContract.MINT_PRICE();

    // allowListRandomMint function call with signature
    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .allowListRandomMint(apiSignature, salt, merkleProof, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(
      (await ctx.falloutContract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);
  });

  it("should be successful to publicRandomMint", async () => {
    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );

    const quantity = 3;

    const apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user2.address,
      salt,
      ["uint8"],
      [quantity]
    );

    const price = await ctx.falloutContract.MINT_PRICE();

    // publicRandomMint function call with signature
    await expect(
      ctx.falloutContract
        .connect(ctx.user2)
        .publicRandomMint(apiSignature, salt, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(
      (await ctx.falloutContract.balanceOf(ctx.user2.address)).toNumber()
    ).to.be.eq(quantity);
  });

  it("should fail publicRandomMint with wrong signer", async () => {
    await expect(ctx.falloutContract.startPublicMint()).to.emit(
      ctx.falloutContract,
      "PublicMintBegins"
    );

    const quantity = 1;

    const apiSignature = await signMintRequest(
      ctx.owner,
      ctx.user2.address,
      salt,
      ["uint8"],
      [quantity]
    );

    const price = await ctx.falloutContract.MINT_PRICE();

    // function call with signature
    await expect(
      ctx.falloutContract
        .connect(ctx.user2)
        .publicRandomMint(apiSignature, salt, quantity, {
          value: price.mul(quantity),
        })
    ).to.be.revertedWith("SignatureFailed");
  });
}
