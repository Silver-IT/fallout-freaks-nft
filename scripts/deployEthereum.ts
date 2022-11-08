import * as dotenv from "dotenv";
import hre, { ethers } from "hardhat";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import {
  contractDeployment,
  etherscanVerification,
  keypress,
  writeContractData,
} from "./utils";
import { BigNumber } from "ethers";
import {
  FalloutCrystal,
  FalloutFreaks,
  FalloutFreaksRoyaltyReceiver,
} from "../typechain";

dotenv.config();

const network = hre.network.name;

// Settings //////////////////////////////////////////////////////////////

const settingsNetwork = "mainnet";

const contractOwner = { address: "0x8e5F332a0662C8c06BDD1Eed105Ba1C4800d4c2f" };
const contractSigner = {
  address: "0xd497c27C285E9D32cA316E8D9B4CCd735dEe4C15",
};

const contractAdmin = {
  address: "0x859010BaAD3E7f51A5EF1e43550056ea29542Fb0",
};
const contractAdmin2 = {
  address: "0x5c45535cd1729153Ec3dF2100ca2c3f8F2CF3704",
};

const jfgContract = { address: "0x7e6bc952d4b4bd814853301bee48e99891424de0" };
const jfmcContract = { address: "0x779421ffe3c1a0a45f03fb246757f7575ce133ef" };
const jungleContract = {
  address: "0x4d648c35212273d638a5e602ab1177bb75ad7946",
};

const merkleRoot =
  "0x388c7b7b4cb14b546c6be7f6a738e93ed560e5d33c38e6255a50c5efe4651eb0";

const baseURI =
  "https://metadata-api-zat4rv54ya-uc.a.run.app/v1/nft-metadata/mainnet/-N2rI8pRIubkv0sH6p_V/";

const date = new Date().toJSON().replace(/-|:|T|\..*/g, "");
const dir = `deployment/${network}`;
const filename = `deployment-${date}.json`;

/////////////////////////////////////////////////////////////////////////

async function main() {
  // Global(ish) vars
  console.log("\nConnect your ledger and navigate to the ethereum app\n");
  const contractDeployer = new LedgerSigner(hre.ethers.provider);
  await contractDeployer.getAddress().catch((e) => {
    console.log("\nERROR: Ledger needs to be unlocked\n");
    process.exit(1);
  });
  await contractDeployer.getChainId().catch((e) => {
    console.log("\nERROR: Open Etheruem app on the Ledger.\n");
    process.exit(1);
  });

  if (["hardhat", "localhost"].includes(network)) {
    const [testUser] = await ethers.getSigners();
    testUser.sendTransaction({
      to: await contractDeployer.getAddress(),
      value: ethers.utils.parseEther("200"),
    });
  }

  let initialBalance: BigNumber;
  let currentBalance: BigNumber;
  let rrContract: FalloutFreaksRoyaltyReceiver;
  let falloutContract: FalloutFreaks;
  let crystalContract: FalloutCrystal;

  console.log("***************************");
  console.log("*   Contract Deployment   *");
  console.log("***************************");
  console.log("\n");

  // Confirm Settings
  {
    console.log("Settings");
    console.log("Network:", network, settingsNetwork == network);
    console.log(
      "Contract Owner Address:",
      contractOwner.address,
      ethers.utils.isAddress(contractOwner.address)
    );
    console.log("\n");

    writeContractData(dir, filename, {
      date,
      network,
      contractOwnerAddress: contractOwner.address,
      signerAddress: contractSigner.address,
    });

    await keypress();
  }

  // Confirm Deployer
  {
    initialBalance = await contractDeployer.getBalance();

    console.log("Deployment Wallet");
    console.log("Address:", await contractDeployer.getAddress());
    console.log("ChainId: ", await contractDeployer.getChainId());
    console.log("Balance:", ethers.utils.formatEther(initialBalance), "Ether");
    console.log("\n");

    writeContractData(dir, filename, {
      deployerAddress: await contractDeployer.getAddress(),
    });

    await keypress();
  }

  // Royalty Receiver Deployment
  {
    rrContract = (await contractDeployment(
      contractDeployer,
      "FalloutFreaksRoyaltyReceiver",
      "Fallout Freaks Royalty Receiver"
    )) as FalloutFreaksRoyaltyReceiver;

    writeContractData(dir, filename, {
      royaltyReceiverAddress: rrContract.address,
    });

    // Verify on etherscan
    // await etherscanVerification(rrContract.address);

    await keypress();
  }

  // Fallout Crystal Deployment
  {
    const args = [
      contractSigner.address,
      contractAdmin.address,
      rrContract.address,
      jungleContract.address,
      jfgContract.address,
      [],
    ];
    crystalContract = (await contractDeployment(
      contractDeployer,
      "FalloutCrystal",
      "Fallout Crystal",
      args
    )) as FalloutCrystal;

    writeContractData(dir, filename, {
      crystalAddress: crystalContract.address,
      crystalArgs: args,
    });

    // Verify on etherscan
    // await etherscanVerification(crystalContract.address, args);

    await keypress();
  }

  // Fallout Freaks Contract Deployment
  {
    const args = [
      contractSigner.address,
      contractAdmin.address,
      rrContract.address,
      jfgContract.address,
      jfmcContract.address,
      crystalContract.address,
      jungleContract.address,
      [],
    ];
    falloutContract = (await contractDeployment(
      contractDeployer,
      "FalloutFreaks",
      "Fallout Freaks",
      args
    )) as FalloutFreaks;

    writeContractData(dir, filename, {
      falloutAddress: falloutContract.address,
      falloutArguments: args,
    });

    // Verify on etherscan
    // await etherscanVerification(falloutContract.address, args);

    await keypress();
  }

  // Extra settings
  {
    console.log("Set FFRK Merkle Root");

    await keypress("Press any key to continue or ctrl-C to cancel");
    let tx = await falloutContract
      .connect(contractDeployer)
      .setMerkleRoot(merkleRoot);
    console.log("setMerkleRoot tx hash:", tx.hash);
    await tx.wait();

    await keypress();

    console.log("Set FFRK baseURI Root");

    await keypress("Press any key to continue or ctrl-C to cancel");
    tx = await falloutContract.connect(contractDeployer).setBaseURI(baseURI);
    console.log("setBaseURI tx hash:", tx.hash);
    await tx.wait();

    await keypress();

    console.log("Set Admin2");

    await keypress("Press any key to continue or ctrl-C to cancel");
    tx = await falloutContract
      .connect(contractDeployer)
      .setAdminPermission(contractAdmin2.address);
    console.log("setAdmin2 tx hash:", tx.hash);
    await tx.wait();

    await keypress();
  }

  // Transfer ownership
  {
    console.log("Transfer Ownership to: " + contractOwner.address);

    await keypress("Press any key to continue and ctrl-C to cancel");
    let tx = await rrContract
      .connect(contractDeployer)
      .transferOwnership(contractOwner.address);
    console.log("Royalty Receiver owner tx hash:", tx.hash);
    await tx.wait();

    tx = await crystalContract
      .connect(contractDeployer)
      .transferOwnership(contractOwner.address);
    console.log("FCR owner tx hash:", tx.hash);
    await tx.wait();

    tx = await falloutContract
      .connect(contractDeployer)
      .transferOwnership(contractOwner.address);
    console.log("FFRK owner tx hash:", tx.hash);
    await tx.wait();
  }

  // Deployment Costs
  {
    currentBalance = await contractDeployer.getBalance();
    console.log(
      "Deployment Cost:",
      ethers.utils.formatEther(initialBalance.sub(currentBalance)),
      "Ether"
    );
    console.log("\n");

    writeContractData(dir, filename, {
      deploymentCost: ethers.utils.formatEther(
        initialBalance.sub(currentBalance)
      ),
    });

    console.log("Completed Successfully");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
