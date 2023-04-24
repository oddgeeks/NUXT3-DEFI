import { BigNumber } from 'bignumber.js'

export function useBignumber() {
  type CombinedBigNumber = BigNumber | string | number

  function pow(value: CombinedBigNumber, exponent: string | number) {
    return toBN(value).pow(toBN(exponent))
  }

  function toWei(val: CombinedBigNumber, decimals: number): string {
    const num = toBN(val)
    const multiplier = pow(10, decimals)
    return times(num, multiplier).toFixed(0)
  }

  function fromWei(val: CombinedBigNumber, decimal = 18) {
    return toBN(val).div(new BigNumber(10).pow(decimal))
  }

  function abs(value: CombinedBigNumber) {
    return toBN(value).abs()
  }

  return { toWei, fromWei, abs }
}
