export class InvalidCustomerEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCustomerEmailError";
  }
}
