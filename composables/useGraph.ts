import { IBalance } from "~~/stores/safe";

export const useGraph = (balance: IBalance) => {
  const interactable = computed(() =>
    toBN(balance.balance).decimalPlaces(5).gt(0)
  );

  const priceDiffColor = computed(() => {
    if (!priceDiffInPercent.value) return "rgb(148 163 184)";

    if (priceDiffInPercent.value < 0) {
      return "#EB5757";
    }

    return "#16A34A";
  });

  const priceDiffInPercent = computed(() => {
    if (!balance.sparklinePrice7d.length) return 0;
    let a = balance.sparklinePrice7d.at(-24)!;
    let b = balance.sparklinePrice7d.at(-1)!;
    return (100 * (b - a)) / a;
  });

  const priceDiffClass = computed(() => {
    if (!priceDiffInPercent.value) return "text-slate-400";

    if (priceDiffInPercent.value < 0) {
      return "text-red-alert";
    }

    return "text-primary";
  });

  const chartData = computed(() => ({
    labels: balance.sparklinePrice7d,
    datasets: [
      {
        data: balance.sparklinePrice7d,
        fill: false,
        pointRadius: 0,
        cubicInterpolationMode: "monotone",
      },
    ],
  }));

  return {
    interactable,
    priceDiffColor,
    priceDiffInPercent,
    priceDiffClass,
    chartData
  };
};