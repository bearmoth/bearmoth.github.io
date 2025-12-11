import type { Pool } from "pg";
import type { CustomerRepository } from "../../../application/customer/ports";
import { Customer, CustomerEmail, CustomerId, CustomerName } from "../../../domain/customer";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
}

export class PostgresCustomerRepository implements CustomerRepository {
  constructor(private readonly pool: Pool) {}

  async save(customer: Customer): Promise<void> {
    await this.pool.query(
      `INSERT INTO customers (id, name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email`,
      [customer.id.toString(), customer.name.toString(), customer.email.toString()],
    );
  }

  async findById(id: string): Promise<Customer | null> {
    const result = await this.pool.query<CustomerRow>(
      "SELECT id, name, email FROM customers WHERE id = $1",
      [id],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return Customer.reconstitute(
      CustomerId.create(row.id),
      CustomerName.create(row.name),
      CustomerEmail.create(row.email),
    );
  }
}
