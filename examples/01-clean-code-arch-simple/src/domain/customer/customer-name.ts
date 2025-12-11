import { InvalidCustomerNameError } from "./errors/invalid-customer-name-error.js";

export class CustomerName {
  private constructor(private readonly value: string) {}

  static create(value: string): CustomerName {
    if (!value || value.trim().length === 0) {
      throw new InvalidCustomerNameError("Customer name cannot be empty");
    }

    if (value.trim().length > 200) {
      throw new InvalidCustomerNameError("Customer name cannot exceed 200 characters");
    }

    return new CustomerName(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: CustomerName): boolean {
    return this.value === other.value;
  }
}
