/**
 * Platform fee configuration for Cadence marketplace.
 *
 * The platform charges a configurable percentage fee split 50/50
 * between buyer and seller.
 *
 * Example with 8% total fee on a $100 item:
 *   - Buyer pays:  $100 + $4 (4% buyer fee) = $104
 *   - Seller receives: $100 - $4 (4% seller fee) = $96
 */

/** Total platform fee as a decimal (0.08 = 8%) */
export const PLATFORM_FEE_RATE = 0.08;

/** Buyer's share of the platform fee (50%) */
export const BUYER_FEE_SHARE = 0.5;

/** Seller's share of the platform fee (50%) */
export const SELLER_FEE_SHARE = 0.5;

export interface FeeBreakdown {
  /** Total platform fee amount */
  platformFee: number;
  /** Amount charged to buyer */
  buyerFee: number;
  /** Amount deducted from seller */
  sellerFee: number;
  /** Amount seller receives after fee deduction (item price - seller fee) */
  sellerPayout: number;
}

/**
 * Calculate platform fees for a given item price.
 * Fees are rounded to 2 decimal places.
 */
export function calculateFees(itemPrice: number): FeeBreakdown {
  const platformFee = Math.round(itemPrice * PLATFORM_FEE_RATE * 100) / 100;
  const buyerFee = Math.round(platformFee * BUYER_FEE_SHARE * 100) / 100;
  const sellerFee = Math.round(platformFee * SELLER_FEE_SHARE * 100) / 100;
  const sellerPayout = Math.round((itemPrice - sellerFee) * 100) / 100;

  return { platformFee, buyerFee, sellerFee, sellerPayout };
}
