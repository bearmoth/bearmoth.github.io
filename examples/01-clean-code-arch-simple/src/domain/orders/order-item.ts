import { InvalidOrderItemError } from "./errors";

/**
 * Represents an item in an order, including its product details, quantity, and price.
 *
 * This class is immutable and can only be instantiated through the static `create` method,
 * which ensures that all properties are validated before an instance is created.
 */
export class OrderItem {
  private constructor(
    public readonly productId: string,
    public readonly productName: string,
    public readonly quantity: number,
    public readonly pricePerUnit: number,
  ) {}

  /**
   * Creates a new instance of the `OrderItem` class.
   *
   * @param productId - The unique identifier of the product. Must be a non-empty string.
   * @param productName - The name of the product. Must be a non-empty string.
   * @param quantity - The quantity of the product. Must be greater than zero.
   * @param pricePerUnit - The price per unit of the product. Must be zero or greater.
   * @returns A new `OrderItem` instance.
   * @throws {InvalidOrderItemError} If the `productId` is empty.
   * @throws {InvalidOrderItemError} If the `productName` is empty.
   * @throws {InvalidOrderItemError} If the `quantity` is less than or equal to zero.
   * @throws {InvalidOrderItemError} If the `pricePerUnit` is negative.
   */
  static create(
    productId: string,
    productName: string,
    quantity: number,
    pricePerUnit: number,
  ): OrderItem {
    if (!productId || productId.trim().length === 0) {
      throw new InvalidOrderItemError("Product ID cannot be empty");
    }

    if (!productName || productName.trim().length === 0) {
      throw new InvalidOrderItemError("Product name cannot be empty");
    }

    if (quantity <= 0) {
      throw new InvalidOrderItemError("Quantity must be greater than zero");
    }

    if (pricePerUnit < 0) {
      throw new InvalidOrderItemError("Price per unit cannot be negative");
    }

    return new OrderItem(productId.trim(), productName.trim(), quantity, pricePerUnit);
  }

  /**
   * Calculates the total cost for the order item.
   * The total is determined by multiplying the quantity of items
   * by the price per unit.
   *
   * @returns The total cost as a number.
   */
  get total(): number {
    return this.quantity * this.pricePerUnit;
  }

  /**
   * Converts the order item instance to a JSON representation.
   *
   * @returns An object containing the product ID, product name, quantity,
   * and price per unit of the order item.
   */
  toJSON(): {
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
  } {
    return {
      productId: this.productId,
      productName: this.productName,
      quantity: this.quantity,
      pricePerUnit: this.pricePerUnit,
    };
  }
}
