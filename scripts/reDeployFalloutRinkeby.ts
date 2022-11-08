import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import fs from "fs";
import hre, { ethers } from "hardhat";
import keccak256 from "keccak256";
import { PKEHFDGO1, FJBAMACL5, BKHEHDKD1 } from "../typechain";
import { contractDeployment, keypress, writeContractData } from "./utils";

dotenv.config();

const network = hre.network.name;

// Settings //////////////////////////////////////////////////////////////

const settingsNetwork = "rinkeby";

const contractOwner = { address: "0x560f5AB13D3D93A674470F90B6d1089c2BB1ceEB" };
const contractSigner = {
  address: "0xd497c27C285E9D32cA316E8D9B4CCd735dEe4C15",
};

const contractModerator = {
  address: "0x859010BaAD3E7f51A5EF1e43550056ea29542Fb0",
};

let jfgContract = { address: "0xCF26d81BCbafec9bcc5bAB1c484f1b32e4000b67" };
let jfmcContract = { address: "0x6655F87375EB25118A05F4Eb840CAf5869971b41" };
let jungleContract = { address: "0xd91215bB92b5c19B132A900747e672248d99F72A" };
let rrContract = { address: "0x607A845F27ccD01078C54F1a59527dE96D2e33b0" };
let crystalContract = { address: "0xEE823EB9Ab3954f3bbF1f556603a0bA1262017A0" };

const merkleRoot =
  "0xc172407da295d242a24f7ad60c829581da03c7fd90e543e2efc3096b45bd33c2";
const date = new Date().toJSON().replace(/-|:|T|\..*/g, "");
const dir = `deployment/${network}`;
const filename = `deployment-${date}.json`;

//////////////////////////////////////////////////////////////////////////

async function main() {
  // Global(ish) vars
  const [contractDeployer] = await ethers.getSigners();
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
  // let rrContract: BKHEHDKD1;
  let falloutContract: FJBAMACL5;
  // let crystalContract: PKEHFDGO1;

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

  // // Royalty Receiver Deployment
  // {
  //   rrContract = (await contractDeployment(
  //     contractDeployer,
  //     "BKHEHDKD1",
  //     "Royalty Receiver"
  //   )) as BKHEHDKD1;

  //   writeContractData(dir, filename, {
  //     royaltyReceiverAddress: rrContract.address,
  //   });

  //   // await keypress();
  // }

  // // Crystal Freaks Deployment
  // {
  //   const args = [
  //     contractSigner.address,
  //     contractModerator.address,
  //     rrContract.address,
  //     jungleContract.address,
  //     jfgContract.address,
  //     [],
  //   ];
  //   crystalContract = (await contractDeployment(
  //     contractDeployer,
  //     "PKEHFDGO1",
  //     "Crystal Freaks",
  //     args
  //   )) as PKEHFDGO1;

  //   writeContractData(dir, filename, {
  //     crystalAddress: crystalContract.address,
  //   });

  //   // await keypress();
  // }

  // Fallout Freaks Contract Deployment
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
      "FJBAMACL5",
      "Jungle Freaks Fallout Freaks",
      args
    )) as FJBAMACL5;

    writeContractData(dir, filename, {
      falloutAddress: falloutContract.address,
      falloutArguments: args,
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
    // tx = await rrContract
    //   .connect(contractDeployer)
    //   .transferOwnership(contractOwner.address);
    // console.log("Royalty Receiver owner tx hash:", tx.hash);
    // await tx.wait();

    // tx = await crystalContract
    //   .connect(contractDeployer)
    //   .transferOwnership(contractOwner.address);
    // console.log("Crystal Contract owner tx hash:", tx.hash);
    // await tx.wait();

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
