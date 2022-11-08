import { expect } from "chai";
import { randomBytes } from "crypto";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  let mockContract: any;
  let salt: string;
  let apiSignature: string;
  let price: BigNumber;
  let quantity: number;
  let jungle: BigNumber;
  beforeEach(async function () {
    // Init Mock
    mockContract = await ctx.mockCrystalContractFactory.deploy(
      ctx.signer.address,
      ctx.mod.address,
      ctx.rrContract.address,
      ctx.jungleContract.address,
      ctx.jfgContract.address,
      [ctx.user8.address, ctx.user9.address]
    );
    await mockContract.deployed();

    // Update max supply to something low
    await mockContract.setVariable("MAX_SUPPLY", {
      "1": 3,
      "2": 1,
      "3": 1
    });

    // Start minting phase 2
    await mockContract.startPhase2Mint();

    salt = "0x" + randomBytes(32).toString("hex");
    quantity = 5;
    jungle = ethers.utils.parseEther("0");
    price = ethers.utils.parseEther("0.13");

    await ctx.jfgContract.safeMintTo(ctx.user1.address, quantity);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint256"],
      [jungle, quantity]
    );

    await expect(
      mockContract
        .connect(ctx.user1)
        .phase2Mint(apiSignature, salt, jungle, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(mockContract, "TransferSingle");
  });

  it("should burn a token", async () => {
    expect(
      (await mockContract.balanceOf(ctx.user1.address, 1)).toNumber()
    ).to.be.eq(3);

    expect(
      (await mockContract.balanceOf(ctx.user1.address, 2)).toNumber()
    ).to.be.eq(1);

    expect(
      (await mockContract.balanceOf(ctx.user1.address, 3)).toNumber()
    ).to.be.eq(1);

    await expect(mockContract.connect(ctx.user1).burn(ctx.user1.address, 1, 2)).to.emit(
      mockContract,
      "TransferSingle"
    );

    expect(
      (await mockContract.balanceOf(ctx.user1.address, 1)).toNumber()
    ).to.be.eq(1);

    expect(
      (await mockContract.totalSupply(1)).toNumber()
    ).to.be.eq(1);
  });

  it("should fail to burn a token because it's called by the wrong user", async () => {
    await expect(mockContract.connect(ctx.user2).burn(ctx.user1.address, 1, 2)).to.be.revertedWith(
      "ERC1155: caller is not owner nor approved"
    );
  });

  it("should burn a token because it's called by an approved user", async () => {
    await expect(
      mockContract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.approved.address, true)
    ).to.emit(mockContract, "ApprovalForAll");

    await expect(mockContract.connect(ctx.approved).burn(ctx.user1.address, 1, 2)).to.emit(
      mockContract,
      "TransferSingle"
    );

    expect(
      (await mockContract.balanceOf(ctx.user1.address, 1)).toNumber()
    ).to.be.eq(1);

    expect(
      (await mockContract.totalSupply(1)).toNumber()
    ).to.be.eq(1);
  });
}
