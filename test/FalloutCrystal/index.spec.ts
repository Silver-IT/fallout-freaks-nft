import supportedInterfaces from "./suites/supportedInterfaces.test";
import publicVariables from "./suites/publicVariables.test";
import moderator from "./suites/moderator.test";
import signingTx from "./suites/signingTx.test";
import receivingEther from "./suites/receivingEther.test";
import withdrawingEther from "./suites/withdrawingEther.test";
import saleState from "./suites/saleState.test";
import phase1Mint from "./suites/phase1Mint.test";
import phase2Mint from "./suites/phase2Mint.test";
import burn from "./suites/burn.test";
import preAuthorized from "./suites/preAuthorized.test";
import baseURI from "./suites/baseURI.test";

describe("FalloutCrystal", function () {
  describe("When supporting interfaces", supportedInterfaces.bind(this));
  describe("When getting public variables", publicVariables.bind(this));
  describe("When updating ownership", moderator.bind(this));
  describe("When signing tx", signingTx.bind(this));
  describe("When receiving ether", receivingEther.bind(this));
  describe("When withdrawing ether", withdrawingEther.bind(this));
  describe("When changing sale state", saleState.bind(this));
  describe("When phase 1 minting", phase1Mint.bind(this));
  describe("When phase 2 minting", phase2Mint.bind(this));
  describe("When burning", burn.bind(this));
  describe("When pre authorizing", preAuthorized.bind(this));
  describe("When setting baseURI", baseURI.bind(this));
});
