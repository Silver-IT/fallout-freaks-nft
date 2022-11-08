import { expect } from 'chai'
import { randomBytes } from 'crypto'
import { BigNumber, Contract, ethers } from 'ethers'
import signMintRequest from '../../utils/signMintRequest'

export default function suite() {
  let ctx: Mocha.Context
  before(function () {
    const context = this.test?.ctx
    if (context) ctx = context
  })

  let salt: string
  let quantity: number
  let jungle: BigNumber
  let jfgIds: Array<number>
  let price: BigNumber
  beforeEach(async function () {
    salt = '0x' + randomBytes(32).toString('hex')
    quantity = 2
    jungle = ethers.utils.parseEther('0')
    jfgIds = [0, 1]
    await ctx.jfgContract.safeMintTo(ctx.user1.address, 2)
  })

  it('should fail to set signer address because user is not owner', async () => {
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .setSignerAddress(ctx.user1.address),
    ).to.be.revertedWith('NotAdminOrModerator')
  })

  it('should set the signer address', async () => {
    await expect(ctx.crystalContract.setSignerAddress(ctx.user1.address)).to.not
      .be.reverted
  })

  it('should set the signer address and fail as actual signer is not the same', async () => {
    const apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ['uint256', 'uint256[]'],
      [jungle, jfgIds],
    )

    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      'Phase1MintBegins',
    )

    await expect(ctx.crystalContract.setSignerAddress(ctx.owner.address)).to.not
      .be.reverted

    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
          value: price,
        }),
    ).to.revertedWith('SignatureFailed')
  })

  it('should set signer address and phase 1 mint successfully', async () => {
    await expect(ctx.crystalContract.setSignerAddress(ctx.owner.address)).to.not
      .be.reverted

    await expect(ctx.crystalContract.startPhase1Mint()).to.emit(
      ctx.crystalContract,
      'Phase1MintBegins',
    )

    const apiSignature = await signMintRequest(
      ctx.owner,
      ctx.user1.address,
      salt,
      ['uint256', 'uint256[]'],
      [jungle, jfgIds],
    )

    const price = ethers.utils.parseEther('0.13')

    // Mint
    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase1Mint(apiSignature, salt, jungle, jfgIds, {
          value: price.mul(jfgIds.length),
        }),
    ).to.emit(ctx.crystalContract, 'TransferSingle')

    expect(
      (await ctx.crystalContract.balanceOf(ctx.user1.address, 1)).toNumber() +
        (await ctx.crystalContract.balanceOf(ctx.user1.address, 2)).toNumber() +
        (await ctx.crystalContract.balanceOf(ctx.user1.address, 3)).toNumber(),
    ).to.be.eq(jfgIds.length)
  })

  it('should set signer address and phase 2 mint successfully', async () => {
    await expect(ctx.crystalContract.setSignerAddress(ctx.owner.address)).to.not
      .be.reverted

    await expect(ctx.crystalContract.startPhase2Mint()).to.emit(
      ctx.crystalContract,
      'Phase2MintBegins',
    )

    const apiSignature = await signMintRequest(
      ctx.owner,
      ctx.user1.address,
      salt,
      ['uint256', 'uint256'],
      [jungle, quantity],
    )

    const price = await ctx.crystalContract.holdersEthPrice(jungle, quantity)

    await expect(
      ctx.crystalContract
        .connect(ctx.user1)
        .phase2Mint(apiSignature, salt, jungle, quantity, {
          value: price,
        }),
    ).to.emit(ctx.crystalContract, 'TransferSingle')

    expect(
      (await ctx.crystalContract.balanceOf(ctx.user1.address, 1)).toNumber() +
        (await ctx.crystalContract.balanceOf(ctx.user1.address, 2)).toNumber() +
        (await ctx.crystalContract.balanceOf(ctx.user1.address, 3)).toNumber(),
    ).to.be.eq(quantity)
  })
}
