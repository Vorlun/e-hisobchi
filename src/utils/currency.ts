const DEFAULT_CURRENCY = 'UZS';

/** Format number with space as thousands separator: 12 500 000 */
function formatWithSpaces(num: number): string {
  const s = Math.round(Math.abs(num)).toString();
  const len = s.length;
  if (len <= 3) return s;
  const parts: string[] = [];
  for (let i = len; i > 0; i -= 3) {
    parts.unshift(s.slice(Math.max(0, i - 3), i));
  }
  return parts.join(' ');
}

/**
 * Format amount as Uzbek so'm (UZS).
 * Example: 12500000 → "12 500 000 so'm" or "12 500 000 UZS"
 */
export function formatUzs(
  amount: number,
  options: { compact?: boolean; suffix?: 'so\'m' | 'UZS' } = {}
): string {
  const { compact = false, suffix = 'so\'m' } = options;
  const abs = Math.abs(amount);
  const formatted = compact && abs >= 1e6
    ? (abs / 1e6).toFixed(1).replace('.', ',') + ' mln'
    : formatWithSpaces(abs);
  return suffix === 'UZS' ? `${formatted} UZS` : `${formatted} so'm`;
}

/**
 * Format with sign for transactions: +1 500 000 so'm or -500 000 so'm
 */
export function formatUzsSigned(
  amount: number,
  options: { suffix?: 'so\'m' | 'UZS' } = {}
): string {
  const formatted = formatUzs(Math.abs(amount), options);
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

export function getDefaultCurrency(): string {
  return DEFAULT_CURRENCY;
}
