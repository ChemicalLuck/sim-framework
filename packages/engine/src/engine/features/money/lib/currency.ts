export interface CurrencyConfig {
  locale?: string;
  code?: string;
}

let formatter = buildFormatter('en-GB', 'GBP');

function buildFormatter(locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency });
}

export function configureCurrency({
  locale = 'en-GB',
  code = 'GBP',
}: CurrencyConfig) {
  formatter = buildFormatter(locale, code);
}

export function getCurrencySymbol(): string {
  return (
    formatter.formatToParts(0).find((p) => p.type === 'currency')?.value ?? ''
  );
}

export const formatMoney = (num?: number): string =>
  num !== undefined ? formatter.format(num) : '';
