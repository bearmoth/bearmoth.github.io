# Application Layer Composition Patterns

Last updated 2025-12-11

**Themes:** application layer, service composition, dependency injection, bounded contexts, orchestration, multi-context operations

The application layer orchestrates domain logic to fulfil use-cases. But what happens when a use-case spans multiple bounded contexts? Should an application service import domain logic from multiple contexts directly, or should it inject other application services to coordinate cross-context operations?

In this post, I'll explore two composition patterns, examine the trade-offs of each, and provide a practical framework for deciding which pattern to use in different situations.

---

## The Challenge: Multi-Context Use-Cases

In [Bounded Contexts in Practice](./bounded-contexts-discovery-and-definition.md), we established that bounded contexts provide vertical boundaries within Clean Architecture's horizontal layers. Each context has its own domain models, application services, and adapters.

But real-world use-cases often need to coordinate across contexts. For example:
- **Placing an order** might require validating that a customer exists (Customer context) and creating an order (Order context).
- **Generating an invoice** might require order data (Order context), customer billing information (Customer context), and tax calculation rules (Billing context).
- **Processing a refund** might require order history (Order context), payment provider integration (Payment context), and inventory updates (Inventory context).

The question is: **how should the application layer compose these cross-context operations?**

---

## Two Composition Patterns

There are two main patterns for composing cross-context operations in the application layer:

### Pattern 1: Direct Domain Import

The application service imports domain models and logic from multiple bounded contexts directly, coordinating them to fulfill the use-case.

**Example:**
```typescript
// application/orders/order-service.ts
import { Order, OrderId, OrderItem } from "../../domain/orders";
import { CustomerRepository } from "../customer/ports/customer-repository";
import { OrderRepository } from "./ports/order-repository";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async placeOrder(customerId: string, items: OrderItem[]): Promise<Order> {
    // Validate customer exists (cross-context check)
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new CustomerNotFoundError(customerId);
    }

    // Create order (domain logic)
    const order = Order.create(OrderId.generate(), customerId, items);

    // Persist order
    await this.orderRepository.save(order);
    return order;
  }
}
```

In this pattern:
- `OrderService` imports domain models from the Order context.
- It also depends on `CustomerRepository` (a port in the Customer context's application layer).
- The service coordinates both contexts' domain logic directly.

### Pattern 2: Service-to-Service Injection

The application service depends on other application services through dependency injection, delegating cross-context operations to those services.

**Example:**
```typescript
// application/orders/order-service.ts
import { Order, OrderId, OrderItem } from "../../domain/orders";
import { CustomerService } from "../customer/customer-service";
import { OrderRepository } from "./ports/order-repository";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerService: CustomerService,
  ) {}

  async placeOrder(customerId: string, items: OrderItem[]): Promise<Order> {
    // Delegate customer validation to CustomerService
    const customerExists = await this.customerService.customerExists(customerId);
    if (!customerExists) {
      throw new CustomerNotFoundError(customerId);
    }

    // Create order (domain logic)
    const order = Order.create(OrderId.generate(), customerId, items);

    // Persist order
    await this.orderRepository.save(order);
    return order;
  }
}
```

In this pattern:
- `OrderService` depends on `CustomerService` (another application service).
- Cross-context interaction happens at the service level, not through direct repository or domain imports.
- `CustomerService` encapsulates customer-specific logic and exposes it through a clean interface.

---

## Comparing the Patterns

Both patterns are valid in different situations. Let's examine the trade-offs.

### Pattern 1: Direct Domain Import

**Advantages:**
- **Simpler composition root:** Fewer dependencies to wire, since services depend on repositories rather than other services.
- **Clearer dependency flow:** Domain imports are explicit, making it easy to see which contexts a service uses.
- **Avoids service bloat:** You don't need to add methods to other services just to support cross-context operations.
- **Better for read-heavy use-cases:** When you need to query data from multiple contexts without triggering complex logic, importing repositories directly is often cleaner.

**Disadvantages:**
- **Bypasses application logic:** If the Customer context has important validation, authorisation, or orchestration logic in `CustomerService`, importing `CustomerRepository` directly means you bypass that logic.
- **Duplicated logic:** If multiple services need the same cross-context check (for example, "customer exists"), that check may be duplicated across services.
- **Weaker encapsulation:** Other contexts can see and depend on your repository ports, which may expose more than you intend.

**When to use:**
- The cross-context operation is simple (for example, existence check, read-only query).
- There's no important application-level logic in the other context that you'd bypass.
- The consuming context would otherwise force you to add trivial methods to other services just to satisfy one use-case.

### Pattern 2: Service-to-Service Injection

**Advantages:**
- **Respects application logic:** Delegating to another service ensures you go through its validation, authorisation, and orchestration logic.
- **Reusable operations:** When multiple contexts need the same operation (for example, "validate customer"), you define it once in `CustomerService` and reuse it everywhere.
- **Stronger encapsulation:** Other contexts interact with your service through a well-defined interface, not by reaching into your repositories.
- **Better for complex use-cases:** When cross-context operations involve multiple steps, validations, or side effects, service-to-service delegation keeps the complexity manageable.

**Disadvantages:**
- **More complex composition root:** You need to wire services to services, not just services to repositories. This can make the dependency graph harder to reason about.
- **Risk of service bloat:** If you're not careful, application services can accumulate methods just to support cross-context use-cases, even when those methods aren't natural to the service's purpose.
- **Potential for circular dependencies:** Service A depends on Service B, which depends on Service C, which depends on Service A. This can be resolved through careful interface design (ports), but it adds complexity.

**When to use:**
- The cross-context operation involves complex logic, validation, or side effects.
- Multiple contexts need the same operation (for example, "register customer", "validate order eligibility").
- You want to enforce a clear API boundary between contexts, hiding internal implementation details.
- The operation is likely to evolve and change over time, and you want a single place to maintain it.

---

## A Third Option: Focused Ports

There's a hybrid approach that combines the best of both patterns: **define focused ports in the consuming context that are implemented by adapters wrapping the providing context's services**.

This is the approach we explored in [Bounded Contexts and Cross-Context Collaboration](./bounded-contexts-collaboration.md).

**Example:**
```typescript
// application/orders/ports/customer-port.ts
export interface CustomerPort {
  customerExists(customerId: string): Promise<boolean>;
}

// adapters/orders/customer-service-adapter.ts
import { CustomerService } from "../../../application/customer/customer-service";
import { CustomerPort } from "../../../application/orders/ports/customer-port";

export class CustomerServiceAdapter implements CustomerPort {
  constructor(private readonly customerService: CustomerService) {}

  async customerExists(customerId: string): Promise<boolean> {
    const customer = await this.customerService.getCustomer(customerId);
    return customer !== null;
  }
}
```

In this pattern:
- The consuming context (Order) defines a focused port (`CustomerPort`) representing only what it needs.
- An adapter in the Order context's adapter layer wraps the providing context's service (`CustomerService`).
- The consuming context depends on its own abstraction, not on the providing context's internals.

**Advantages:**
- **Interface Segregation:** The consuming context only sees the operations it needs, not the full provider service interface.
- **Respects application logic:** The adapter delegates to the provider service, ensuring you go through its validation and orchestration logic.
- **Decouples contexts:** The consumer depends on its own port, not on the provider's internal types or interfaces.
- **Testability:** You can test the consumer by mocking the focused port, without needing the full provider service.

**Disadvantages:**
- **More boilerplate:** You need to define the port interface and create an adapter for each cross-context dependency.
- **Indirection:** There's an extra layer between the consumer and provider, which can make the dependency path less obvious.

**When to use:**
- You want to follow the Interface Segregation Principle strictly.
- The consuming context only needs a subset of the providing context's operations.
- You want to decouple contexts as much as possible, making them independently testable and evolvable.
- The cross-context operation involves application-level logic that should go through the provider's service layer.

---

## Decision Framework

Here's a practical decision tree for choosing between patterns:

1. **Is the cross-context operation simple and read-only (for example, "does this ID exist")?**
   - **Yes:** Consider **Direct Domain Import** (Pattern 1). Depend on the repository port directly.
   - **No:** Continue to step 2.

2. **Does the providing context have important application-level logic (validation, authorisation, orchestration) that must run?**
   - **Yes:** Use **Service-to-Service Injection** (Pattern 2) or **Focused Ports** (Pattern 3).
   - **No:** Consider **Direct Domain Import** (Pattern 1).

3. **Will multiple contexts need this operation?**
   - **Yes:** Use **Service-to-Service Injection** (Pattern 2) or **Focused Ports** (Pattern 3) to centralise the logic.
   - **No:** Consider **Direct Domain Import** (Pattern 1) if it keeps things simpler.

4. **Do you want strict Interface Segregation (consumer only sees what it needs)?**
   - **Yes:** Use **Focused Ports** (Pattern 3).
   - **No:** Use **Service-to-Service Injection** (Pattern 2).

5. **Is the dependency graph becoming complex (risk of circular dependencies)?**
   - **Yes:** Use **Focused Ports** (Pattern 3) to break cycles, or reconsider context boundaries.
   - **No:** Continue with your chosen pattern.

---

## Practical Examples from the Reference Implementation

In the reference implementation for this series, we use a mix of patterns depending on the situation:

### Example 1: Order Service Using Focused Port (Pattern 3)

`OrderService` validates customer existence through a focused `CustomerPort`:

```typescript
// application/orders/order-service.ts
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerPort: CustomerPort, // Focused port
  ) {}

  async placeOrder(dto: PlaceOrderDTO): Promise<Order> {
    const customerExists = await this.customerPort.customerExists(dto.customerId);
    if (!customerExists) {
      throw new CustomerNotFoundError(dto.customerId);
    }
    // ... rest of order logic
  }
}
```

**Why this pattern?**
- The operation ("customer exists") goes through `CustomerService`, ensuring validation logic runs.
- `OrderService` only sees the single method it needs, not the full `CustomerService` interface.
- The contexts remain decoupled: Order doesn't import Customer's internal types.

### Example 2: Report Service Using Direct Domain Import (Pattern 1)

Imagine a `ReportService` that generates a customer order report. It might import repositories from both contexts directly:

```typescript
// application/reports/report-service.ts
export class ReportService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly orderRepository: OrderRepository,
  ) {}

  async generateCustomerOrderReport(customerId: string): Promise<Report> {
    const customer = await this.customerRepository.findById(customerId);
    const orders = await this.orderRepository.findByCustomerId(customerId);
    
    // Combine data into report
    return Report.create(customer, orders);
  }
}
```

**Why this pattern?**
- The operation is read-only and doesn't trigger complex application logic.
- Creating focused ports or injecting services would add boilerplate without meaningful benefit.
- The composition root remains simple: just wire repositories to the service.

---

## Avoiding Common Pitfalls

### Pitfall 1: Service Bloat

If you use Pattern 2 (service-to-service injection) too liberally, services can accumulate methods just to support cross-context operations. For example, `CustomerService` might end up with `customerExists`, `getCustomerForOrders`, `getCustomerForShipping`, etc.

**Solution:** Use **Focused Ports** (Pattern 3) to keep each context's view of other contexts minimal and intentional.

### Pitfall 2: Circular Dependencies

Service A depends on Service B, which depends on Service A. This is a sign of poor context boundaries or overly tight coupling.

**Solution:**
- Revisit context boundaries. Should these services be in the same context?
- Use **Focused Ports** to break the cycle: both services depend on abstractions, and adapters wire them together.
- Consider introducing a higher-level service that coordinates both, rather than having them depend on each other.

### Pitfall 3: Bypassing Application Logic

If you use Pattern 1 (direct domain import) and bypass important validation or orchestration logic in the provider's service layer, you risk duplicating that logic or introducing bugs.

**Solution:** Default to **Service-to-Service Injection** (Pattern 2) or **Focused Ports** (Pattern 3) when the provider has meaningful application-level logic. Only use Pattern 1 for truly simple, read-only operations.

---

## Summary

Application services can compose cross-context operations in multiple ways:
- **Direct Domain Import:** Import repositories or domain models directly. Best for simple, read-only operations.
- **Service-to-Service Injection:** Inject other application services. Best when you need to go through the provider's validation and orchestration logic.
- **Focused Ports:** Define minimal, context-specific ports implemented by adapters. Best for strict Interface Segregation and decoupling.

The right pattern depends on the complexity of the operation, whether you need to respect application-level logic, and how strictly you want to enforce context boundaries.

Key takeaways:
- **Start simple:** Use direct domain import for trivial operations, and add service-to-service injection or focused ports when complexity warrants it.
- **Respect application logic:** If the provider has important validation or orchestration, don't bypass it.
- **Avoid service bloat:** Don't add methods to services just to support cross-context use-cases that could be handled through direct repository access.
- **Use focused ports for strict boundaries:** When contexts should remain loosely coupled and independently testable, focused ports provide the cleanest separation.

In the next post, we'll explore practical code organisation patterns: how to structure directories, name files, and organise ports, DTOs, and errors within bounded contexts.

---

## Further reading and resources

- [Interface Segregation Principle (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html) — the "I" in SOLID, guiding how we design focused interfaces.
- [Dependency Injection (Martin Fowler)](https://martinfowler.com/articles/injection.html) — comprehensive guide to dependency injection patterns and trade-offs.
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book) — includes guidance on context mapping and how bounded contexts collaborate.
- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book) — explores dependency rules and how layers interact through abstractions.

---

## Glossary terms in this post

- [Application layer](../glossary.md#application-layer)
- [Bounded contexts](../glossary.md#bounded-contexts)
- [Dependency injection](../glossary.md#dependency-injection)
- [Ports and adapters](../glossary.md#ports-and-adapters)
- [Interface Segregation Principle](../glossary.md#interface-segregation-principle)
- [Composition root](../glossary.md#composition-root-dependency-injection)
