import type { CustomerEmail } from "./customer-email.js";
import type { CustomerId } from "./customer-id.js";
import type { CustomerName } from "./customer-name.js";

/**
 * Represents a Customer entity in the domain.
 * 
 * This class is designed to encapsulate the properties and behaviors of a customer.
 * It follows the principles of immutability, ensuring that any updates to the customer's
 * properties result in the creation of a new instance.
 */
export class Customer {
  private constructor(
    public readonly id: CustomerId,
    public readonly name: CustomerName,
    public readonly email: CustomerEmail,
  ) {}

  /**
   * Creates a new instance of the Customer domain entity.
   *
   * @param id - The unique identifier for the customer.
   * @param name - The name of the customer.
   * @param email - The email address of the customer.
   * @returns A new `Customer` instance.
   */
  static create(id: CustomerId, name: CustomerName, email: CustomerEmail): Customer {
    return new Customer(id, name, email);
  }

  /**
   * Reconstitutes a Customer object from its constituent parts.
   * This method is typically used to recreate a Customer instance
   * from persisted data or other sources where the object needs
   * to be reconstructed.
   *
   * @param id - The unique identifier of the customer.
   * @param name - The name of the customer.
   * @param email - The email address of the customer.
   * @returns A new instance of the Customer class.
   */
  static reconstitute(id: CustomerId, name: CustomerName, email: CustomerEmail): Customer {
    return new Customer(id, name, email);
  }

  /**
   * Creates a new Customer instance with an updated name.
   *
   * @param newName - The new name to assign to the customer.
   * @returns A new Customer instance with the updated name.
   */
  updateName(newName: CustomerName): Customer {
    return new Customer(this.id, newName, this.email);
  }

  /**
   * Updates the email address of the customer and returns a new Customer instance
   * with the updated email.
   *
   * @param newEmail - The new email address to be assigned to the customer.
   * @returns A new Customer instance with the updated email address.
   */
  updateEmail(newEmail: CustomerEmail): Customer {
    return new Customer(this.id, this.name, newEmail);
  }
}
