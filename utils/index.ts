import { ethers } from 'ethers'

export const injectFavicon = function (src: string) {
  const head = document.querySelector('head')!
  const iconElement = document.createElement('link')
  iconElement.type = 'image/x-icon'
  iconElement.rel = 'icon'
  iconElement.href = src

  const links = document.querySelectorAll('link[rel~="icon"]')

  for (let i = 0; i < links.length; i++)
    head.removeChild(links[i])

  head.appendChild(iconElement)
}

export async function slack(message: string,
  type: ISlackMessageType = 'success') {
  await http('/api/slack', {
    method: 'POST',
    body: {
      message,
      type,
    },
  })
}

export function calculateEstimatedFee(params: CalculateFeeProps): ICalculatedFee {
  const { fee, multiplier = '0', discountDetails = [] } = params

  if (!fee) {
    return {
      discountDetails: [],
      amountAfterDiscount: 0,
      min: 0,
      max: 0,
      minAmountAfterDiscount: 0,
      maxAmountAfterDiscount: 0,
      formattedAmountAfterDiscount: '0.00',
      formatted: '0.00',
      discountAvailable: false,
      chainId: params.chainId,
    }
  }

  const discountAvailable = discountDetails?.length > 0

  const maxVal = toBN(fee)
    .dividedBy(10 ** 18)
    .toNumber()

  const minVal = toBN(fee)
    .dividedBy(multiplier)
    .dividedBy(10 ** 14)
    .toNumber()

  const actualMin = Math.max(minVal, 0.01)
  const actualMax = Math.max(maxVal, 0.01)

  const formattedMin = formatDecimal(String(actualMin), 2)
  const formattedMax = formatDecimal(String(actualMax), 2)

  let maxAmountAfterDiscount = actualMax
  let minAmountAfterDiscount = actualMin

  const appliedDiscounts = discountDetails.map((discountDetail) => {
    const discount = discountDetail.amount

    const discountAvailable = !isZero(discount || 0)

    const discountAmountMin = discountAvailable
      ? Math.min(
        minAmountAfterDiscount * discount,
        minAmountAfterDiscount,
      )
      : 0
    const discountAmount = discountAvailable
      ? Math.min(
        maxAmountAfterDiscount * discount,
        maxAmountAfterDiscount,
      )
      : 0

    maxAmountAfterDiscount -= discountAmount
    minAmountAfterDiscount -= discountAmountMin

    return {
      ...discountDetail,
      discountAmountMin,
      discountAmount,
    }
  })

  const formattedDiscountedAmountMin = formatDecimal(minAmountAfterDiscount, 2)
  const formattedDiscountedAmount = formatDecimal(maxAmountAfterDiscount, 2)

  const isEqual = formattedMin === formattedMax

  const formatted = isEqual
    ? formattedMax
    : `${formattedMin} - ${formattedMax}`

  const formattedAmountAfterDiscount = isEqual
    ? formattedDiscountedAmount
    : `${formattedDiscountedAmountMin} - ${formattedDiscountedAmount}`

  return {
    discountAvailable,
    discountDetails: appliedDiscounts,
    min: actualMin,
    max: actualMax,
    formatted,
    amountAfterDiscount: maxAmountAfterDiscount,
    formattedAmountAfterDiscount,
    chainId: params.chainId,
    minAmountAfterDiscount,
    maxAmountAfterDiscount,
  }
}

export function calculateMultipleEstimatedFee(...params: ICalculatedFee[]): ICalculatedFee {
  const mergedFees = params.reduce((acc, fee) => {
    const discountDetails = acc.discountDetails || []
    const currentDiscount = fee.discountDetails || []

    acc.amountAfterDiscount = toBN(acc.amountAfterDiscount).plus(fee.amountAfterDiscount).toNumber()
    acc.discountDetails = [...discountDetails, ...currentDiscount]
    acc.chainId = fee.chainId
    acc.min = toBN(acc.min).plus(fee.min).toNumber()
    acc.max = toBN(acc.max).plus(fee.max).toNumber()

    acc.minAmountAfterDiscount = toBN(acc.minAmountAfterDiscount).plus(fee.minAmountAfterDiscount).toNumber()
    acc.maxAmountAfterDiscount = toBN(acc.maxAmountAfterDiscount).plus(fee.maxAmountAfterDiscount).toNumber()

    return acc
  }, {
    discountDetails: [],
    amountAfterDiscount: 0,
    min: 0,
    max: 0,
    formattedAmountAfterDiscount: '0.00',
    formatted: '0.00',
    discountAvailable: false,
    chainId: '1',
    maxAmountAfterDiscount: 0,
    minAmountAfterDiscount: 0,
  } as ICalculatedFee)

  mergedFees.discountAvailable = !!mergedFees?.discountDetails && mergedFees?.discountDetails?.length > 0

  const formattedDiscountedAmountMin = formatDecimal(mergedFees.minAmountAfterDiscount, 2)
  const formattedDiscountedAmount = formatDecimal(mergedFees.maxAmountAfterDiscount, 2)

  const formattedMin = formatDecimal(String(mergedFees.min), 2)
  const formattedMax = formatDecimal(String(mergedFees.max), 2)

  const isEqual = formattedMin === formattedMax

  mergedFees.formatted = isEqual
    ? formattedMax
    : `${formattedMin} - ${formattedMax}`

  mergedFees.formattedAmountAfterDiscount = isEqual
    ? formattedDiscountedAmount
    : `${formattedDiscountedAmountMin} - ${formattedDiscountedAmount}`

  return mergedFees
}

export function formatIPFSUri(ipfs: string) {
  if (ipfs.startsWith('ipfs') || ipfs.startsWith('ipfs://'))
    return `https://ipfs.decentralized-content.com/ipfs/${ipfs.replace('ipfs://', '')}`

  return ipfs
}

export async function checkAddressIsDsa(
  dsaAddress: string,
  chainId: number,
): Promise<boolean> {
  const abi = [
    'function accountID(address) external view returns (uint64)',
  ]

  const instaListAddresses = {
    1: '0x4c8a1BEb8a87765788946D6B19C6C6355194AbEb',
    137: '0x839c2D3aDe63DF5b0b8F3E57D5e145057Ab41556',
    43114: '0x9926955e0Dd681Dc303370C52f4Ad0a4dd061687',
    42161: '0x3565F6057b7fFE36984779A507fC87b31EFb0f09',
    250: '0x10e166c3FAF887D8a61dE6c25039231eE694E926',
    10: '0x9926955e0Dd681Dc303370C52f4Ad0a4dd061687',
  } as Record<number, string>

  const instaListAddress = instaListAddresses[chainId]

  const provider = getRpcProvider(chainId)

  const instaList = new ethers.Contract(instaListAddress, abi, provider)
  const accountId = await instaList.accountID(dsaAddress)

  return accountId.gt(0)
}

export const signingMethods = [
  'eth_sendTransaction',
  'eth_signTransaction',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v2',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'personal_sign',
  'wallet_addEthereumChain',
  'wallet_switchEthereumChain',
  'wallet_getPermissions',
  'wallet_requestPermissions',
  'wallet_registerOnboarding',
  'wallet_watchAsset',
  'wallet_scanQRCode',
]

export function formatProtocol(protocol: string) {
  return (
    new Map([
      ['1inch-v5', '1inch'],
      ['0x-v1', '0x Protocol'],
      ['paraswap-v5', 'Paraswap'],
      ['kyber-v1', 'Kyber Network'],
    ]).get(protocol) || protocol
  )
}
