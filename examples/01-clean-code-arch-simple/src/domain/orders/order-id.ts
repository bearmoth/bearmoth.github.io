import { InvalidOrderIdError } from "./errors/invalid-order-id-error";

export class OrderId {
  private constructor(private readonly value: string) {}

  static create(value: string): OrderId {
    if (!value || value.trim().length === 0) {
      throw new InvalidOrderIdError("OrderId cannot be empty");
    }

    return new OrderId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }
}
