// Capacities scale amounts and scores into decimals, which are shown rounded to two decimal
// places, without trailing zeros so that whole amounts stay as short as they were.
export function formatNumber(value: number): string {
  return `${Math.round(value * 100) / 100}`;
}
