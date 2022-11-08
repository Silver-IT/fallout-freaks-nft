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
      await ctx.falloutContract.supportsInterface(ERC165InterfaceId)
    ).to.equal(true);
  });

  it("should support ERC721 Interface", async () => {
    const ERC721InterfaceId = "0x80ac58cd"; // type(IERC721).interfaceId

    expect(
      await ctx.falloutContract.supportsInterface(ERC721InterfaceId)
    ).to.equal(true);
  });

  it("should support ERC721 Metadata Interface", async () => {
    const ERC721MetadataInterfaceId = "0x5b5e139f"; // type(IERC721Metadata).interfaceId

    expect(
      await ctx.falloutContract.supportsInterface(ERC721MetadataInterfaceId)
    ).to.equal(true);
  });

  it("should support AccessControl Interface", async () => {
    const AccessControlInterfaceId = "0x7965db0b"; // type(IAccessControl).interfaceId

    expect(
      await ctx.falloutContract.supportsInterface(AccessControlInterfaceId)
    ).to.equal(true);
  });

  it("should support ERC2981 Interface", async () => {
    const ERC2981InterfaceId = "0x2a55205a"; // type(IERC2981).interfaceId

    expect(
      await ctx.falloutContract.supportsInterface(ERC2981InterfaceId)
    ).to.equal(true);
  });
}
