import { expect } from "chai";
import { randomBytes } from "crypto";
import { BigNumber, Wallet, ethers } from "ethers";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  let salt: string;
  let apiSignature: string;
  let price: BigNumber;
  let quantity: number;
  let jungle: BigNumber;
  beforeEach(async function () {
    salt = "0x" + randomBytes(32).toString("hex");
    quantity = 2;
    jungle = ethers.utils.parseEther("0");
    price = ethers.utils.parseEther("0.13");

    await ctx.jfgContract.safeMintTo(ctx.user1.address, quantity);
    await ctx.jfgContract
      .connect(ctx.user1)
      .setApprovalForAll(ctx.jungleContract.address, true);

    await ctx.jungleContract.connect(ctx.user1).toggle();
    await ctx.jungleContract.connect(ctx.user1).stakeById(["1"]);

    await ctx.jungleContract.mint(
      ctx.user1.address,
      ethers.utils.parseEther("150").mul(quantity)
    );

    await ctx.jungleContract
      .connect(ctx.user1)
      .setAuthorizedAddress(ctx.crystalContract.address, true);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint256"],
      [jungle, quantity]
    );

    await expect(ctx.crystalContract.startPhase2Mint()).to.emit(
      ctx.crystalContract,
      "Phase2MintBegins"
    );
  });

  it("should do phase 2 minting with a valid signature", async () => {
    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase2Mint(apiSignature, salt, jungle, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.crystalContract, "TransferSingle");

    expect(
      (await ctx.crystalContract.balanceOf(ctx.user1.address, 1)).toNumber() +
        (await ctx.crystalContract.balanceOf(ctx.user1.address, 2)).toNumber() +
        (await ctx.crystalContract.balanceOf(ctx.user1.address, 3)).toNumber()
    ).to.be.eq(quantity);
  });

  it("should fail to mint when not own any Jungle Freaks Genesis token", async () => {
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user2.address,
      salt,
      ["uint256", "uint256"],
      [jungle, quantity]
    );

    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user2)
        .phase2Mint(apiSignature, salt, jungle, quantity, {
          value: price.mul(quantity),
        })
    ).to.revertedWith("NotHoldingAnyTokens");
  });

  it("should fail to mint when exceeds MAX_BATCH_MINT", async () => {
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint256"],
      [jungle, 6]
    );

    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase2Mint(apiSignature, salt, jungle, 6, {
          value: price.mul(6),
        })
    ).to.revertedWith("TransactionMintLimit");
  });

  it("should fail to mint from invalid price", async () => {
    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase2Mint(apiSignature, salt, jungle, quantity, {
          value: price.sub(ethers.utils.parseEther("0.01")),
        })
    ).to.be.revertedWith("IncorrectEthValue");

    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase2Mint(apiSignature, salt, jungle, quantity, {
          value: price.add(ethers.utils.parseEther("0.01")),
        })
    ).to.be.revertedWith("IncorrectEthValue");
  });

  it("should be able to mint from valid jungle and price", async () => {
    // Mint
    jungle = ethers.utils.parseEther("150");
    price = ethers.utils.parseEther("0.065");
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint256"],
      [jungle.mul(quantity), quantity]
    );

    await ctx.jungleContract.connect(ctx.user1).stakeById(["0"]);

    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase2Mint(apiSignature, salt, jungle.mul(quantity), quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.crystalContract, "TransferSingle");
  });

  it("should be able to mint from valid jungle", async () => {
    // Mint
    jungle = ethers.utils.parseEther("300");
    price = ethers.utils.parseEther("0");
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint256"],
      [jungle.mul(quantity), quantity]
    );

    await ctx.jungleContract.mint(ctx.user1.address, jungle.mul(quantity));

    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase2Mint(apiSignature, salt, jungle.mul(quantity), quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.crystalContract, "TransferSingle");
  });

  it("should fail to mint from invalid jungle", async () => {
    // Mint
    jungle = ethers.utils.parseEther("200");
    price = ethers.utils.parseEther("0");
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint256"],
      [jungle.mul(quantity), quantity]
    );

    await ctx.jungleContract.mint(ctx.user1.address, jungle.mul(quantity));

    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase2Mint(apiSignature, salt, jungle.mul(quantity), quantity, {
          value: price.mul(quantity),
        })
    ).to.be.revertedWith("IncorrectValueJungle");
  });

  it("should mint only MAX_SUPPLY with valid signature", async () => {
    // Init Mock
    const mockContract = await ctx.mockCrystalContractFactory.deploy(
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
      "1": 1,
      "2": 1,
      "3": 0,
    });

    // Start minting phase 2
    await mockContract.startPhase2Mint();

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

    await ctx.jfgContract.safeMintTo(ctx.user2.address, 1);

    salt = "0x" + randomBytes(32).toString("hex");

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user2.address,
      salt,
      ["uint256", "uint256"],
      [jungle, 1]
    );

    await expect(
      mockContract
        .connect(ctx.user2)
        .phase2Mint(apiSignature, salt, jungle, 1, {
          value: price.mul(1),
        })
    ).to.be.revertedWith("SoldOut");

    expect(await mockContract.totalSupply(1)).to.eq(BigNumber.from(1));
    expect(await mockContract.totalSupply(2)).to.eq(BigNumber.from(1));
    expect(await mockContract.totalSupply(3)).to.eq(BigNumber.from(0));
  });
}
