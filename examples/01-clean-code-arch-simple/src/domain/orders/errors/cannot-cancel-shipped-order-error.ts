export class CannotCancelShippedOrderError extends Error {
  constructor(orderId: string) {
    super(`Cannot cancel order ${orderId}: order has already been shipped`);
    this.name = "CannotCancelShippedOrderError";
  }
}
