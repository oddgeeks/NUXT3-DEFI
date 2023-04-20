import type { ChartData } from 'chart.js'
import type { IBalance } from '~~/stores/safe'

export function useGraph(balance: Ref<IBalance>) {
  const interactable = computed(() => toBN(balance.value.balance).gt(0))

  const temporaryDisabled = computed(() => balance.value.chainId == '1101')

  const priceDiffColor = computed(() => {
    if (!priceDiffInPercent.value)
      return 'rgb(148 163 184)'

    if (priceDiffInPercent.value < 0)
      return '#EB5757'

    return '#16A34A'
  })

  const priceDiffInPercent = computed(() => {
    if (!balance.value.sparklinePrice7d.length)
      return 0
    const a = balance.value.sparklinePrice7d.at(-24)!
    const b = balance.value.sparklinePrice7d.at(-1)!
    return (100 * (b - a)) / a
  })

  const priceDiffClass = computed(() => {
    if (!priceDiffInPercent.value)
      return 'text-slate-400'

    if (priceDiffInPercent.value < 0)
      return 'text-red-alert'

    return 'text-primary'
  })

  const chartData = computed(
    () =>
      ({
        labels: balance.value.sparklinePrice7d,
        datasets: [
          {
            data: balance.value.sparklinePrice7d,
            fill: false,
            pointRadius: 0,
            cubicInterpolationMode: 'monotone',
          },
        ],
      } as ChartData<'line'>),
  )

  return {
    interactable,
    priceDiffColor,
    priceDiffInPercent,
    priceDiffClass,
    chartData,
    temporaryDisabled,
  }
}
