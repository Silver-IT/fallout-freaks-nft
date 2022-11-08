import { expect } from "chai";
import { ethers } from "hardhat";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  describe("When receiving ether", async () => {
    it("should allow contract to receive ether", async () => {
      const value = ethers.utils.parseEther("1");

      await expect(
        ctx.owner.sendTransaction({
          to: ctx.crystalContract.address,
          value,
        })
      ).to.not.be.reverted;
    });
  });

  describe("When setting withdrawal addresses", async () => {
    it("should return the correct default withdrawal address when no withdrawal address has been set for JF", async () => {
      const beneficary1 = await ctx.crystalContract.beneficiaries(0);
      expect(beneficary1.wallet).to.eql(
        "0x8e5F332a0662C8c06BDD1Eed105Ba1C4800d4c2f"
      );
    });
    it("should return the correct default withdrawal address when no withdrawal address has been set for Scott", async () => {
      const beneficary2 = await ctx.crystalContract.beneficiaries(1);
      expect(beneficary2.wallet).to.eql(
        "0x954BfE5137c8D2816cE018EFd406757f9a060e5f"
      );
    });
    it("should return the correct default withdrawal address when no withdrawal address has been set for New Wallet", async () => {
      const beneficary3 = await ctx.crystalContract.beneficiaries(2);
      expect(beneficary3.wallet).to.eql(
        "0x2E7D93e2AdFC4a36E2B3a3e23dE7c35212471CfB"
      );
    });
    it("should return the correct default withdrawal address when no withdrawal address has been set for Massless", async () => {
      const beneficary4 = await ctx.crystalContract.beneficiaries(3);
      expect(beneficary4.wallet).to.eql(
        "0xd196e0aFacA3679C27FC05ba8C9D3ABBCD353b5D"
      );
    });
  });

  describe("When withdrawing Ether Funds", async () => {
    it("should fail to withdraw when balance is zero", async () => {
      await expect(ctx.crystalContract.withdrawEth()).to.be.revertedWith(
        "ZeroBalance"
      );
    });

    it("should allow anyone to initiate withdrawEth()", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.owner.sendTransaction({
          to: ctx.crystalContract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(ctx.crystalContract.connect(ctx.user1).withdrawEth()).to.not
        .be.reverted;
    });

    it("should withdraw contract balance to the default withdrawal addresses.", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.owner.sendTransaction({
          to: ctx.crystalContract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(ctx.crystalContract.withdrawEth()).to.be.not.be.reverted;
    });

    it("should withdraw contract balance to the correct withdrawal addresses.", async () => {
      const teamMemberAInitialBalance = await ctx.user1.getBalance();
      const teamMemberBInitialBalance = await ctx.user2.getBalance();
      const teamMemberCInitialBalance = await ctx.user3.getBalance();
      const teamMemberDInitialBalance = await ctx.user4.getBalance();

      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.owner.sendTransaction({
          to: ctx.crystalContract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(
        ctx.crystalContract.setBeneficiaries(
          [
            ctx.user1.address,
            ctx.user2.address,
            ctx.user3.address,
            ctx.user4.address,
          ],
          [5500, 2000, 500, 2000]
        )
      ).to.not.be.reverted;

      await expect(ctx.crystalContract.withdrawEth()).to.be.not.be.reverted;

      expect(await ctx.user1.getBalance()).to.equal(
        teamMemberAInitialBalance.add(value.mul(5500).div(10000)) // 55.00%
      );
      expect(await ctx.user2.getBalance()).to.equal(
        teamMemberBInitialBalance.add(value.mul(2000).div(10000)) // 20.00%
      );
      expect(await ctx.user3.getBalance()).to.equal(
        teamMemberCInitialBalance.add(value.mul(500).div(10000)) // 5.00%
      );
      expect(await ctx.user4.getBalance()).to.equal(
        teamMemberDInitialBalance.add(value.mul(2000).div(10000)) // 20.00%
      );
    });
  });

  describe("When withdrawing ERC20 Funds", async () => {
    it("should fail to withdraw when balance is zero", async () => {
      await expect(
        ctx.crystalContract.withdrawErc20(ctx.standardERC20.address)
      ).to.be.revertedWith("ZeroBalance");
    });

    it("should allow anyone to initiate withdrawErc20(standardERC20.address)", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.standardERC20
          .connect(ctx.approved)
          .transfer(ctx.crystalContract.address, value)
      ).to.not.be.reverted;

      await expect(
        ctx.crystalContract
          .connect(ctx.user1)
          .withdrawErc20(ctx.standardERC20.address)
      ).to.not.be.reverted;
    });

    it("should withdraw contract balance to the default withdrawal addresses.", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.standardERC20
          .connect(ctx.approved)
          .transfer(ctx.crystalContract.address, value)
      ).to.not.be.reverted;

      await expect(ctx.crystalContract.withdrawErc20(ctx.standardERC20.address))
        .to.be.not.be.reverted;
    });

    it("should withdraw contract balance to the correct withdrawal addresses.", async () => {
      const teamMemberAInitialBalance = await ctx.standardERC20.balanceOf(
        ctx.user1.address
      );
      const teamMemberBInitialBalance = await ctx.standardERC20.balanceOf(
        ctx.user2.address
      );
      const teamMemberCInitialBalance = await ctx.standardERC20.balanceOf(
        ctx.user3.address
      );
      const teamMemberDInitialBalance = await ctx.standardERC20.balanceOf(
        ctx.user4.address
      );

      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.standardERC20
          .connect(ctx.approved)
          .transfer(ctx.crystalContract.address, value)
      ).to.not.be.reverted;

      await expect(
        ctx.crystalContract.setBeneficiaries(
          [
            ctx.user1.address,
            ctx.user2.address,
            ctx.user3.address,
            ctx.user4.address,
          ],
          [5500, 2000, 500, 2000]
        )
      ).to.not.be.reverted;

      await expect(ctx.crystalContract.withdrawErc20(ctx.standardERC20.address))
        .to.be.not.be.reverted;

      expect(await ctx.standardERC20.balanceOf(ctx.user1.address)).to.equal(
        teamMemberAInitialBalance.add(value.mul(5500).div(10000)) // 55.00%
      );
      expect(await ctx.standardERC20.balanceOf(ctx.user2.address)).to.equal(
        teamMemberBInitialBalance.add(value.mul(2000).div(10000)) // 20.00%
      );
      expect(await ctx.standardERC20.balanceOf(ctx.user3.address)).to.equal(
        teamMemberCInitialBalance.add(value.mul(500).div(10000)) // 5.00%
      );
      expect(await ctx.standardERC20.balanceOf(ctx.user4.address)).to.equal(
        teamMemberDInitialBalance.add(value.mul(2000).div(10000)) // 20.00%
      );
    });
  });
}
