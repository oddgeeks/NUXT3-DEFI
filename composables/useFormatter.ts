export function useFormatter() {
  const { abs } = useBignumber();

  function getFractionDigits(value: string | number) {
    const absoluteValue = abs(value);

    if (isZero(absoluteValue)) {
      return 2;
    } else if (lt(absoluteValue, 0.01)) {
      return 6;
    } else if (lt(absoluteValue, 1)) {
      return 4;
    } else if (lt(absoluteValue, 10000)) {
      return 2;
    } else {
      return 0;
    }
  }

  function formatDecimal(
    value: any,
    fractionDigits = getFractionDigits(value)
  ) {
    if (!value) {
      value = "0";
    }

    const formatter = new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
    });
    return formatter.format(value);
  }

  function formatPercent(value, fractionDigits = 2, maxValue = null) {
    if (isZero(value)) return "0.00%";

    if (maxValue && gt(times(value, "100"), maxValue)) return `>${maxValue}%`;

    const formatter = new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });

    return formatter.format(value);
  }

  return {
    formatDecimal,
    formatPercent,
  };
}
