import { InvalidCustomerIdError } from "./errors/invalid-customer-id-error.js";

export class CustomerId {
  private constructor(private readonly value: string) {}

  static create(value: string): CustomerId {
    if (!value || value.trim().length === 0) {
      throw new InvalidCustomerIdError("CustomerId cannot be empty");
    }

    return new CustomerId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CustomerId): boolean {
    return this.value === other.value;
  }
}
