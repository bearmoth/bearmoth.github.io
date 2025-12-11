import type { CustomerRepository } from "../../../application/customer/ports/customer-repository";
// Simple in-memory adapter for CustomerRepository
import type { Customer } from "../../../domain/customer";

export class InMemoryCustomerRepository implements CustomerRepository {
  private customers = new Map<string, Customer>();

  async save(customer: Customer): Promise<void> {
    this.customers.set(customer.id.toString(), customer);
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customers.get(id) || null;
  }
}
