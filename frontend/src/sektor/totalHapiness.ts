// Sektors make between them all of their Hapiness added up. Hapiness is given with a single decimal
// place, so rounding to it keeps the floating point noise out of the Hapiness added up from it.
export function totalHapiness(sektorHapinesses: number[]): number {
  return Math.round(sektorHapinesses.reduce((total, sektorHapiness) => total + sektorHapiness, 0) * 10) / 10;
}
