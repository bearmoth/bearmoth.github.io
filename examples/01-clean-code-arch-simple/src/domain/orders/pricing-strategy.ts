/**
 * Pricing strategy for calculating order totals.
 *
 * This interface represents a configurable business rule that can be injected
 * into domain objects. Different implementations can provide different pricing
 * behaviours (standard, bulk discount, promotional, etc.).
 */
export interface PricingStrategy {
  /**
   * Calculate the final price for a subtotal amount.
   *
   * @param subtotal - The base subtotal before any pricing rules are applied.
   * @returns The final price after applying the pricing strategy.
   */
  calculateFinalPrice(subtotal: number): number;
}

/**
 * Standard pricing strategy with no discounts.
 */
export class StandardPricing implements PricingStrategy {
  calculateFinalPrice(subtotal: number): number {
    return subtotal;
  }
}

/**
 * Bulk discount pricing strategy.
 * Applies a percentage discount when the order subtotal exceeds a threshold.
 */
export class BulkDiscountPricing implements PricingStrategy {
  constructor(
    private readonly thresholdAmount: number,
    private readonly discountPercentage: number,
  ) {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Discount percentage must be between 0 and 100");
    }
  }

  calculateFinalPrice(subtotal: number): number {
    if (subtotal >= this.thresholdAmount) {
      return subtotal * (1 - this.discountPercentage / 100);
    }
    return subtotal;
  }
}

/**
 * Seasonal promotional pricing strategy.
 * Applies a flat discount percentage to all orders.
 */
export class PromotionalPricing implements PricingStrategy {
  constructor(private readonly discountPercentage: number) {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Discount percentage must be between 0 and 100");
    }
  }

  calculateFinalPrice(subtotal: number): number {
    return subtotal * (1 - this.discountPercentage / 100);
  }
}
