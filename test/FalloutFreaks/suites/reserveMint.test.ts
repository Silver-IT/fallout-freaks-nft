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

  let salt: string;
  beforeEach(async function () {
    // Default mints
    salt = "0x" + randomBytes(32).toString("hex");
  });

  it("should mint 20 from owner to user8", async () => {
    const quantity = 20;
    await expect(
      ctx.falloutContract.reservedRandomMint(salt, ctx.user8.address, quantity)
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(
      (await ctx.falloutContract.balanceOf(ctx.user8.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.falloutContract.ownerOf(i)).to.be.eq(ctx.user8.address);
    }

    expect(await ctx.falloutContract.reservedMintQuantity()).to.be.eq(quantity);
  });

  it("should mint reserved from owner to user1", async () => {
    const totalReserved = (
      await ctx.falloutContract.reservedMintSupply()
    ).toNumber();

    await expect(
      ctx.falloutContract.reservedRandomMint(
        salt,
        ctx.user1.address,
        totalReserved
      )
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(
      (await ctx.falloutContract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(totalReserved);

    for (var i = 0; i < totalReserved; i++) {
      expect(await ctx.falloutContract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }

    expect(await ctx.falloutContract.reservedMintQuantity()).to.be.eq(
      totalReserved
    );

    await expect(
      ctx.falloutContract.reservedRandomMint(salt, ctx.user1.address, 1)
    ).to.be.revertedWith("ReservedMintedOut");
  });

  it("should fail to mint from user1", async () => {
    const quantity = Math.round(
      (await ctx.falloutContract.reservedMintSupply()).toNumber() / 2
    );
    await expect(
      ctx.falloutContract
        .connect(ctx.user1)
        .reservedRandomMint(salt, ctx.user1.address, quantity)
    ).to.be.revertedWith("NotAdminOrOwner");
  });

  it.skip("should reduce the amount of reserved mints from the MAX_MINT", async () => {
    // Init Mock
    const mockContract = await ctx.mockFalloutContractFactory.deploy(
      ctx.signer.address,
      ctx.mod.address,
      ctx.royaltyReceiver.address,
      ctx.jfgContract.address,
      ctx.jfmcContract.address,
      ctx.jfcContract.address,
      ctx.jungleContract.address,
      ctx.preAuthorizedAddresses
    );
    await mockContract.deployed();

    // Update allow list supply to something low
    const maxMint = 25;
    const maxReserveMint = 10;

    await mockContract.setVariable("MAX_MINT", maxMint);
    await mockContract.setVariable("reservedMintSupply", maxReserveMint);
    // await mockContract.setReservedMintSupply(maxReserveMint);

    await expect(
      mockContract.reservedRandomMint(salt, ctx.user1.address, maxReserveMint)
    ).to.emit(mockContract, "Transfer");

    await expect(mockContract.startAllowListMint()).to.emit(
      mockContract,
      "AllowListMintBegins"
    );

    const wallets = [ctx.user1, ctx.user2, ctx.user3, ctx.user4, ctx.user5];

    // Mint the entire allow list supply to different wallets
    await Promise.all(
      wallets.map((wallet) =>
        (async (wallet) => {
          const salt = "0x" + randomBytes(32).toString("hex");

          const root = ctx.merkleTree.getHexRoot();
          await expect(mockContract.setMerkleRoot(root)).to.not.be.reverted;

          const leaf = ctx.leavesLookup[wallet.address];
          const merkleProof = ctx.merkleTree.getHexProof(leaf);

          const apiSignature = await signMintRequest(
            ctx.signer,
            wallet.address,
            salt,
            ["bytes32[]", "uint8"],
            [merkleProof, 3]
          );

          const price = await mockContract.MINT_PRICE();

          // allowListRandomMint function call with signature
          return await expect(
            mockContract
              .connect(wallet)
              .allowListRandomMint(apiSignature, salt, merkleProof, 3, {
                value: price.mul(3),
              })
          ).to.emit(mockContract, "Transfer");
        })(wallet)
      )
    );

    // Minting 1 more than Allowed
    {
      await expect(mockContract.startPublicMint()).to.emit(
        mockContract,
        "PublicMintBegins"
      );

      const salt = "0x" + randomBytes(32).toString("hex");

      const apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user6.address,
        salt,
        ["uint8"],
        [1]
      );

      const price = await mockContract.MINT_PRICE();

      // publicRandomMint function call with signature
      await expect(
        mockContract
          .connect(ctx.user6)
          .publicRandomMint(apiSignature, salt, 1, {
            value: price,
          })
      ).to.be.revertedWith("SoldOut");
    }

    expect(await mockContract.totalSupply()).to.eq(BigNumber.from(maxMint));
  });
}
