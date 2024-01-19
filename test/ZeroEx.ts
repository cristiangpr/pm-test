import {

  loadFixture
} from '@nomicfoundation/hardhat-toolbox/network-helpers'

import { expect } from 'chai'
import { ethers, network } from 'hardhat'

import { BigNumber } from '@0x/utils'

import { RfqOrder, type Signature } from '@0x/protocol-utils'
import { ERC20TokenContract, IZeroExContract } from '@0x/contract-wrappers'
import { matchOrders } from './utils'

describe('ZeroEx', function () {
  async function deployFixture (): Promise<Record<string, any>> {
    const [maker, taker] = await ethers.getSigners()

    const zeroExAddress = '0xf471d32cb40837bf24529fcf17418fc1a4807626'
    // set up test tokens
    const Token1 = await ethers.getContractFactory('Token1')
    const token1 = await Token1.deploy()
    const amount = '30000000000'

    const token1Receipt = await token1.mint(maker, amount)
    await token1Receipt.wait()

    const Token2 = await ethers.getContractFactory('Token2')
    const token2 = await Token2.deploy()

    const token2Receipt = await token2.mint(taker, amount)
    await token2Receipt.wait()

    const token1Address = await token1.getAddress()
    const token2Address = await token2.getAddress()
    const makerAddress = await maker.getAddress()
    const takerAddress = await taker.getAddress()
    const maxApproval = new BigNumber(2).pow(256).minus(1)
    const token1Contract = new ERC20TokenContract(
      token1Address,
      network.provider
    )

    // approve exchanfe conract

    const token1ApprovalData = token1Contract.approve(
      zeroExAddress as string,
      maxApproval
    ).getABIEncodedTransactionData()

    await maker.sendTransaction({
      to: token1Address,
      value: '0',
      data: token1ApprovalData
    })

    const token2Contract = new ERC20TokenContract(
      token2Address,
      network.provider
    )

    const token2ApprovalData = token2Contract.approve(
      zeroExAddress as string,
      maxApproval
    ).getABIEncodedTransactionData()

    await taker.sendTransaction({
      to: token2Address,
      value: '0',
      data: token2ApprovalData
    })

    return { token1, token2, zeroExAddress, token1Address, token2Address, maker, taker, makerAddress, takerAddress }
  }

  describe('Order', function () {
    it('Should create and fill an order', async function () {
      const { zeroExAddress, token1Address, token2Address, makerAddress, takerAddress } = await loadFixture(deployFixture)

      const sellOrder = new RfqOrder({

        chainId: 80001,
        verifyingContract: zeroExAddress,
        txOrigin: takerAddress,
        salt: new BigNumber(Date.now()),
        makerToken: token1Address,
        takerToken: token2Address,

        maker: makerAddress,
        makerAmount: new BigNumber(10000000000),
        takerAmount: new BigNumber(20000000000),
        // A null taker address allows anyone to fill this order
        taker: ethers.ZeroAddress,

        // Order expires in one hour
        expiry: new BigNumber(Math.floor(Date.now() / 1000 + 3600))
      })
      const signature: Signature = await sellOrder.getSignatureWithProviderAsync(network.provider, undefined, makerAddress as string)

      const exchange = new IZeroExContract(
        zeroExAddress as string,
        network.provider
      )

      const tx = await exchange
        .fillRfqOrder(sellOrder, signature, sellOrder.takerAmount)
        .callAsync({ from: takerAddress })

      console.log(tx)

      expect(tx[0]).to.equal(sellOrder.takerAmount)
      expect(tx[1]).to.equal(sellOrder.makerAmount)
    })
  })
  describe('matchOrders', function () {
    it('Should match and fill orders', async function () {
      const { zeroExAddress, token1Address, token2Address, makerAddress, takerAddress } = await loadFixture(deployFixture)
      const buyOrders = []
      const buyOrder1 = new RfqOrder({

        chainId: 80001,
        verifyingContract: zeroExAddress,
        txOrigin: makerAddress,
        salt: new BigNumber(Date.now()),
        makerToken: token2Address,
        takerToken: token1Address,

        maker: takerAddress,
        makerAmount: new BigNumber(20000000000),
        takerAmount: new BigNumber(5000000000),
        // A null taker address allows anyone to fill this order
        taker: ethers.ZeroAddress,

        // Order expires in one hour
        expiry: new BigNumber(Math.floor(Date.now() / 1000 + 3600))
      })
      buyOrders.push(buyOrder1)
      const buyOrder2 = new RfqOrder({

        chainId: 80001,
        verifyingContract: zeroExAddress,
        txOrigin: makerAddress,
        salt: new BigNumber(Date.now()),
        makerToken: token2Address,
        takerToken: token1Address,

        maker: takerAddress,
        makerAmount: new BigNumber(20000000000),
        takerAmount: new BigNumber(5000000000),
        // A null taker address allows anyone to fill this order
        taker: ethers.ZeroAddress,

        // Order expires in one hour
        expiry: new BigNumber(Math.floor(Date.now() / 1000 + 3600))
      })
      buyOrders.push(buyOrder2)

      const sellOrder = new RfqOrder({

        chainId: 80001,
        verifyingContract: zeroExAddress,
        txOrigin: takerAddress,
        salt: new BigNumber(Date.now()),
        makerToken: token1Address,
        takerToken: token2Address,

        maker: makerAddress,
        makerAmount: new BigNumber(10000000000),
        takerAmount: new BigNumber(20000000000),
        // A null taker address allows anyone to fill this order
        taker: ethers.ZeroAddress,

        // Order expires in one hour
        expiry: new BigNumber(Math.floor(Date.now() / 1000 + 3600))
      })

      const exchange = new IZeroExContract(
        zeroExAddress as string,
        network.provider
      )

      const result = await matchOrders(sellOrder, buyOrders, exchange, network.provider)

      console.log(result)

      expect(result[0][1]).to.equal(buyOrder1.takerAmount)
      expect(result[1][0]).to.equal(buyOrder2.takerAmount)
    })
  })
})
