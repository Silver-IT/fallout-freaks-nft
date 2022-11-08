import { MockContractFactory } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MerkleTree } from "merkletreejs";
import {
  InsecureJungle,
  FalloutFreaksRoyaltyReceiver,
  FalloutCrystal,
  FalloutCrystal__factory,
  FalloutFreaks,
  FalloutFreaks__factory,
  StandardERC1155,
  StandardERC721,
} from "../../typechain";

declare module "mocha" {
  export interface Context {
    owner: SignerWithAddress;
    signer: SignerWithAddress;
    approved: SignerWithAddress;
    admin: SignerWithAddress;
    mod: SignerWithAddress;
    user1: SignerWithAddress;
    user2: SignerWithAddress;
    user3: SignerWithAddress;
    user4: SignerWithAddress;
    user5: SignerWithAddress;
    user6: SignerWithAddress;
    user7: SignerWithAddress;
    user8: SignerWithAddress;
    user9: SignerWithAddress;
    jfgContract: StandardERC721;
    jflContract: StandardERC1155;
    rrContract: FalloutFreaksRoyaltyReceiver;
    jungleContract: InsecureJungle;
    falloutContractFactory: FalloutFreaks__factory;
    falloutContract: FalloutFreaks;
    crystalContractFactory: FalloutCrystal__factory;
    crystalContract: FalloutCrystal;
    mockCrystalContractFactory: MockContractFactory<FalloutCrystal__factory>;
    mockFalloutContractFactory: MockContractFactory<FalloutFreaks__factory>;
    allowList: string[];
    leavesLookup: Record<string, string>;
    merkleTree: MerkleTree;
    preAuthorizedAddresses: string[];
  }
}
