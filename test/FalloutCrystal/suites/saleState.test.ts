import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import keccak256 from "keccak256";

export default function suite() {
  const NOT_STARTED = 0;
  const ACTIVE = 1;
  const PAUSED = 2;
  const FINISHED = 3;

  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  const MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

  const JUNGLE_BANK = "0x8e5F332a0662C8c06BDD1Eed105Ba1C4800d4c2f";

  it("should end sale after phase 1 mint", async () => {
    await expect(ctx.crystalContract.endMint()).to.be.revertedWith(
      "NoActiveSale"
    );

    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      "Phase1MintBegins"
    );

    await expect(ctx.crystalContract.endMint()).to.emit(
      ctx.crystalContract,
      "MintEnds"
    );
  });

  it("should end sale after phase 2 mint", async () => {
    await expect(ctx.crystalContract.endMint()).to.be.revertedWith(
      "NoActiveSale"
    );

    await expect(ctx.crystalContract.startPhase2Mint()).to.emit(
      ctx.crystalContract,
      "Phase2MintBegins"
    );

    await expect(ctx.crystalContract.endMint()).to.emit(
      ctx.crystalContract,
      "MintEnds"
    );
  });

  it("end sale no longer allows change of sale state", async () => {
    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      "Phase1MintBegins"
    );
    await expect(ctx.crystalContract.startPhase2Mint()).to.emit(
      ctx.crystalContract,
      "Phase2MintBegins"
    );
    await expect(ctx.crystalContract.endMint()).to.emit(
      ctx.crystalContract,
      "MintEnds"
    );

    await expect(ctx.crystalContract.startPhase1Mint()).to.be.revertedWith(
      "AllSalesFinished"
    );

    await expect(ctx.crystalContract.startPhase2Mint()).to.be.revertedWith(
      "AllSalesFinished"
    );

    await expect(ctx.crystalContract.endMint()).to.be.revertedWith(
      "NoActiveSale"
    );
  });

  it("should set correct values for each sale state", async () => {
    expect(await ctx.crystalContract.getSaleType()).to.eql("None");

    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      "Phase1MintBegins"
    );
    expect(await ctx.crystalContract.getSaleType()).to.be.eql("Phase1Mint");

    await expect(ctx.crystalContract.startPhase2Mint()).to.emit(
      ctx.crystalContract,
      "Phase2MintBegins"
    );
    expect(await ctx.crystalContract.getSaleType()).to.be.eql("Phase2Mint");

    await expect(ctx.crystalContract.endMint()).to.emit(
      ctx.crystalContract,
      "MintEnds"
    );
    expect(await ctx.crystalContract.getSaleType()).to.be.eql("Finished");
    expect(await ctx.crystalContract.getSaleState()).to.be.eql(FINISHED);
  });

  it("pauses a sale state", async () => {
    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      "Phase1MintBegins"
    );
    await expect(ctx.crystalContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.crystalContract.getSaleState()).to.be.eql(PAUSED);

    await expect(ctx.crystalContract.startPhase2Mint()).to.emit(
      ctx.crystalContract,
      "Phase2MintBegins"
    );
    await expect(ctx.crystalContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.crystalContract.getSaleState()).to.be.eql(PAUSED);
  });

  it("unpauses a paused sale state", async () => {
    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      "Phase1MintBegins"
    );
    await expect(ctx.crystalContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.crystalContract.getSaleState()).to.be.eql(PAUSED);
    expect(await ctx.crystalContract.getSaleType()).to.be.eql("Phase1Mint");
    await expect(ctx.crystalContract.unpauseMint()).to.not.be.reverted;
    expect(await ctx.crystalContract.getSaleState()).to.be.eql(ACTIVE);
    expect(await ctx.crystalContract.getSaleType()).to.be.eql("Phase1Mint");

    await expect(ctx.crystalContract.startPhase2Mint()).to.emit(
      ctx.crystalContract,
      "Phase2MintBegins"
    );
    await expect(ctx.crystalContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.crystalContract.getSaleState()).to.be.eql(PAUSED);
    expect(await ctx.crystalContract.getSaleType()).to.be.eql("Phase2Mint");
    await expect(ctx.crystalContract.unpauseMint()).to.not.be.reverted;
    expect(await ctx.crystalContract.getSaleState()).to.be.eql(ACTIVE);
    expect(await ctx.crystalContract.getSaleType()).to.be.eql("Phase2Mint");
  });

  it("can not pause a paused sale state", async () => {
    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      "Phase1MintBegins"
    );
    await expect(ctx.crystalContract.pauseMint()).to.not.be.reverted;
    await expect(ctx.crystalContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );

    await expect(ctx.crystalContract.startPhase2Mint()).to.emit(
      ctx.crystalContract,
      "Phase2MintBegins"
    );
    await expect(ctx.crystalContract.pauseMint()).to.not.be.reverted;
    await expect(ctx.crystalContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );
  });

  it("can not unpause an active sale state", async () => {
    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      "Phase1MintBegins"
    );
    await expect(ctx.crystalContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );

    await expect(ctx.crystalContract.startPhase2Mint()).to.emit(
      ctx.crystalContract,
      "Phase2MintBegins"
    );
    await expect(ctx.crystalContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );
  });

  it("can not change pause state when no sale active", async () => {
    await expect(ctx.crystalContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );
    await expect(ctx.crystalContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );

    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      "Phase1MintBegins"
    );
    await expect(ctx.crystalContract.startPhase2Mint()).to.emit(
      ctx.crystalContract,
      "Phase2MintBegins"
    );
    await expect(ctx.crystalContract.endMint()).to.emit(
      ctx.crystalContract,
      "MintEnds"
    );

    await expect(ctx.crystalContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );
    await expect(ctx.crystalContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );
  });

  describe("moderator permissions", async () => {
    beforeEach(async () => {
      expect(
        await ctx.crystalContract
          .connect(ctx.admin)
          .grantRole(MODERATOR_ROLE, ctx.mod.address)
      ).to.emit(ctx.crystalContract, "RoleGranted");
    });

    it("can start phase 1 mint", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.mod).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");
    });
    it("can start phase 2 mint", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.mod).startPhase2Mint()
      ).to.emit(ctx.crystalContract, "Phase2MintBegins");
    });
    it("fails to end minting", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.mod).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");
      await expect(
        ctx.crystalContract.connect(ctx.mod).endMint()
      ).to.be.revertedWith("NotAdminOrOwner");
    });

    it("can pause minting", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.mod).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");
      await expect(ctx.crystalContract.connect(ctx.mod).pauseMint()).to.not.be
        .reverted;
    });

    it("can unpause minting", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.mod).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");
      await expect(ctx.crystalContract.connect(ctx.mod).pauseMint()).to.not.be
        .reverted;
      await expect(ctx.crystalContract.connect(ctx.mod).unpauseMint()).to.not.be
        .reverted;
    });

    it("fails to start phase 1 mint due to permissions", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.user1).startPhase1Mint()
      ).to.be.revertedWith("NotAdminOrModerator");
    });
    it("fails to start phase 2 mint", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.user1).startPhase2Mint()
      ).to.be.revertedWith("NotAdminOrModerator");
    });
    it("fails to end minting", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.mod).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");
      await expect(
        ctx.crystalContract.connect(ctx.user1).endMint()
      ).to.be.revertedWith("NotAdminOrOwner");
    });
  });

  describe("admin permissions", async () => {
    it("can start phase 1 mint", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.admin).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");
    });
    it("can start phase 2 mint", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.admin).startPhase2Mint()
      ).to.emit(ctx.crystalContract, "Phase2MintBegins");
    });
    it("can end minting", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.admin).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");
      await expect(ctx.crystalContract.connect(ctx.admin).endMint()).to.emit(
        ctx.crystalContract,
        "MintEnds"
      );
    });

    it("can pause minting", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.admin).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");
      await expect(ctx.crystalContract.connect(ctx.admin).pauseMint()).to.not.be
        .reverted;
    });

    it("can unpause minting", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.admin).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");
      await expect(ctx.crystalContract.connect(ctx.admin).pauseMint()).to.not.be
        .reverted;
      await expect(ctx.crystalContract.connect(ctx.admin).unpauseMint()).to.not
        .be.reverted;
    });

    it("fails to start phase 1 mint due to permissions", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.user1).startPhase1Mint()
      ).to.be.revertedWith("NotAdminOrModerator");
    });
    it("fails to start phase 2 mint", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.user1).startPhase2Mint()
      ).to.be.revertedWith("NotAdminOrModerator");
    });
    it("fails to end minting", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.admin).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");
      await expect(
        ctx.crystalContract.connect(ctx.user1).endMint()
      ).to.be.revertedWith("NotAdminOrOwner");
    });
  });

  describe("retain special tokens", async () => {
    it("should transfer the remaining level 2 & level 3 tokens to JUNGLE_BANK when ending the mint", async () => {
      await expect(
        ctx.crystalContract.connect(ctx.admin).startPhase1Mint()
      ).to.emit(ctx.crystalContract, "Phase1MintBegins");

      for (var i = 1; i <= 3; i++) {
        expect(await ctx.crystalContract.balanceOf(JUNGLE_BANK, i)).to.eql(
          BigNumber.from(0)
        );
      }

      await expect(ctx.crystalContract.connect(ctx.admin).endMint()).to.emit(
        ctx.crystalContract,
        "MintEnds"
      );

      expect(await ctx.crystalContract.balanceOf(JUNGLE_BANK, 1)).to.eql(
        BigNumber.from(0)
      );

      const MAX_SUPPLY_2 = await ctx.crystalContract.MAX_SUPPLY(2);
      expect(await ctx.crystalContract.balanceOf(JUNGLE_BANK, 2)).to.eql(
        MAX_SUPPLY_2
      );

      const MAX_SUPPLY_3 = await ctx.crystalContract.MAX_SUPPLY(3);
      expect(await ctx.crystalContract.balanceOf(JUNGLE_BANK, 3)).to.eql(
        MAX_SUPPLY_3
      );
    });
  });
}
