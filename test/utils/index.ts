import { type SupportedProvider, type IZeroExContract } from '@0x/contract-wrappers'
import { type RfqOrder, type Signature } from '@0x/protocol-utils'
import { BigNumber } from '@0x/utils'

export const matchOrders = async (sellOrder: RfqOrder, buyOrders: RfqOrder[], exchange: IZeroExContract, provider: SupportedProvider): Promise<Array<[BigNumber, BigNumber]>> => {
  const amount = new BigNumber(0)
  const result = []
  for (let i = 0; i < buyOrders.length; i += 1) {
    if (sellOrder.makerToken === buyOrders[i].takerToken) {
      const signature: Signature = await sellOrder.getSignatureWithProviderAsync(provider, undefined, sellOrder.maker)
      const tx = await exchange
        .fillRfqOrder(sellOrder, signature, sellOrder.makerAmount)
        .callAsync({ from: buyOrders[i].maker })

      console.log(tx)
      result.push(tx)
      const filledAmount = amount.plus(buyOrders[i].takerAmount)
      console.log('filled', filledAmount)
      const diff = sellOrder.makerAmount.minus(filledAmount)
      console.log('diff', diff)
      if (diff.eq(new BigNumber(0))) {
        return result
      } else {
        sellOrder.makerAmount = diff
      }
    }
  } return result
}
