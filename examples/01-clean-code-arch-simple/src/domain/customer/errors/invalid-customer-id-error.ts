export class InvalidCustomerIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCustomerIdError";
  }
}
