import { CannotCancelShippedOrderError } from "./errors/cannot-cancel-shipped-order-error.js";
import { InvalidOrderError } from "./errors/invalid-order-error.js";
import type { OrderId } from "./order-id.js";
import type { OrderItem } from "./order-item.js";
import { OrderStatus } from "./order-status.js";
import type { PricingStrategy } from "./pricing-strategy.js";

/**
 * Represents an Order in the domain.
 *
 * The `Order` class is an aggregate root that encapsulates the details of an order,
 * including its identifier, associated customer, items, status, and creation date.
 * It enforces business rules such as requiring at least one item in the order and
 * preventing cancellation of shipped orders.
 *
 * ## Responsibilities:
 * - Creation of new orders with validation.
 * - Reconstitution of existing orders from persistence.
 * - Business operations such as cancellation.
 * - Calculation of the total amount for the order.
 *
 * ## Design Notes:
 * - The `customerId` is represented as a string to maintain bounded context separation.
 * - The class is immutable; operations return new instances rather than modifying the existing one.
 *
 * @example
 * ```typescript
 * const order = Order.create(orderId, customerId, [orderItem]);
 * console.log(order.totalAmount);
 * ```
 */
export class Order {
  private constructor(
    public readonly id: OrderId,
    public readonly customerId: string,
    public readonly items: ReadonlyArray<OrderItem>,
    public readonly status: OrderStatus,
    public readonly createdAt: Date,
  ) {}

  /**
   * Creates a new Order instance.
   *
   * Using string for customerId rather than importing CustomerId from Customer context.
   * This maintains clear bounded context separation - Order context doesn't depend on
   * Customer domain types, only on the customer identifier as a primitive.
   *
   * @param id - The unique identifier for the order.
   * @param customerId - The unique identifier for the customer placing the order.
   * @param items - An array of items included in the order. Must contain at least one item.
   * @param createdAt - The timestamp when the order was created.
   * @returns A new instance of the `Order` class.
   * @throws {InvalidOrderError} If the `items` array is empty.
   */
  static create(id: OrderId, customerId: string, items: OrderItem[], createdAt: Date): Order {
    if (items.length === 0) {
      throw new InvalidOrderError("Order must have at least one item");
    }

    return new Order(id, customerId, items, OrderStatus.Pending, createdAt);
  }

  /**
   * Reconstitutes an Order object from its persisted state.
   * This method is typically used to recreate an Order instance
   * from stored data, such as when loading from a database.
   *
   * @param id - The unique identifier of the order.
   * @param customerId - The identifier of the customer associated with the order.
   * @param items - The list of items included in the order.
   * @param status - The current status of the order.
   * @param createdAt - The date and time when the order was created.
   * @returns A new instance of the Order class with the provided data.
   */
  static reconstitute(
    id: OrderId,
    customerId: string,
    items: OrderItem[],
    status: OrderStatus,
    createdAt: Date,
  ): Order {
    return new Order(id, customerId, items, status, createdAt);
  }

  /**
   * Cancels the current order if it is not already shipped or cancelled.
   *
   * @returns {Order} A new instance of the `Order` class with the status set to `Cancelled`.
   *
   * @throws {CannotCancelShippedOrderError} If the order has already been shipped.
   */
  cancel(): Order {
    if (this.status === OrderStatus.Shipped) {
      throw new CannotCancelShippedOrderError(this.id.toString());
    }

    if (this.status === OrderStatus.Cancelled) {
      return this;
    }

    return new Order(this.id, this.customerId, this.items, OrderStatus.Cancelled, this.createdAt);
  }

  /**
   * Calculates the subtotal for the order by summing up the total cost of all items.
   *
   * @returns The subtotal amount as a number.
   */
  get subtotal(): number {
    return this.items.reduce((sum, item) => sum + item.total, 0);
  }

  /**
   * Calculates the final total amount for the order by applying the pricing strategy to the subtotal.
   * Pricing strategy is passed as a parameter rather than stored, as it's a calculation concern
   * rather than part of the order's persisted state.
   *
   * @param pricingStrategy - The pricing strategy to apply.
   * @returns The final total amount as a number, after applying any pricing rules (discounts, promotions, etc.).
   */
  calculateTotal(pricingStrategy: PricingStrategy): number {
    return pricingStrategy.calculateFinalPrice(this.subtotal);
  }
}
