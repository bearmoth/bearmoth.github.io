# Bounded Contexts and Cross-Context Collaboration

Last updated 2025-12-10

**Topics:** bounded contexts, interface segregation, ports and adapters, horizontal bloat, clean architecture, dependency inversion

One of the key challenges in applying Clean Architecture to a monorepo is preventing horizontal layers from becoming bloated dumping grounds for shared code. In this post, we'll explore how bounded contexts collaborate through focused ports, demonstrating how the Interface Segregation Principle prevents coupling and maintains clear context boundaries.

---

## The Challenge: Contexts Need to Interact

In the [Discovering Clean Architecture in Practice](./discovering-clean-architecture-in-practice/01-introduction.md) series, we established that Clean Architecture organises code into horizontal layers (domain, application, adapters), and that bounded contexts provide vertical boundaries within those layers.

But contexts rarely exist in complete isolation. An Order context needs to validate that customers exist before accepting orders. A Shipping context might need customer addresses. A Notification context might need customer email preferences.

The question is: **how do we enable this collaboration without creating tight coupling between contexts?**

---

## The Anti-Pattern: Shared Service Dependencies

A naive approach is to have the Order context import and depend directly on `CustomerService`:

```typescript
// ❌ Anti-pattern: Direct cross-context dependency
import { CustomerService } from "../../application/customer";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerService: CustomerService, // Tight coupling
  ) {}

  async placeOrder(dto: PlaceOrderDTO): Promise<Order> {
    const customer = await this.customerService.getCustomer(dto.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(dto.customerId);
    }
    // ... rest of order logic
  }
}
```

This creates several problems:

1. **Tight coupling:** The Order context now depends on the Customer context's internal implementation details.
2. **Interface bloat:** Order context gets access to the entire `CustomerService` interface, even though it only needs customer existence validation.
3. **Horizontal creep:** Changes to `CustomerService` (adding methods, refactoring internals) can ripple across all consuming contexts.
4. **Testing complexity:** Testing `OrderService` now requires setting up the full `CustomerService` and its dependencies.

This is **horizontal bloat** in action: shared layers quietly becoming tangled webs where everything depends on everything else.

---

## The Solution: Focused Ports Per Context

The ports and adapters pattern provides a better approach. Each consuming context defines its own **port** (interface) that represents only what it needs from the providing context.

### Step 1: Define a Focused Port in the Order Context

The Order context doesn't need the full `CustomerService`. It only needs to validate customer existence. So we define a minimal port in the Order application layer:

```typescript
// application/orders/ports/customer-port.ts
export interface CustomerPort {
  customerExists(customerId: string): Promise<boolean>;
}
```

This port:
- Lives in the **Order context's application layer**, not shared across contexts.
- Represents the **Order context's view** of customer operations.
- Defines **only what Order needs**, nothing more.

### Step 2: Inject the Port, Not the Service

`OrderService` depends on the port, not on `CustomerService`:

```typescript
// application/orders/services/order-service.ts
import type { CustomerPort } from "../ports";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerPort: CustomerPort, // Depends on abstraction
  ) {}

  async placeOrder(dto: PlaceOrderDTO): Promise<Order> {
    // Validate customer exists (cross-context interaction)
    const customerExists = await this.customerPort.customerExists(dto.customerId);
    if (!customerExists) {
      throw new CustomerNotFoundError(dto.customerId);
    }

    // Create and persist order
    const order = Order.create(
      OrderId.create(dto.orderId),
      dto.customerId,
      items,
    );
    return await this.orderRepository.save(order);
  }
}
```

The Order context never imports from the Customer context's application layer. It depends only on its own abstraction.

### Step 3: Implement the Port with an Adapter

In the adapter layer, we create a **CustomerServiceAdapter** that implements the Order context's `CustomerPort` by delegating to `CustomerService`:

```typescript
// adapters/orders/customer-service-adapter.ts
import type { CustomerService } from "../../../application/customer";
import type { CustomerPort } from "../../../application/orders/ports";

export class CustomerServiceAdapter implements CustomerPort {
  constructor(private readonly customerService: CustomerService) {}

  async customerExists(customerId: string): Promise<boolean> {
    const customer = await this.customerService.getCustomer(customerId);
    return customer !== null;
  }
}
```

This adapter:
- Implements the **Order context's port**.
- Wraps the **Customer context's service**.
- Acts as a **translation layer** between contexts.

### Step 4: Wire Dependencies at the Composition Root

The composition root assembles the dependencies:

```typescript
// composition-root.ts
export function createApp(databasePool: Pool): Hono {
  // Customer context
  const customerRepository = new PostgresCustomerRepository(databasePool);
  const customerService = new CustomerService(customerRepository);

  // Order context
  const orderRepository = new PostgresOrderRepository(databasePool);
  const customerServiceAdapter = new CustomerServiceAdapter(customerService);
  const orderService = new OrderService(orderRepository, customerServiceAdapter);

  // HTTP routes
  const customerRoutes = createCustomerRoutes(customerService);
  const orderRoutes = createOrderRoutes(orderService);

  // Assemble
  const app = new Hono();
  app.route("/", customerRoutes);
  app.route("/", orderRoutes);

  return app;
}
```

This is the **only place** in the codebase where the Order context and Customer context are explicitly wired together. Everywhere else, they remain decoupled.

---

## Interface Segregation in Practice

This pattern embodies the **Interface Segregation Principle** (the "I" in SOLID): clients should not be forced to depend on interfaces they don't use.

When a new context (say, Shipping) needs customer data, it doesn't reuse the Order context's `CustomerPort`. Instead, it defines its own:

```typescript
// application/shipping/ports/customer-port.ts
export interface CustomerPort {
  getShippingAddress(customerId: string): Promise<Address | null>;
}
```

And a corresponding adapter:

```typescript
// adapters/shipping/customer-service-adapter.ts
export class CustomerServiceAdapter implements CustomerPort {
  constructor(private readonly customerService: CustomerService) {}

  async getShippingAddress(customerId: string): Promise<Address | null> {
    const customer = await this.customerService.getCustomer(customerId);
    return customer ? customer.shippingAddress : null;
  }
}
```

Each context gets **exactly the interface it needs**, nothing more. The Customer context can evolve its internal implementation without affecting consumers, as long as it continues to fulfil the contracts defined by each port.

---

## Benefits of Focused Ports

### 1. Reduced Coupling

Contexts depend on abstractions, not on each other's internals. Changes to `CustomerService` only affect consuming contexts if the port contract changes.

### 2. Clearer Intent

The port name and signature clearly communicate **what** the consuming context needs. `CustomerPort.customerExists()` is more explicit than importing the entire `CustomerService` and calling `getCustomer()`.

### 3. Easier Testing

Testing `OrderService` no longer requires a full `CustomerService` setup. We can provide a simple test double that implements `CustomerPort`:

```typescript
class StubCustomerPort implements CustomerPort {
  async customerExists(customerId: string): Promise<boolean> {
    return customerId === "valid-customer";
  }
}
```

### 4. Prevents Horizontal Bloat

By defining ports locally within each context, we avoid creating a single, bloated "shared customer interface" that tries to satisfy everyone. Each context owns its own view of customer operations.

### 5. Supports Independent Evolution

The Order context can evolve its customer validation logic (maybe adding caching, or batch validation) without touching the Customer context. Similarly, the Customer context can refactor its internals without breaking Order.

---

## Avoiding Circular Dependencies Between Contexts

One of the most important rules when designing cross-context collaboration is: **never create circular dependencies between bounded contexts**.

A circular dependency occurs when Context A depends on Context B, and Context B also depends on Context A. This creates a tightly coupled mess where neither context can evolve independently, and changes ripple in unpredictable ways.

### The Anti-Pattern: Bidirectional Dependencies

```typescript
// ❌ Anti-pattern: Circular dependency

// In Order context:
import { CustomerService } from "../../application/customer";

// In Customer context:
import { OrderService } from "../../application/orders"; // WRONG!
```

If the Order context needs customer data, and the Customer context needs order data, you have a circular dependency. This is a red flag that your context boundaries might be wrong, or that you need a different collaboration pattern.

### Strategies for Breaking Circular Dependencies

#### 1. Establish a Dependency Direction

The most straightforward solution is to establish a clear dependency direction. In our example:

- **Order → Customer** (Order depends on Customer)
- **Customer ✗ Order** (Customer does NOT depend on Order)

The Order context can validate customers exist, but the Customer context never imports anything from Order. If Customer needs to query orders (for example, "show me this customer's recent orders"), that logic lives in a separate context or in a higher-level orchestration service.

#### 2. Introduce a Third Context

If two contexts genuinely need to interact bidirectionally, consider introducing a third context that orchestrates between them:

```
Customer ← CustomerOrders → Order
         ↖              ↗
           Orchestration
```

The `CustomerOrders` context (or service) depends on both Customer and Order, but neither Customer nor Order depends on each other or on CustomerOrders.

#### 3. Use Domain Events for Asynchronous Collaboration

Instead of direct calls, contexts can publish domain events that other contexts subscribe to:

```typescript
// Order context publishes events
await eventBus.publish(new OrderPlacedEvent(orderId, customerId));

// Customer context subscribes
class CustomerOrderHistoryHandler {
  async handle(event: OrderPlacedEvent) {
    // Update customer's order history
  }
}
```

This decouples contexts completely—neither imports from the other. The trade-off is eventual consistency and increased system complexity.

#### 4. Pull Up Shared Concepts

If both contexts need the same information, it might belong in a parent context or a shared kernel. For example, if both Order and Customer need "account status," perhaps there's an `Account` context that both depend on:

```
Order → Account ← Customer
```

Be cautious with this approach—shared kernels can become coupling points if not carefully governed.

### Guidelines for Context Dependencies

1. **Map your context dependencies explicitly.** Draw a diagram showing which contexts depend on which. If you see cycles, redesign.
2. **Favour acyclic dependencies.** Contexts should form a directed acyclic graph (DAG), not a tangled web.
3. **Keep dependencies shallow.** Avoid long chains (A → B → C → D). If you need deep chains, consider whether your context boundaries are correct.
4. **One-way streets only.** If Context A depends on Context B, Context B should never depend on Context A, directly or transitively.
5. **Adapters prevent direct coupling.** The adapter pattern (as shown with `CustomerServiceAdapter`) ensures that consuming contexts depend on their own ports, not on the provider's internals.

### Practical Example: Dependency Direction in the Reference Implementation

In the [reference implementation](../examples/01-clean-code-arch-simple/), the dependency direction is clear:

- **Order context** depends on Customer context (via `CustomerPort` and `CustomerServiceAdapter`).
- **Customer context** has zero knowledge of Orders.
- The **composition root** is the only place where both contexts are wired together.

This design allows:
- Customer context to be developed, tested, and deployed independently.
- Order context changes only affect Order (unless the `CustomerPort` contract changes).
- No risk of circular dependencies as the codebase grows.

You can verify this by examining the imports:
- [`application/orders/services/order-service.ts`](../examples/01-clean-code-arch-simple/src/application/orders/services/order-service.ts) imports only from `application/orders/` and `domain/orders/`.
- [`adapters/orders/customer-service-adapter.ts`](../examples/01-clean-code-arch-simple/src/adapters/orders/customer-service-adapter.ts) imports from `application/customer/` (the provider) and implements `CustomerPort` from `application/orders/` (the consumer).
- No file in `application/customer/` or `domain/customer/` imports anything from the Order context.

---

## When to Create a New Port vs Extending an Existing One

### Create a New Port When:

- **Different contexts need different operations.** Order needs existence validation; Shipping needs addresses; Notification needs email preferences. These are distinct concerns.
- **The same operation has different semantics.** A "customer" in the Order context might mean "someone who can place orders," while in the Loyalty context it might mean "someone enrolled in the loyalty programme."
- **You want to avoid coupling to implementation details.** If a port starts accumulating methods to satisfy multiple consumers, it becomes a façade for the providing context's service, defeating the purpose of focused interfaces.

### Extend an Existing Port When:

- **The same context needs additional related operations from the same provider.** For example, if Order context later needs to validate customer credit limits as well as existence, it might extend its own `CustomerPort` with a `getCreditLimit()` method.
- **The operations are genuinely cohesive** and represent a single, well-defined client need.

When in doubt, **create a new port**. It's easier to consolidate later than to untangle a bloated shared interface.

---

## Alternative: Shared Kernel

An alternative approach is to define a **shared kernel**—a small, deliberately owned set of types and interfaces that multiple contexts agree to share. For example, a `CustomerIdentity` type that includes just `id` and `status`.

However, shared kernels require careful governance:

- They introduce coupling (all contexts using the kernel must agree on changes).
- They can become dumping grounds for "common" code.
- They work best when the shared concepts are genuinely stable and central to the domain.

For cross-context interactions, **focused ports** are often preferable. They provide flexibility without the coordination overhead of a shared kernel.

---

## Practical Example: Order and Customer Contexts

In the [reference implementation](../examples/01-clean-code-arch-simple/), the Order and Customer contexts demonstrate this pattern:

- **Order context** defines `CustomerPort` in `application/orders/ports/`.
- **CustomerServiceAdapter** in `adapters/orders/` implements the port by wrapping `CustomerService`.
- **OrderService** validates customer existence before creating orders, using only the `CustomerPort` interface.
- **Customer context** remains unaware of the Order context's needs.

You can see the full implementation in the example project, including tests and HTTP routes.

---

## Summary

Bounded contexts in a Clean Architecture monorepo need to collaborate without becoming tightly coupled. The solution is to apply the **Interface Segregation Principle** through focused ports:

1. Each consuming context defines its own **port** representing only what it needs.
2. The port lives in the **consuming context's application layer**, not shared.
3. An **adapter** in the consuming context implements the port by delegating to the providing context's service.
4. The **composition root** wires everything together at runtime.

This pattern prevents horizontal bloat, keeps contexts decoupled, and makes testing easier. When another context needs different operations from the same provider, it creates its own focused port rather than reusing or extending an existing one.

The result is a codebase where contexts can evolve independently, with only deliberate, well-designed collaboration points between them.

---

## Further reading and resources

- [Interface Segregation Principle (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html) – explanation of ISP and its application in modern software design.
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-in-practice/06-ports-and-adapters.md) – how ports and adapters enable dependency inversion within Clean Architecture.
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book) – the source of the bounded context concept.
- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/) – the original ports and adapters pattern.

---

## Glossary terms in this post

- [Bounded contexts](./glossary.md#bounded-contexts)
- [Interface Segregation Principle](./glossary.md#interface-segregation-principle)
- [Ports and adapters](./glossary.md#ports-and-adapters)
- [Interface adapters layer](./glossary.md#interface-adapters-layer)
- [Application layer](./glossary.md#application-layer)
- [Clean Architecture](./glossary.md#clean-architecture)
- [Customer context](./glossary.md#customer-context)
- [Order context](./glossary.md#order-context)
- [Composition root](./glossary.md#composition-root-dependency-injection)
- [Dependency inversion](./glossary.md#dependency-inversion)
