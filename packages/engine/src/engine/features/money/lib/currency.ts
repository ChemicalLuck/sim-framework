export interface CurrencyConfig {
  locale?: string;
  code?: string;
  /** Lowest balance a purchase may leave (e.g. -1000 for an overdraft). */
  creditFloor?: number;
}

let formatter = buildFormatter('en-GB', 'GBP');
let creditFloor = 0;

function buildFormatter(locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency });
}

export function configureCurrency({
  locale = 'en-GB',
  code = 'GBP',
  creditFloor: floor = 0,
}: CurrencyConfig) {
  formatter = buildFormatter(locale, code);
  creditFloor = floor;
}

export const getCreditFloor = (): number => creditFloor;

/** Whether spending `price` keeps `balance` at or above the credit floor. */
export const canAfford = (balance: number, price: number): boolean =>
  balance - price >= creditFloor;

export function getCurrencySymbol(): string {
  return (
    formatter.formatToParts(0).find((p) => p.type === 'currency')?.value ?? ''
  );
}

export const formatMoney = (num?: number): string =>
  num !== undefined ? formatter.format(num) : '';
