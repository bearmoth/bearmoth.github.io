// This error belongs in the Order context because it represents a validation failure
// within the Order application layer, not a domain concern of the Customer context.
// The Order context defines what it means for customer validation to fail.
export class CustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer ${customerId} not found`);
    this.name = "CustomerNotFoundError";
  }
}
