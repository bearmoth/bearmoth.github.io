import { InvalidOrderStatusError } from "./errors";

export enum OrderStatus {
  Pending = "pending",
  Shipped = "shipped",
  Cancelled = "cancelled",
}

export function isValidOrderStatus(status: string): status is OrderStatus {
  return Object.values(OrderStatus).includes(status as OrderStatus);
}

export function parseOrderStatus(status: string): OrderStatus {
  if (!isValidOrderStatus(status)) {
    throw new InvalidOrderStatusError(`Invalid order status: ${status}`);
  }

  return status;
}
