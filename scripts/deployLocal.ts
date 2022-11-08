import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import fs from "fs";
import hre, { ethers } from "hardhat";
import keccak256 from "keccak256";
import {
  InsecureJungle,
  FalloutCrystal,
  FalloutFreaks,
  FalloutFreaksRoyaltyReceiver,
  StandardERC1155,
  StandardERC721,
} from "../typechain";
import { contractDeployment, keypress, writeContractData } from "./utils";

dotenv.config();

const network = hre.network.name;

// Settings //////////////////////////////////////////////////////////////

const settingsNetwork = "localhost";

// const contractOwner = { address: "" };
// const contractSigner = { address: "" };

const merkleRoot = keccak256("MerkleRoot");
const date = new Date().toJSON().slice(0, 10);
const dir = `deployment/${network}`;
const filename = `deployment-${date}.json`;

const contractModerator = {
  address: "0x859010BaAD3E7f51A5EF1e43550056ea29542Fb0",
};

//////////////////////////////////////////////////////////////////////////

async function main() {
  // Global(ish) vars
  const [contractDeployer, contractOwner, contractSigner] =
    await ethers.getSigners();
  // const contractDeployer = new LedgerSigner(hre.ethers.provider);
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
  let jfgContract: StandardERC721;
  let jflContract: StandardERC1155;
  let jfmcContract: StandardERC721;
  let jungleContract: InsecureJungle;
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
    console.log("Chainid: ", await contractDeployer.getChainId());
    console.log("Balance:", ethers.utils.formatEther(initialBalance), "Ether");
    console.log("\n");

    writeContractData(dir, filename, {
      deployerAddress: await contractDeployer.getAddress(),
    });

    // await keypress();
  }

  // Royalty Receiver Deployment
  {
    rrContract = (await contractDeployment(
      contractDeployer,
      "FalloutFreaksRoyaltyReceiver",
      "Royalty Receiver"
    )) as FalloutFreaksRoyaltyReceiver;

    writeContractData(dir, filename, {
      royaltyReceiverAddress: rrContract.address,
    });

    // await keypress();
  }

  // Jungle Freaks Genesis Deployment
  {
    jfgContract = (await contractDeployment(
      contractDeployer,
      "StandardERC721",
      "Jungle Freaks Genesis"
    )) as StandardERC721;

    writeContractData(dir, filename, {
      jfgAddress: jfgContract.address,
    });

    // await keypress();
  }

  // Jungle Freaks Legendary Deployment
  {
    jflContract = (await contractDeployment(
      contractDeployer,
      "StandardERC1155",
      "Jungle Freaks Legendary"
    )) as StandardERC1155;

    writeContractData(dir, filename, {
      jflAddress: jflContract.address,
    });

    // await keypress();
  }

  // Jungle Freaks Motor Club Deployment
  {
    jfmcContract = (await contractDeployment(
      contractDeployer,
      "StandardERC721",
      "Jungle Freaks Motor Club"
    )) as StandardERC721;

    writeContractData(dir, filename, {
      jfmcAddress: jfmcContract.address,
    });

    // await keypress();
  }

  // Jungle Staking Deployment
  {
    const args = [jfgContract.address, jflContract.address];
    jungleContract = (await contractDeployment(
      contractDeployer,
      "InsecureJungle",
      "Jungle Staking",
      args
    )) as InsecureJungle;

    writeContractData(dir, filename, {
      jungleAddress: jungleContract.address,
    });

    // await keypress();
  }

  // Crystal Freaks Deployment
  {
    const args = [
      contractSigner.address,
      contractModerator.address,
      rrContract.address,
      jungleContract.address,
      jfgContract.address,
      [],
    ];
    crystalContract = (await contractDeployment(
      contractDeployer,
      "FalloutCrystal",
      "Crystal Freaks",
      args
    )) as FalloutCrystal;

    writeContractData(dir, filename, {
      crystalAddress: crystalContract.address,
    });

    // await keypress();
  }

  // Main Contract Deployment
  {
    const args = [
      contractSigner.address,
      contractModerator.address,
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
      "Jungle Freaks Fallout Freaks",
      args
    )) as FalloutFreaks;

    writeContractData(dir, filename, {
      contractAddress: falloutContract.address,
      contractArguments: args,
    });

    // await keypress();
  }

  // Extra settings
  {
    console.log("Set Merkle Root");

    // await keypress("Press any key to continue or ctrl-C to cancel");
    const tx = await falloutContract
      .connect(contractDeployer)
      .setMerkleRoot(merkleRoot);
    console.log("merkle root tx hash:", tx.hash);
    await tx.wait();

    // await keypress();
  }

  // Transfer ownership
  {
    let tx;
    console.log("Transfer Ownership to: " + contractOwner.address);

    // await keypress("Press any key to continue and ctrl-C to cancel");
    tx = await rrContract
      .connect(contractDeployer)
      .transferOwnership(contractOwner.address);
    console.log("Royalty Receiver owner tx hash:", tx.hash);
    await tx.wait();

    tx = await crystalContract
      .connect(contractDeployer)
      .transferOwnership(contractOwner.address);
    console.log("Crystal Contract owner tx hash:", tx.hash);
    await tx.wait();

    tx = await falloutContract
      .connect(contractDeployer)
      .transferOwnership(contractOwner.address);
    console.log("Fallout Contract owner tx hash:", tx.hash);
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
