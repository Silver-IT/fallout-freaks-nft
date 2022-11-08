import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import fs from "fs";
import hre, { ethers } from "hardhat";
import keccak256 from "keccak256";
import { TestMintDetails } from "../typechain";
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
  let testMintDetailsContract: TestMintDetails;

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

  // Jungle Freaks Genesis Deployment
  {
    testMintDetailsContract = (await contractDeployment(
      contractDeployer,
      "TestMintDetails",
      "Test Mint Details"
    )) as TestMintDetails;

    writeContractData(dir, filename, {
      testMintDetailsAddress: testMintDetailsContract.address,
    });

    // await keypress();
  }

  console.log("Completed Successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
