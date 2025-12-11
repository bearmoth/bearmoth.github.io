// Port for Customer repository
import type { Customer } from "../../../domain/customer";

export interface CustomerRepository {
  save(customer: Customer): Promise<void>;
  findById(id: string): Promise<Customer | null>;
}
