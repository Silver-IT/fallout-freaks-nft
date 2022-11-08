import { expect } from "chai";
import { randomBytes } from "crypto";
import { BigNumber, Wallet } from "ethers";
import { ethers } from "hardhat";
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
  let jfgIds: Array<number>;
  beforeEach(async function () {
    salt = "0x" + randomBytes(32).toString("hex");
    quantity = 2;
    jungle = ethers.utils.parseEther("0");
    price = ethers.utils.parseEther("0.13");
    jfgIds = [0, 1, 2];
    await ctx.jfgContract.safeMintTo(ctx.user1.address, 3);
    await ctx.jfgContract
      .connect(ctx.user1)
      .setApprovalForAll(ctx.jungleContract.address, true);

    await ctx.jungleContract.connect(ctx.user1).toggle();
    await ctx.jungleContract.connect(ctx.user1).stakeById(["1"]);

    await ctx.jungleContract.mint(
      ctx.user1.address,
      ethers.utils.parseEther("150").mul(jfgIds.length)
    );

    await ctx.jungleContract
      .connect(ctx.user1)
      .setAuthorizedAddress(ctx.crystalContract.address, true);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint256[]"],
      [jungle, jfgIds]
    );

    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      "Phase1MintBegins"
    );
  });

  it("should do phase 1 minting with a valid signature", async () => {
    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
          value: price.mul(jfgIds.length),
        })
    ).to.emit(ctx.crystalContract, "TransferSingle");

    expect(
      (await ctx.crystalContract.balanceOf(ctx.user1.address, 1)).toNumber() +
        (await ctx.crystalContract.balanceOf(ctx.user1.address, 2)).toNumber() +
        (await ctx.crystalContract.balanceOf(ctx.user1.address, 3)).toNumber()
    ).to.be.eq(jfgIds.length);
  });

  it("should fail to mint when it isn't his own Jungle Freaks Genesis token", async () => {
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user2.address,
      salt,
      ["uint256", "uint256[]"],
      [jungle, jfgIds]
    );

    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user2)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
          value: price.mul(jfgIds.length),
        })
    ).to.revertedWith("NotYourToken");
  });

  it("should fail to mint from already used Jungle Freaks Genesis token", async () => {
    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
          value: price.mul(jfgIds.length),
        })
    ).to.emit(ctx.crystalContract, "TransferSingle");

    salt = "0x" + randomBytes(32).toString("hex");
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint256[]"],
      [jungle, jfgIds]
    );

    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
          value: price.mul(jfgIds.length),
        })
    ).to.revertedWith("UsedToken");
  });

  it("should fail to mint from invalid price", async () => {
    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
          value: price.sub(ethers.utils.parseEther("0.01")),
        })
    ).to.be.revertedWith("IncorrectEthValue");

    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
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
      ["uint256", "uint256[]"],
      [jungle.mul(jfgIds.length), jfgIds]
    );

    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle.mul(jfgIds.length), jfgIds, {
          value: price.mul(jfgIds.length),
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
      ["uint256", "uint256[]"],
      [jungle.mul(jfgIds.length), jfgIds]
    );

    await ctx.jungleContract.mint(ctx.user1.address, jungle.mul(jfgIds.length));

    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle.mul(jfgIds.length), jfgIds, {
          value: price.mul(jfgIds.length),
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
      ["uint256", "uint256[]"],
      [jungle.mul(jfgIds.length), jfgIds]
    );

    await ctx.jungleContract.mint(ctx.user1.address, jungle.mul(jfgIds.length));

    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle.mul(jfgIds.length), jfgIds, {
          value: price.mul(jfgIds.length),
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
      "3": 1,
    });

    // Start minting phase 1
    await mockContract.startPhase1Mint();

    await expect(
      mockContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
          value: price.mul(jfgIds.length),
        })
    ).to.emit(mockContract, "TransferSingle");

    await ctx.jfgContract.safeMintTo(ctx.user2.address, 1);

    salt = "0x" + randomBytes(32).toString("hex");

    const tokenId = 2;

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user2.address,
      salt,
      ["uint256", "uint256[]"],
      [jungle, [tokenId]]
    );

    await expect(
      mockContract
        .connect(ctx.user2)
        .phase1Mint(apiSignature, salt, jungle, [tokenId], {
          value: price.mul(1),
        })
    ).to.be.revertedWith("SoldOut");

    expect(await mockContract.totalSupply(1)).to.eq(BigNumber.from(1));
    expect(await mockContract.totalSupply(2)).to.eq(BigNumber.from(1));
    expect(await mockContract.totalSupply(3)).to.eq(BigNumber.from(1));
  });
}
