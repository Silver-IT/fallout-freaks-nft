import { ethers } from "hardhat";

beforeEach(async function () {
  const ctx = this.test?.ctx;
  if (!ctx) return;

  // const jfContract = await this.jfContractFactory.deploy();
  // this.jfContract = await jfContract.deployed();

  const jfgContract = await this.jfgContractFactory.deploy();
  this.jfgContract = await jfgContract.deployed();

  const jflContract = await this.jflContractFactory.deploy();
  this.jflContract = await jflContract.deployed();

  const standardERC20 = await this.StandardERC20Factory.deploy();
  this.standardERC20 = await standardERC20.deployed();
  this.standardERC20
    .connect(this.approved)
    .mint(ethers.utils.parseEther("100"));

  const jungleContract = await this.jungleContractFactory.deploy(
    jfgContract.address,
    jflContract.address
  );
  this.jungleContract = await jungleContract.deployed();

  const rrContract = await this.rrContractFactory.deploy();
  this.rrContract = await rrContract.deployed();

  const jfmcContract = await this.jfmcContractFactory.deploy();
  this.jfmcContract = await jfmcContract.deployed();

  const crystalContract = await ctx.crystalContractFactory.deploy(
    ctx.signer.address,
    ctx.admin.address,
    ctx.rrContract.address,
    ctx.jungleContract.address,
    ctx.jfgContract.address,
    [ctx.user8.address, ctx.user9.address]
  );
  this.crystalContract = await crystalContract.deployed();

  const falloutContract = await ctx.falloutContractFactory.deploy(
    ctx.signer.address,
    ctx.admin.address,
    ctx.royaltyReceiver.address,
    ctx.jfgContract.address,
    ctx.jfmcContract.address,
    ctx.crystalContract.address,
    ctx.jungleContract.address,
    ctx.preAuthorizedAddresses
  );
  this.falloutContract = await falloutContract.deployed();

  const brokenWallet = await this.brokenWalletFactory.deploy();
  this.brokenWallet = await brokenWallet.deployed();
});
