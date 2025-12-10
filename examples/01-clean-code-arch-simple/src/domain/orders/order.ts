import { CannotCancelShippedOrderError } from "./errors/cannot-cancel-shipped-order-error.js";
import { InvalidOrderError } from "./errors/invalid-order-error.js";
import type { OrderId } from "./order-id.js";
import type { OrderItem } from "./order-item.js";
import { OrderStatus } from "./order-status.js";

export class Order {
  private constructor(
    public readonly id: OrderId,
    public readonly items: ReadonlyArray<OrderItem>,
    public readonly status: OrderStatus,
    public readonly createdAt: Date,
  ) {}

  static create(id: OrderId, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new InvalidOrderError("Order must have at least one item");
    }

    return new Order(id, items, OrderStatus.Pending, new Date());
  }

  static reconstitute(
    id: OrderId,
    items: OrderItem[],
    status: OrderStatus,
    createdAt: Date,
  ): Order {
    return new Order(id, items, status, createdAt);
  }

  cancel(): Order {
    if (this.status === OrderStatus.Shipped) {
      throw new CannotCancelShippedOrderError(this.id.toString());
    }

    if (this.status === OrderStatus.Cancelled) {
      return this;
    }

    return new Order(this.id, this.items, OrderStatus.Cancelled, this.createdAt);
  }

  get totalAmount(): number {
    return this.items.reduce((sum, item) => sum + item.total, 0);
  }
}
