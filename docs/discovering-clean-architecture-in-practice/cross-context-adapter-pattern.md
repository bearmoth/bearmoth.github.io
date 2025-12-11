# Architectural Decision: Cross-Context Collaboration - Adapter vs Direct Injection

Last updated 2025-12-11

**Status:** Decided  
**Context:** Clean Architecture example project - Cross-context collaboration between Order and Customer contexts

---

## Problem Statement

When one bounded context needs to interact with another bounded context within the same monorepo/application, should it use an adapter that translates between contexts, or should it inject the other context's application service directly?

Specifically: Should `OrderService` depend on `CustomerValidator` (a port implemented by `CustomerServiceAdapter`), or should it depend directly on `CustomerService`?

---

## Context

In our clean architecture example, the Order context needs to validate that customers exist before placing orders. The Customer context provides a `CustomerService` with various methods including `getCustomer()`. 

**Current implementation (with adapter):**

```typescript
// Port defined by Order context
export interface CustomerValidator {
  customerExists(customerId: string): Promise<boolean>;
}

// Adapter translates Customer context to Order context's needs
export class CustomerServiceAdapter implements CustomerValidator {
  constructor(private readonly customerService: CustomerService) {}

  async customerExists(customerId: string): Promise<boolean> {
    const customer = await this.customerService.getCustomer(customerId);
    return customer !== null;
  }
}

// Order service depends on the port
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerValidator: CustomerValidator,
  ) {}
}
```

**Alternative approach (direct injection):**

```typescript
// Order service depends directly on Customer context's service
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerService: CustomerService,
  ) {}

  async placeOrder(dto: PlaceOrderDTO): Promise<Order> {
    // Call Customer service directly
    const customer = await this.customerService.getCustomer(dto.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(dto.customerId);
    }
    // ...
  }
}
```

---

## Options Considered

### Option 1: Direct Injection of CustomerService

Inject `CustomerService` directly into `OrderService`.

**Pros:**
- **Simpler** - fewer files, less indirection
- **Less boilerplate** - no need to create adapter classes
- **Faster to implement** - direct dependency, no translation layer
- **Clearer for small codebases** - easy to see what Order depends on

**Cons:**
- **Violates bounded context independence** - Order context depends on Customer context's application layer
- **Interface bloat** - Order gets access to Customer's entire service interface (`registerCustomer()`, `getCustomer()`, `updateCustomer()`, etc.) even though it only needs existence validation
- **Tight coupling** - changes to `CustomerService` interface ripple to Order context
- **Harder to test** - testing `OrderService` requires mocking the full `CustomerService` with all its methods
- **Context contagion** - Order context inherits Customer's dependencies transitively
- **Limits evolution** - if Customer becomes a microservice, Order context needs significant refactoring

### Option 2: Adapter with Focused Port ✅

Define a focused port (`CustomerValidator`) in Order context, implement it with an adapter that delegates to `CustomerService`.

**Pros:**
- **Maintains bounded context independence** - Order context doesn't depend on Customer context's internals
- **Interface Segregation Principle** - Order depends only on what it needs (`customerExists()`), not Customer's full interface
- **Anti-Corruption Layer** - adapter translates between contexts, preventing coupling
- **Better testability** - testing `OrderService` only requires mocking a single-method interface
- **Supports evolution** - if Customer becomes a microservice, only the adapter changes; `OrderService` remains unchanged
- **Clear context boundaries** - explicit translation at context edges
- **Prevents dependency cascade** - Order doesn't inherit Customer's dependencies

**Cons:**
- **More files/indirection** - requires port interface + adapter implementation
- **Perceived overhead** - can feel heavy for simple cases
- **Learning curve** - developers need to understand the pattern

---

## Deciding Factors

1. **Bounded Context Independence**: DDD emphasizes that bounded contexts should be independently deployable and evolvable. Direct injection creates a compile-time dependency between Order and Customer application layers.

2. **Interface Segregation Principle**: `CustomerService` has many methods. Order context only needs `customerExists()`. Depending on the full service violates ISP and creates unnecessary coupling.

3. **Anti-Corruption Layer**: The adapter acts as a translation layer between contexts. It translates "get customer" (Customer's operation) into "customer exists" (Order's concern). This is the Anti-Corruption Layer pattern from DDD.

4. **Testability**: Testing `OrderService` with a focused `CustomerValidator` mock is simpler than mocking `CustomerService` with all its methods.

5. **Architectural Evolution**: When Customer context is extracted to a separate microservice:
   - With adapter: Only `CustomerServiceAdapter` changes (calls HTTP/gRPC instead of `CustomerService`)
   - With direct injection: `OrderService` itself must change to handle HTTP calls, network errors, etc.

6. **Consistency with Architecture**: Our architecture uses ports and adapters throughout (repository ports, HTTP adapters). Cross-context collaboration should follow the same pattern.

---

## Decision

**Use an adapter with a focused port for cross-context collaboration.**

Even though it adds a layer of indirection, the adapter pattern maintains bounded context independence, follows Interface Segregation Principle, and supports architectural evolution.

---

## Implementation Notes

**Port definition (in Order context):**
```typescript
// src/application/orders/ports/customer-validator.ts

// Port for customer validation in Order context.
// Named CustomerValidator to clearly express its purpose - validating customer existence.
// This interface represents only what the Order context needs from the Customer context,
// following Interface Segregation Principle to prevent coupling.
export interface CustomerValidator {
  customerExists(customerId: string): Promise<boolean>;
}
```

**Adapter implementation:**
```typescript
// src/adapters/orders/customer-service-adapter.ts

// Adapter that implements Order context's CustomerValidator using Customer context's CustomerService
import type { CustomerService } from "../../../application/customer";
import type { CustomerValidator } from "../../../application/orders/ports";

export class CustomerServiceAdapter implements CustomerValidator {
  constructor(private readonly customerService: CustomerService) {}

  async customerExists(customerId: string): Promise<boolean> {
    const customer = await this.customerService.getCustomer(customerId);
    return customer !== null;
  }
}
```

**Usage in OrderService:**
```typescript
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerValidator: CustomerValidator,
  ) {}

  async placeOrder(dto: PlaceOrderDTO): Promise<Order> {
    // Validate customer exists (cross-context interaction through port)
    const customerExists = await this.customerValidator.customerExists(dto.customerId);
    if (!customerExists) {
      throw new CustomerNotFoundError(dto.customerId);
    }
    // ...
  }
}
```

**Wiring in composition root:**
```typescript
// Infrastructure → Adapters (Customer context)
const customerRepository = new PostgresCustomerRepository(databasePool);
const customerService = new CustomerService(customerRepository);

// Infrastructure → Adapters (Order context)
const orderRepository = new PostgresOrderRepository(databasePool);
const customerServiceAdapter = new CustomerServiceAdapter(customerService);

// Adapters → Application (Order context)
const orderService = new OrderService(orderRepository, customerServiceAdapter);
```

---

## Related Concepts

- [Bounded contexts](../glossary.md#bounded-contexts)
- [Anti-corruption layer](../glossary.md#anti-corruption-layer)
- [Interface Segregation Principle](../glossary.md#interface-segregation-principle)
- [Ports and adapters](../glossary.md#ports-and-adapters)

## Related Posts

- [Bounded Contexts and Cross-Context Collaboration](../bounded-contexts-collaboration.md)
- [Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)
- [The Application Layer](./04-application-layer.md)

---

## Further Considerations

### The Pragmatic View: When Is Direct Injection Acceptable?

While we use the adapter pattern in this example, **there are pragmatic scenarios where direct injection might be acceptable:**

1. **Single bounded context**: If Customer and Order are actually parts of the same bounded context (not separate contexts), then direct injection is fine. The adapter indirection is specifically for **cross-context** collaboration.

2. **Small, stable monoliths**: In a small application with no plans for service extraction, and where Customer's interface is stable, the adapter overhead might not be worth it.

3. **Shared Kernel pattern**: If Customer and Order explicitly share a kernel of common concepts (a DDD pattern), direct dependencies within that kernel are acceptable.

4. **Rapid prototyping**: When exploring domain boundaries or building a proof-of-concept, direct injection is faster. You can refactor to adapters once boundaries stabilize.

**However, be cautious:** What starts as "just a small monolith" often grows. Direct dependencies are easy to add but hard to remove later. The adapter pattern is **easier to introduce from the start** than to retrofit later.

### Adapter Overhead: Is It Really That Heavy?

The perceived "overhead" of the adapter pattern is:
- One interface file (`customer-validator.ts`) - ~6 lines
- One adapter implementation (`customer-service-adapter.ts`) - ~12 lines
- Total: ~18 lines of code

**In return, you get:**
- Clear context boundaries
- Testable, focused interfaces
- Flexibility to evolve architectures
- Protection from interface changes in Customer context

For most applications, this is a worthwhile trade-off.

### Alternative: Facade Pattern

If creating one adapter per port feels tedious, you could use a **Facade** approach:

```typescript
// Single adapter that implements multiple Order context ports
export class CustomerContextFacade implements CustomerValidator, CustomerDetailProvider {
  constructor(private readonly customerService: CustomerService) {}

  async customerExists(customerId: string): Promise<boolean> {
    const customer = await this.customerService.getCustomer(customerId);
    return customer !== null;
  }

  async getCustomerDetails(customerId: string): Promise<CustomerDetails> {
    // Another translation method
  }
}
```

However, this couples multiple ports to a single adapter, which can become unwieldy. Prefer separate adapters unless the ports are closely related.

### Testing Benefits in Practice

With adapter approach:
```typescript
// Test OrderService with simple mock
const mockValidator: CustomerValidator = {
  customerExists: jest.fn().mockResolvedValue(true),
};

const orderService = new OrderService(mockRepository, mockValidator);
```

With direct injection:
```typescript
// Test OrderService with complex mock
const mockCustomerService = {
  registerCustomer: jest.fn(),
  getCustomer: jest.fn().mockResolvedValue(mockCustomer),
  updateCustomer: jest.fn(),
  // ... many more methods that aren't relevant to Order context
};

const orderService = new OrderService(mockRepository, mockCustomerService);
```

The adapter approach keeps tests focused on what Order context actually needs.

### Evolution Example: Customer Becomes a Microservice

**With adapter (minimal changes):**
```typescript
// Only the adapter changes
export class CustomerServiceAdapter implements CustomerValidator {
  constructor(private readonly httpClient: HttpClient) {}

  async customerExists(customerId: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get(`/customers/${customerId}`);
      return response.status === 200;
    } catch (error) {
      if (error.status === 404) return false;
      throw error;
    }
  }
}

// OrderService unchanged!
```

**With direct injection (significant refactoring):**
```typescript
// OrderService must change
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly httpClient: HttpClient, // Changed dependency
  ) {}

  async placeOrder(dto: PlaceOrderDTO): Promise<Order> {
    // OrderService now handles HTTP, errors, etc.
    try {
      const response = await this.httpClient.get(`/customers/${dto.customerId}`);
      if (response.status === 404) {
        throw new CustomerNotFoundError(dto.customerId);
      }
    } catch (error) {
      // Handle network errors, timeouts, etc.
    }
    // ...
  }
}
```

The adapter pattern isolates the impact of architectural changes.

---

## Conclusion

For cross-context collaboration in a bounded context architecture, **use adapters with focused ports** even though it adds indirection. The architectural benefits (independence, testability, evolvability) outweigh the perceived overhead.

However, acknowledge the **pragmatic trade-offs**: in small, stable monoliths with no extraction plans, direct injection might be acceptable. The key is making this choice consciously, understanding what you're trading off.

For teaching clean architecture and demonstrating best practices, the adapter pattern is the clearer approach.
