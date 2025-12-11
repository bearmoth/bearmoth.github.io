# Architectural Decision: Cross-Context Type Sharing

Last updated 2025-12-11

**Status:** Decided  
**Context:** Clean Architecture example project - Order and Customer bounded contexts

---

## Problem Statement

When one bounded context references entities from another context, should it import and use that context's domain types, or should it use primitives?

Specifically: Should the `Order` entity import and use `CustomerId` from the Customer domain, or should it use `string` for customer identifiers?

---

## Context

In our clean architecture example, the Order domain entity needs to reference a customer. The Customer context has a `CustomerId` value object that enforces validation and provides type safety. 

Current implementation:
```typescript
export class Order {
  private constructor(
    public readonly id: OrderId,
    public readonly customerId: string,  // Using primitive
    // ...
  ) {}
}
```

Alternative approach:
```typescript
import { CustomerId } from "../../domain/customer";

export class Order {
  private constructor(
    public readonly id: OrderId,
    public readonly customerId: CustomerId,  // Using Customer's domain type
    // ...
  ) {}
}
```

---

## Options Considered

### Option 1: Import Domain Types from Other Contexts

Import `CustomerId` from Customer domain and use it in Order domain.

**Pros:**
- Stronger type safety - compile-time prevention of invalid customer IDs
- Consistent validation - CustomerId validation enforced everywhere it's used
- Clearer intent - the type system expresses that this is specifically a customer identifier
- Could catch bugs at compile time (e.g., accidentally passing an order ID where a customer ID is expected)

**Cons:**
- **Creates direct dependency between bounded contexts** - Order domain depends on Customer domain
- **Violates bounded context independence** - contexts should be independently deployable and evolvable
- **Tight coupling** - changes to CustomerId structure affect Order context
- **Limits architectural evolution** - harder to extract contexts into separate services later
- **Violates DDD principle** that contexts should translate concepts at boundaries, not share domain models
- **Context contagion** - if Order depends on Customer types, and Customer depends on Account types, Order transitively depends on Account

### Option 2: Use Primitives for Cross-Context References ✅

Use `string` for `customerId` in Order domain.

**Pros:**
- **Maintains bounded context independence** - Order context doesn't depend on Customer domain types
- **Supports architectural evolution** - contexts can be extracted to separate services without breaking dependencies
- **Aligns with DDD principles** - each context has its own domain model, contexts interact through translation
- **Prevents coupling cascade** - contexts don't inherit dependencies transitively
- **Simpler context boundaries** - clear separation at the domain layer
- **Realistic for distributed systems** - if Customer becomes a separate service, Order would receive customer IDs as strings anyway

**Cons:**
- Weaker type safety - no compile-time prevention of passing wrong ID types
- Could accidentally pass an order ID where a customer ID is expected
- Validation of customer ID format is not enforced in Order domain
- Less explicit in the type system that this is a customer identifier

---

## Deciding Factors

1. **Bounded context independence**: DDD emphasises that bounded contexts should be independently deployable and evolvable. Sharing domain types creates dependency chains that violate this principle.

2. **Architectural evolution**: If Customer context is extracted to a separate microservice in the future, Order context would receive customer identifiers as primitives (strings) over HTTP/gRPC anyway. Using primitives now prepares for this evolution.

3. **Context translation principle**: At the boundary between contexts, concepts should be translated, not shared. Order context translates the primitive customer ID into its own understanding of what a customer reference means within an order.

4. **Existing pattern in the codebase**: Our `bounded-contexts-collaboration.md` post establishes that contexts interact through focused ports using primitives, not by sharing domain types.

5. **Validation placement**: Customer ID validation belongs in the Customer context. Order context doesn't need to validate customer ID format; it only needs to validate that the customer exists (via `CustomerValidator` port).

6. **Pragmatic type safety**: While we lose compile-time type checking for customer IDs, we gain architectural flexibility. The trade-off favours independence over type safety at context boundaries.

---

## Decision

**Use primitives (`string`) for cross-context references.**

The Order domain uses `string` for `customerId`. This maintains bounded context independence and aligns with DDD principles of context separation.

---

## Implementation Notes

**Order domain entity:**
```typescript
export class Order {
  private constructor(
    public readonly id: OrderId,
    public readonly customerId: string,  // Primitive for cross-context reference
    public readonly items: ReadonlyArray<OrderItem>,
    public readonly status: OrderStatus,
    public readonly createdAt: Date,
  ) {}

  // Using string for customerId rather than importing CustomerId from Customer context.
  // This maintains clear bounded context separation - Order context doesn't depend on
  // Customer domain types, only on the customer identifier as a primitive.
  static create(id: OrderId, customerId: string, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new InvalidOrderError("Order must have at least one item");
    }

    return new Order(id, customerId, items, OrderStatus.Pending, new Date());
  }
}
```

**Cross-context validation happens at application layer:**
```typescript
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerValidator: CustomerValidator,  // Port for cross-context interaction
  ) {}

  async placeOrder(dto: PlaceOrderDTO): Promise<Order> {
    // Validate customer exists (cross-context interaction through port)
    const customerExists = await this.customerValidator.customerExists(dto.customerId);
    if (!customerExists) {
      throw new CustomerNotFoundError(dto.customerId);
    }

    // Pass primitive customerId to domain
    const order = Order.create(orderId, dto.customerId, items);
    return await this.orderRepository.save(order);
  }
}
```

**Comment added to clarify decision:**
File: `src/domain/orders/order.ts`

---

## Related Concepts

- [Bounded contexts](../glossary.md#bounded-contexts)
- [Anti-corruption layer](../glossary.md#anti-corruption-layer)
- [Context mapping](../glossary.md#context-mapping)
- [Value objects](../glossary.md#value-objects)

## Related Posts

- [Bounded Contexts and Cross-Context Collaboration](../bounded-contexts-collaboration.md)
- [The Domain Layer](./03-domain-layer.md)
- [Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)

---

## Further Considerations

### When Might Type Sharing Be Appropriate?

There are limited scenarios where sharing domain types across contexts might be acceptable:

1. **Shared Kernel**: If two contexts are so closely related that they explicitly share a small set of domain concepts, DDD's Shared Kernel pattern allows this. However, this creates tight coupling and should be used sparingly.

2. **Published Language**: If one context publishes a formal API/contract that includes typed definitions (e.g., TypeScript definitions for a public API), consumers might use those types. However, this is different from sharing internal domain models.

3. **Single bounded context**: If what we think are separate contexts are actually part of the same context, then sharing types is appropriate. However, this suggests we need to revisit our context boundaries.

For our example, Order and Customer are clearly separate contexts with different concerns, so type sharing is not appropriate.

### Type Safety Through Other Means

We can achieve some type safety without sharing domain types:

1. **Branded types** (TypeScript-specific):
```typescript
type CustomerId = string & { readonly __brand: unique symbol };
type OrderId = string & { readonly __brand: unique symbol };
```

This provides compile-time type safety without creating runtime dependencies between contexts. However, it's a TypeScript-specific solution and doesn't help with validation.

2. **Generic type parameters**: Another alternative considered was making Order generic over the customer identifier type:

```typescript
export class Order<TCustomerId = string> {
  private constructor(
    public readonly id: OrderId,
    public readonly customerId: TCustomerId,
    // ...
  ) {}
}

// Usage: Order<string> or Order<CustomerId>
```

**Why we rejected generics:**
- **Adds complexity**: Every consumer of `Order` needs to specify the generic type
- **Doesn't solve the core problem**: Using `Order<CustomerId>` still creates a dependency on Customer context
- **Type inference challenges**: Inferring the generic type correctly can be tricky
- **Harder to read**: Generics make the code more complex without providing architectural benefits
- **Not useful for cross-context references**: If the goal is context independence, the generic would always be `string` anyway

Generics might make sense if Order entity is intended to be reusable across completely different systems with different identifier types, but that's not our goal. Each context should have its own Order entity if needed, not share a generic one.

3. **Application-layer validation**: The application layer validates that customer IDs exist through the `CustomerValidator` port before creating orders. This provides runtime safety even though the domain uses primitives.

3. **Integration tests**: Cross-context integration tests verify that contexts interact correctly, catching issues that type safety might miss (e.g., format mismatches, semantic errors).

**Conclusion on type safety alternatives:**

For cross-context references in a bounded context architecture:
- **Plain `string` is the clearest choice** - it explicitly signals context independence
- **Branded types** can work within a single codebase but don't fundamentally change the architecture
- **Generics add complexity without solving the boundary problem**
- **Runtime validation through ports** is more important than compile-time type safety at context boundaries

### Evolution to Microservices

If we later extract Customer to a separate microservice:

- Order service would receive customer IDs as strings (from HTTP requests, message queues, etc.)
- Order domain already uses `string`, so no changes needed
- `CustomerValidator` port implementation would change to call Customer service over HTTP/gRPC
- Order context remains unchanged at the domain and application layers

This demonstrates the value of maintaining context independence from the start.

### Validation Concerns

Some might worry that using `string` means no validation of customer ID format. However:

1. **Validation belongs in Customer context**: Customer context defines what a valid customer ID looks like. Order context doesn't need to know this.

2. **Order context validates existence, not format**: Order's concern is "does this customer exist?" not "is this a well-formed customer ID?" The `CustomerValidator` port handles existence checking.

3. **Invalid IDs will fail existence check**: If someone passes an invalid customer ID to Order context, `customerValidator.customerExists()` will return false, and the order will be rejected.

This separation of concerns is cleaner than having Order context duplicate Customer's validation logic.
