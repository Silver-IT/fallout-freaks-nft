import { expect } from "chai";
import { BigNumber } from "ethers";
import { randomBytes } from "crypto";
import { ethers } from "hardhat";
import keccak256 from "keccak256";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  const MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
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
    jfgIds = [0, 1];
    await ctx.jfgContract.safeMintTo(ctx.user1.address, 2);

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

  it("should set the baseURI", async () => {
    await expect(
      ctx.crystalContract.setURI("https://jfmc-api-hxs7r5kyjq-uc.a.run.app/")
    ).to.emit(ctx.crystalContract, "URIUpdated");
  });

  it("should fail to set the baseURI because trailing slash is not set", async () => {
    await expect(
      ctx.crystalContract.setURI(
        "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu"
      )
    ).to.be.revertedWith("NoTrailingSlash");
  });

  // it("should fail to retrieve uri", async () => {
  //   await expect(
  //     ctx.crystalContract.connect(ctx.user2).uri(1)
  //   ).to.be.revertedWith("URI query for nonexistent token");
  // });

  it("should retrieve empty default uri and contractURI", async () => {
    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
          value: price.mul(jfgIds.length),
        })
    ).to.emit(ctx.crystalContract, "TransferSingle");

    expect(await ctx.crystalContract.connect(ctx.user2).uri(0)).to.equal(
      `https://massless-ipfs-public-gateway.mypinata.cloud/ipfs/QmZiZUjvFBKXU3hJ1iJ9bwPQcNNMBBrFQUv7FZybYgqLcD/token/{id}.json`
    );

    expect(await ctx.crystalContract.connect(ctx.user2).contractURI()).to.equal(
      `https://massless-ipfs-public-gateway.mypinata.cloud/ipfs/QmZiZUjvFBKXU3hJ1iJ9bwPQcNNMBBrFQUv7FZybYgqLcD/contract.json`
    );
  });

  it("should retrieve correct updated uri and contractURI", async () => {
    await expect(
      ctx.crystalContract.setURI(
        "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/"
      )
    ).to.emit(ctx.crystalContract, "URIUpdated");

    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
          value: price.mul(jfgIds.length),
        })
    ).to.emit(ctx.crystalContract, "TransferSingle");

    expect(await ctx.crystalContract.connect(ctx.user2).uri(0)).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/token/{id}.json`
    );

    expect(await ctx.crystalContract.connect(ctx.user2).uri(1)).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/token/{id}.json`
    );

    expect(await ctx.crystalContract.connect(ctx.user2).contractURI()).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/contract.json`
    );
  });

  describe("admin permissions", async () => {
    it("only owner, admin and moderators can update baseURL", async () => {
      expect(
        await ctx.crystalContract
          .connect(ctx.admin)
          .grantRole(MODERATOR_ROLE, ctx.mod.address)
      ).to.emit(ctx.crystalContract, "RoleGranted");

      await expect(
        ctx.crystalContract
          .connect(ctx.owner)
          .setURI("https://jfmc-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.emit(ctx.crystalContract, "URIUpdated");

      await expect(
        ctx.crystalContract
          .connect(ctx.admin)
          .setURI("https://jfmc-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.emit(ctx.crystalContract, "URIUpdated");

      await expect(
        ctx.crystalContract
          .connect(ctx.mod)
          .setURI("https://jfmc-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.emit(ctx.crystalContract, "URIUpdated");

      await expect(
        ctx.crystalContract
          .connect(ctx.user1)
          .setURI("https://jfmc-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.be.revertedWith("NotAdminOrModerator");
    });
  });
}
