import { expect } from "chai";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should support supporting interfaces", async () => {
    const ERC165InterfaceId = "0x01ffc9a7"; // type(IERC165).interfaceId

    expect(
      await ctx.crystalContract.supportsInterface(ERC165InterfaceId)
    ).to.equal(true);
  });

  it("should support ERC1155 Interface", async () => {
    const ERC1155InterfaceId = "0xd9b67a26"; // type(IERC1155).interfaceId

    expect(
      await ctx.crystalContract.supportsInterface(ERC1155InterfaceId)
    ).to.equal(true);
  });

  it("should support ContractURI Interface", async () => {
    const ContractURIInterfaceId = "0xe8a3d485"; // type(IContractURI).interfaceId

    expect(
      await ctx.crystalContract.supportsInterface(ContractURIInterfaceId)
    ).to.equal(true);
  });

  it("should support ERC2981 Interface", async () => {
    const ERC2981InterfaceId = "0x2a55205a"; // type(IERC2981).interfaceId

    expect(
      await ctx.crystalContract.supportsInterface(ERC2981InterfaceId)
    ).to.equal(true);
  });
}
