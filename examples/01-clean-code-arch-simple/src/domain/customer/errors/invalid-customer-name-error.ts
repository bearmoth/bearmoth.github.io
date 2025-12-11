export class InvalidCustomerNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCustomerNameError";
  }
}
