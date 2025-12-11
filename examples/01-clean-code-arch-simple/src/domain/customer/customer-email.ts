import { InvalidCustomerEmailError } from "./errors/invalid-customer-email-error.js";

export class CustomerEmail {
  private constructor(private readonly value: string) {}

  static create(value: string): CustomerEmail {
    if (!value || value.trim().length === 0) {
      throw new InvalidCustomerEmailError("Customer email cannot be empty");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new InvalidCustomerEmailError("Customer email must be a valid email address");
    }

    if (value.length > 320) {
      throw new InvalidCustomerEmailError("Customer email cannot exceed 320 characters");
    }

    return new CustomerEmail(value.toLowerCase().trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: CustomerEmail): boolean {
    return this.value === other.value;
  }
}
