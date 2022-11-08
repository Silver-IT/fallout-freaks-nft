import * as dotenv from "dotenv";

import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  BrokenWallet,
  BrokenWallet__factory,
  FalloutFreaksRoyaltyReceiver,
  FalloutFreaksRoyaltyReceiver__factory,
  StandardERC20,
  StandardERC20__factory,
} from "../typechain";

import { MockContract, smock } from "@defi-wonderland/smock";

dotenv.config();

let contract: FalloutFreaksRoyaltyReceiver;
let contractFactory: FalloutFreaksRoyaltyReceiver__factory;
let brokenWallet: BrokenWallet;
let standardERC20: MockContract<StandardERC20>;
let owner: SignerWithAddress;
let signer: SignerWithAddress;
let approved: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let user3: SignerWithAddress;
let user4: SignerWithAddress;
let user5: SignerWithAddress;

describe("FalloutFreaksRoyaltyReceiver", function () {
  before(async () => {
    [owner, signer, approved, user1, user2, user3, user4, user5] =
      await ethers.getSigners();

    // Set up contract
    contractFactory = await ethers.getContractFactory(
      "FalloutFreaksRoyaltyReceiver",
      owner
    );

    const StandardERC20Factory = await smock.mock<StandardERC20__factory>(
      "StandardERC20"
    );
    standardERC20 = await StandardERC20Factory.deploy();
    standardERC20.connect(approved).mint(ethers.utils.parseEther("100"));

    const brokenWalletFactory = await ethers.getContractFactory("BrokenWallet");
    brokenWallet = await brokenWalletFactory.deploy();
  });

  beforeEach(async () => {
    contract = await contractFactory.deploy();
    await contract.deployed();
  });

  describe("When receiving ether", async () => {
    it("should allow contract to receive ether", async () => {
      const value = ethers.utils.parseEther("1");

      await expect(
        owner.sendTransaction({
          to: contract.address,
          value,
        })
      ).to.not.be.reverted;
    });
  });

  describe("When setting withdrawal addresses", async () => {
    it("should return the correct default withdrawal address when no withdrawal address has been set for Jungle Freaks 1", async () => {
      expect(await contract.user1()).to.eql(
        "0x8e5F332a0662C8c06BDD1Eed105Ba1C4800d4c2f"
      );
    });

    it("should return the correct default withdrawal address when no withdrawal address has been set for Scott A", async () => {
      expect(await contract.user2()).to.eql(
        "0x954BfE5137c8D2816cE018EFd406757f9a060e5f"
      );
    });

    it("should return the correct default withdrawal address when no withdrawal address has been set for Massless", async () => {
      expect(await contract.user3()).to.eql(
        "0xd196e0aFacA3679C27FC05ba8C9D3ABBCD353b5D"
      );
    });

    it("should set the withdrawal address for Jungle Freaks", async () => {
      await expect(contract.setUser1(user1.address)).to.not.be.reverted;
    });

    it("should fail to set the Jungle Freaks withdrawal address because user is not owner", async () => {
      await expect(
        contract.connect(user1).setUser1(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should set the withdrawal address for Scott A", async () => {
      await expect(contract.setUser2(user1.address)).to.not.be.reverted;
    });

    it("should fail to set the Scott A withdrawal address because user is not owner", async () => {
      await expect(
        contract.connect(user1).setUser2(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should set the withdrawal address for Massless", async () => {
      await expect(contract.setUser3(user1.address)).to.not.be.reverted;
    });

    it("should fail to set the Massless withdrawal address because user is not owner", async () => {
      await expect(
        contract.connect(user1).setUser3(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("When withdrawing Ether Funds", async () => {
    it("should fail to withdraw when balance is zero", async () => {
      await expect(contract.withdrawEth()).to.be.revertedWith("ZeroBalance");
    });

    it("should fail to withdraw when there is a wallet error", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");
      await expect(
        owner.sendTransaction({
          to: contract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(contract.setUser3(brokenWallet.address)).to.not.be.reverted;

      await expect(contract.withdrawEth()).to.be.revertedWith(
        "WithdrawalFailedUser3"
      );

      await expect(contract.setUser2(brokenWallet.address)).to.not.be.reverted;

      await expect(contract.withdrawEth()).to.be.revertedWith(
        "WithdrawalFailedUser2"
      );

      await expect(contract.setUser1(brokenWallet.address)).to.not.be.reverted;

      await expect(contract.withdrawEth()).to.be.revertedWith(
        "WithdrawalFailedUser1"
      );
    });

    it("should allow anyone to initiate withdrawEth()", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        owner.sendTransaction({
          to: contract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(contract.connect(user1).withdrawEth()).to.not.be.reverted;
    });

    it("should withdraw contract balance to the default withdrawal addresses.", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        owner.sendTransaction({
          to: contract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(contract.withdrawEth()).to.be.not.be.reverted;
    });

    it("should withdraw contract balance to the correct withdrawal addresses.", async () => {
      const user1InitialBalance = await user1.getBalance();
      const user2InitialBalance = await user2.getBalance();
      const user3InitialBalance = await user3.getBalance();

      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        owner.sendTransaction({
          to: contract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(contract.setUser1(user1.address)).to.not.be.reverted;

      await expect(contract.setUser2(user2.address)).to.not.be.reverted;

      await expect(contract.setUser3(user3.address)).to.not.be.reverted;

      await expect(contract.withdrawEth()).to.be.not.be.reverted;

      expect(await user1.getBalance()).to.equal(
        user1InitialBalance.add(value.mul(8000).div(10000)) // 80.00%
      );
      expect(await user2.getBalance()).to.equal(
        user2InitialBalance.add(value.mul(1000).div(10000)) // 10.00%
      );
      expect(await user3.getBalance()).to.be.closeTo(
        user3InitialBalance.add(value.mul(1000).div(10000)), // 10.00%
        10
      );
    });
  });

  describe("When withdrawing ERC20 Funds", async () => {
    it("should fail to withdraw when balance is zero", async () => {
      await expect(
        contract.withdrawErc20(standardERC20.address)
      ).to.be.revertedWith("ZeroBalance");
    });

    // I can't create a scenario where a standard transfer could error because of a wallet address
    // it("should fail to withdraw when there is a wallet error", async () => {
    //   const value = ethers.utils.parseEther("3.14159265358979323");

    //   await expect(
    //     standardERC20.connect(approved).transfer(contract.address, value)
    //   ).to.not.be.reverted;

    //   await expect(contract.setUser4(brokenWallet.address)).to.not.be
    //     .reverted;

    //   await expect(
    //     contract.withdrawErc20(standardERC20.address)
    //   ).to.be.revertedWith("WithdrawalFailedUser4");

    //   await expect(contract.setUser3(brokenWallet.address)).to.not.be
    //     .reverted;

    //   await expect(
    //     contract.withdrawErc20(standardERC20.address)
    //   ).to.be.revertedWith("WithdrawalFailedUser3");

    //   await expect(contract.setUser2(brokenWallet.address)).to.not.be
    //     .reverted;

    //   await expect(
    //     contract.withdrawErc20(standardERC20.address)
    //   ).to.be.revertedWith("WithdrawalFailedUser2");

    //   await expect(contract.setUser1(brokenWallet.address)).to.not.be
    //     .reverted;

    //   await expect(
    //     contract.withdrawErc20(standardERC20.address)
    //   ).to.be.revertedWith("WithdrawalFailedUser1");
    // });

    it("should allow anyone to initiate withdrawErc20(standardERC20.address)", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        standardERC20.connect(approved).transfer(contract.address, value)
      ).to.not.be.reverted;

      await expect(contract.connect(user1).withdrawErc20(standardERC20.address))
        .to.not.be.reverted;
    });
    it("should withdraw contract balance to the default withdrawal addresses.", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        standardERC20.connect(approved).transfer(contract.address, value)
      ).to.not.be.reverted;

      await expect(contract.withdrawErc20(standardERC20.address)).to.be.not.be
        .reverted;
    });

    it("should withdraw contract balance to the correct withdrawal addresses.", async () => {
      const user1InitialBalance = await standardERC20.balanceOf(user1.address);
      const user2InitialBalance = await standardERC20.balanceOf(user2.address);
      const user3InitialBalance = await standardERC20.balanceOf(user3.address);

      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        standardERC20.connect(approved).transfer(contract.address, value)
      ).to.not.be.reverted;

      await expect(contract.setUser1(user1.address)).to.not.be.reverted;

      await expect(contract.setUser2(user2.address)).to.not.be.reverted;

      await expect(contract.setUser3(user3.address)).to.not.be.reverted;

      await expect(contract.withdrawErc20(standardERC20.address)).to.be.not.be
        .reverted;

      expect(await standardERC20.balanceOf(user1.address)).to.equal(
        user1InitialBalance.add(value.mul(8000).div(10000)) // 80.00%
      );
      expect(await standardERC20.balanceOf(user2.address)).to.equal(
        user2InitialBalance.add(value.mul(1000).div(10000)) // 10.00%
      );
      expect(await standardERC20.balanceOf(user3.address)).to.be.closeTo(
        user3InitialBalance.add(value.mul(1000).div(10000)), // 10.00%
        10
      );
    });
  });
});
