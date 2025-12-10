export class InvalidOrderStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOrderStatusError";
  }
}
