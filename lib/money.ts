/** Format an integer minor-unit amount (paise/cents) as a currency string. */
export function formatMoney(cents: number, currency = "INR"): string {
  const major = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(major);
  } catch {
    return `${currency} ${major.toFixed(2)}`;
  }
}
