export class InvalidOrderItemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOrderItemError";
  }
}
