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
  const { fee, multiplier = '0', discountDetails } = params

  if (!fee) {
    return {
      discountDetails: {
        discount: 0,
        name: '',
        tooltip: '',
        iconURL: '',
      },
      discountAmount: 0,
      amountAfterDiscount: 0,
      min: 0,
      max: 0,
      formattedAmountAfterDiscount: '0.00',
      formatted: '0.00',
    }
  }

  const discount = discountDetails?.discount

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

  const discountAmountMin = discount ? actualMin * discount : 0
  const discountAmount = discount ? actualMax * discount : 0

  const maxAmountAfterDiscount = discount
    ? actualMax - discountAmount
    : actualMax
  const minAmountAfterDiscount = discount
    ? actualMin - discountAmountMin
    : actualMin

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
    discountDetails,
    discountAmount,
    min: actualMin,
    max: actualMax,
    formatted,
    amountAfterDiscount: maxAmountAfterDiscount,
    formattedAmountAfterDiscount,
  }
}
