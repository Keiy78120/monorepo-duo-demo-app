/**
 * Pricing utilities for Demo App cannabis dispensary
 * All prices are in centimes (1€ = 100 centimes)
 */

import type { PricingTier } from "@/lib/db/types";

/**
 * Calculate selling price per gram based on cost and margin
 * @param costPerGram - Cost price per gram in centimes
 * @param marginPercent - Margin percentage (e.g., 50 for 50%)
 * @returns Selling price per gram in centimes
 */
export function calculateSellingPrice(
  costPerGram: number,
  marginPercent: number
): number {
  return Math.round(costPerGram * (1 + marginPercent / 100));
}

/**
 * Calculate tier price based on selling price and quantity
 * @param sellingPricePerGram - Selling price per gram in centimes
 * @param quantity - Quantity in grams
 * @returns Total price for the tier in centimes
 */
export function calculateTierPrice(
  sellingPricePerGram: number,
  quantity: number
): number {
  return Math.round(sellingPricePerGram * quantity);
}

/**
 * Calculate tier price from cost price, margin, and quantity
 * @param costPerGram - Cost price per gram in centimes
 * @param marginPercent - Margin percentage
 * @param quantity - Quantity in grams
 * @returns Total price for the tier in centimes
 */
export function calculateTierPriceFromCost(
  costPerGram: number,
  marginPercent: number,
  quantity: number
): number {
  const sellingPrice = calculateSellingPrice(costPerGram, marginPercent);
  return calculateTierPrice(sellingPrice, quantity);
}

/**
 * Default quantity tiers in grams
 */
export const DEFAULT_QUANTITY_TIERS = [10, 25, 50, 100] as const;

/**
 * Generate default pricing tiers for a product
 * @param productId - Product ID
 * @param costPerGram - Cost price per gram in centimes
 * @param marginPercent - Margin percentage
 * @param quantities - Array of quantities to generate tiers for
 * @returns Array of pricing tier objects
 */
export function generateDefaultTiers(
  productId: string,
  costPerGram: number,
  marginPercent: number,
  quantities: readonly number[] = DEFAULT_QUANTITY_TIERS
): Omit<PricingTier, "id" | "created_at">[] {
  return quantities.map((quantity, index) => ({
    product_id: productId,
    quantity_grams: quantity,
    price: calculateTierPriceFromCost(costPerGram, marginPercent, quantity),
    is_custom_price: false,
    sort_order: index,
  }));
}

/**
 * Format price for display
 * @param priceInCents - Price in centimes
 * @param currency - Currency code (default: EUR)
 * @returns Formatted price string
 */
export function formatPrice(priceInCents: number, currency = "EUR"): string {
  const amount = priceInCents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format price per gram for display
 * @param priceInCents - Price per gram in centimes
 * @param currency - Currency code (default: EUR)
 * @returns Formatted price string with /g suffix
 */
export function formatPricePerGram(
  priceInCents: number,
  currency = "EUR"
): string {
  return `${formatPrice(priceInCents, currency)}/g`;
}

/**
 * Get the minimum tier info (lowest price tier)
 * @param tiers - Array of pricing tiers
 * @returns Object with minimum price and quantity, or null if no tiers
 */
export function getMinTierInfo(
  tiers: PricingTier[]
): { price: number; quantity: number } | null {
  if (!tiers || tiers.length === 0) return null;

  const sortedTiers = [...tiers].sort((a, b) => a.price - b.price);
  const minTier = sortedTiers[0];

  return {
    price: minTier.price,
    quantity: minTier.quantity_grams,
  };
}

/**
 * Get tiers sorted by quantity
 * @param tiers - Array of pricing tiers
 * @returns Sorted array of pricing tiers
 */
export function sortTiersByQuantity(tiers: PricingTier[]): PricingTier[] {
  return [...tiers].sort((a, b) => a.quantity_grams - b.quantity_grams);
}

/**
 * Calculate discount percentage compared to calculated price
 * @param actualPrice - Actual (custom) price in centimes
 * @param calculatedPrice - Auto-calculated price in centimes
 * @returns Discount percentage (positive means cheaper, negative means more expensive)
 */
export function calculateDiscountPercentage(
  actualPrice: number,
  calculatedPrice: number
): number {
  if (calculatedPrice === 0) return 0;
  return Math.round(((calculatedPrice - actualPrice) / calculatedPrice) * 100);
}

/**
 * Check if a tier has a volume discount
 * @param tier - Pricing tier
 * @param costPerGram - Cost price per gram
 * @param marginPercent - Margin percentage
 * @returns true if the tier price is lower than calculated price
 */
export function hasVolumeDiscount(
  tier: PricingTier,
  costPerGram: number,
  marginPercent: number
): boolean {
  const calculatedPrice = calculateTierPriceFromCost(
    costPerGram,
    marginPercent,
    tier.quantity_grams
  );
  return tier.price < calculatedPrice;
}

/**
 * Validate pricing tier data
 * @param tier - Partial pricing tier data
 * @returns Object with isValid boolean and errors array
 */
export function validatePricingTier(tier: {
  quantity_grams?: number;
  price?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (tier.quantity_grams === undefined || tier.quantity_grams <= 0) {
    errors.push("Quantity must be greater than 0");
  }

  if (tier.price === undefined || tier.price < 0) {
    errors.push("Price must be 0 or greater");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
