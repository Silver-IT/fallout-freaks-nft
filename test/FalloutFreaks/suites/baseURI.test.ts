import { expect } from "chai";
import { ethers } from "hardhat";
import keccak256 from "keccak256";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  const MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

  it("should set the baseURI", async () => {
    await expect(
      ctx.falloutContract.setBaseURI(
        "https://jfmc-api-hxs7r5kyjq-uc.a.run.app/"
      )
    ).to.emit(ctx.falloutContract, "BaseURIUpdated");
  });

  it("should fail to set the baseURI because trailing slash is not set", async () => {
    await expect(
      ctx.falloutContract.setBaseURI(
        "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu"
      )
    ).to.be.revertedWith("NoTrailingSlash");
  });

  it("should fail to retrieve tokenURI", async () => {
    await expect(
      ctx.falloutContract.connect(ctx.user2).tokenURI(1)
    ).to.be.revertedWith("URI query for nonexistent token");
  });

  it("should retrieve empty default tokenURI and contractURI", async () => {
    const randomness_ = "901227";
    await expect(
      ctx.falloutContract.reservedRandomMint(
        ethers.utils.formatBytes32String(randomness_),
        ctx.user1.address,
        1
      )
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(await ctx.falloutContract.connect(ctx.user2).tokenURI(0)).to.equal(
      `token/${0}.json`
    );

    expect(await ctx.falloutContract.connect(ctx.user2).contractURI()).to.equal(
      `contract.json`
    );
  });

  it("should retrieve correct updated tokenURI and contractURI", async () => {
    await expect(
      ctx.falloutContract.setBaseURI(
        "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/"
      )
    ).to.emit(ctx.falloutContract, "BaseURIUpdated");

    const randomness_ = "901227";
    await expect(
      ctx.falloutContract.reservedRandomMint(
        ethers.utils.formatBytes32String(randomness_),
        ctx.user1.address,
        2
      )
    ).to.emit(ctx.falloutContract, "Transfer");

    expect(await ctx.falloutContract.connect(ctx.user2).tokenURI(0)).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/token/${0}.json`
    );

    expect(await ctx.falloutContract.connect(ctx.user2).tokenURI(1)).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/token/${1}.json`
    );

    expect(await ctx.falloutContract.connect(ctx.user2).contractURI()).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/contract.json`
    );
  });

  describe("admin permissions", async () => {
    it("only owner, admin and moderators can update baseURL", async () => {
      expect(
        await ctx.falloutContract
          .connect(ctx.admin)
          .grantRole(MODERATOR_ROLE, ctx.mod.address)
      ).to.emit(ctx.falloutContract, "RoleGranted");

      await expect(
        ctx.falloutContract
          .connect(ctx.owner)
          .setBaseURI("https://jfmc-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.emit(ctx.falloutContract, "BaseURIUpdated");

      await expect(
        ctx.falloutContract
          .connect(ctx.admin)
          .setBaseURI("https://jfmc-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.emit(ctx.falloutContract, "BaseURIUpdated");

      await expect(
        ctx.falloutContract
          .connect(ctx.mod)
          .setBaseURI("https://jfmc-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.emit(ctx.falloutContract, "BaseURIUpdated");

      await expect(
        ctx.falloutContract
          .connect(ctx.user1)
          .setBaseURI("https://jfmc-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.be.revertedWith("NotAdminOrModerator");
    });
  });
}
