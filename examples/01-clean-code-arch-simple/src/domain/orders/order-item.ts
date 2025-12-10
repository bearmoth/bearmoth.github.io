import { InvalidOrderItemError } from "./errors";

export class OrderItem {
  private constructor(
    public readonly productId: string,
    public readonly productName: string,
    public readonly quantity: number,
    public readonly pricePerUnit: number,
  ) {}

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

    return new OrderItem(productId, productName, quantity, pricePerUnit);
  }

  get total(): number {
    return this.quantity * this.pricePerUnit;
  }

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
