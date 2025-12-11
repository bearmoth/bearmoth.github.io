// Adapter that implements Order context's CustomerValidator using Customer context's CustomerService
import type { CustomerService } from "../../application/customer";
import type { CustomerValidator } from "../../application/orders/ports";

// This adapter lives in the Order bounded context because:
// 1. It implements a port defined by the Order context (CustomerValidator)
// 2. It adapts the Customer context's service to meet the Order context's needs
// 3. The Order context owns the requirement for customer validation during order placement
// 4. Following the dependency rule: the adapter depends on both contexts but belongs to the one defining the port
// This is an example of a cross-context adapter that prevents direct coupling between bounded contexts.
export class CustomerServiceAdapter implements CustomerValidator {
  constructor(private readonly customerService: CustomerService) {}

  async customerExists(customerId: string): Promise<boolean> {
    const customer = await this.customerService.getCustomer({ id: customerId });
    return customer !== null;
  }
}
