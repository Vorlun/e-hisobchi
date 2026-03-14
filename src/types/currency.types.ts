/**
 * Currency rates for conversion and analytics.
 */

export interface CurrencyRate {
  id: number;
  currency: string;
  rate: number;
  rateDate: string;
  updatedAt: string;
}
