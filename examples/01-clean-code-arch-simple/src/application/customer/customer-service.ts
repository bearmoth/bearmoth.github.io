// Application service for Customer use-cases
import { Customer, CustomerEmail, CustomerId, CustomerName } from "../../domain/customer";
import type { GetCustomerDTO, RegisterCustomerDTO } from "./dtos";
import type { CustomerRepository } from "./ports/customer-repository";

/**
 * Application service responsible for managing customer-related operations.
 *
 * This service coordinates customer registration and retrieval use cases,
 * delegating persistence to the injected {@link CustomerRepository}.
 *
 * @remarks
 * - Generates a new {@link CustomerId} when registering a customer.
 * - Validates and wraps primitive values into domain value objects
 *   such as {@link CustomerName} and {@link CustomerEmail}.
 * - Persists new customers via the underlying repository.
 * - Provides lookup functionality by customer identifier.
 *
 * @public
 */
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  /**
   * Registers a new customer using the provided registration data.
   *
   * This method:
   * - Creates a unique {@link CustomerId} based on the current timestamp.
   * - Validates and constructs domain value objects for {@link CustomerName} and {@link CustomerEmail}.
   * - Instantiates a new {@link Customer} aggregate.
   * - Persists the customer using the injected {@link CustomerRepository}.
   *
   * @param dto - Data transfer object containing the customer's registration information.
   * @returns A promise that resolves to the newly created {@link Customer}.
   *
   * @throws {Error} If the provided name or email is invalid according to the domain rules.
   */
  async registerCustomer(dto: RegisterCustomerDTO): Promise<Customer> {
    const customerId = CustomerId.create(Date.now().toString()); // bad design for a real app, but fine for this simple example
    const customerName = CustomerName.create(dto.name);
    const customerEmail = CustomerEmail.create(dto.email);

    const customer = Customer.create(customerId, customerName, customerEmail);
    await this.customerRepository.save(customer);
    return customer;
  }

  /**
   * Retrieves a customer by its unique identifier.
   *
   * @param dto - Data transfer object containing the customer ID to look up.
   * @returns A promise that resolves to the matching {@link Customer} if found,
   * or `null` if no customer exists with the specified ID.
   */
  async getCustomer(dto: GetCustomerDTO): Promise<Customer | null> {
    return this.customerRepository.findById(dto.id);
  }
}
