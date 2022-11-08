import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export default function signMintRequest(
  signer: SignerWithAddress,
  address: string,
  salt: string,
  type: string[] = [],
  value: any[] = []
) {
  const hash = ethers.utils.solidityKeccak256(
    ["address", "bytes32", ...type],
    [address, salt, ...value]
  );

  return signer.signMessage(ethers.utils.arrayify(hash));
}
