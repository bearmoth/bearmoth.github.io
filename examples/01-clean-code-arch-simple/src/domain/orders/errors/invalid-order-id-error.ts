export class InvalidOrderIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOrderIdError";
  }
}
