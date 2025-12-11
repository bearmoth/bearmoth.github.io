// Port for customer validation in Order context.
// Named CustomerValidator to clearly express its purpose - validating customer existence.
// This interface represents only what the Order context needs from the Customer context,
// following Interface Segregation Principle to prevent coupling.
export interface CustomerValidator {
  customerExists(customerId: string): Promise<boolean>;
}
