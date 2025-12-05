# The Domain Layer

Published on 2025-12-05

**Themes:** domain-driven design, domain layer, business logic, invariants, domain modelling

> **Note:** I have a strong preference for immutability in domain models and business logic. Where possible, I favour designs that avoid mutation and instead return new values for state changes. This keeps rules explicit, makes code easier to reason about, and helps ensure invariants are always enforced.

The domain layer is the heart of Clean Architecture. It's where the business rules live, isolated from infrastructure and framework concerns. In this post, we'll look at what belongs in the domain layer, why keeping it pure matters, and how that constraint shapes the rest of the architecture.

---

## Series Navigation
- [Introduction](./01-introduction.md)
- [Architecture Overview](./02-architecture-overview.md)
- **[The Domain Layer](./03-domain-layer.md)** (current)
- [The Application Layer](./04-application-layer.md)
- [The Infrastructure Layer](./05-infrastructure-layer.md)
- [Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)

---

## What Lives in the Domain Layer

The domain layer contains everything that defines the business rules and concepts of your service. This includes:

### Models

Domain models represent the core entities and value objects in your system. They capture the structure and behaviour of the things your service cares about, expressed in the language of the business domain.

A model isn't just a data structure. It encapsulates rules, enforces invariants, and exposes operations that make sense in the domain. If you're modelling an order, the domain model knows what makes an order valid, how it transitions between states, and what operations are allowed at each stage.

### Invariants

Invariants are the constraints that must always hold true for your domain objects to be in a valid state. For example, an order might require at least one line item, or a user's age might need to be non-negative.

The domain layer enforces these invariants at construction and mutation points. If an operation would violate an invariant, the domain layer rejects it, typically by returning a domain error.

### Domain Errors

Domain errors represent violations of business rules. They're distinct from infrastructure errors (network failures, database timeouts) or application errors (validation failures, authorisation issues). Domain errors capture concepts like "cannot cancel a shipped order" or "insufficient inventory for this product."

By keeping domain errors in the domain layer, you make the business rules explicit and give the rest of the system a clear vocabulary for handling rule violations.

### Pure Domain Logic

The domain layer is home to pure business logic: functions and methods that operate on domain models without side effects. Pure functions take inputs, apply domain rules, and return outputs. They don't perform I/O, mutate global state, or depend on infrastructure.

This purity makes domain logic easy to test, easy to reason about, and easy to reuse across different contexts (use-cases, batch jobs, event handlers).

---

## Dependency Rules for the Domain Layer

As we covered in the [architecture overview](./02-architecture-overview.md), the domain layer can only import from itself. It has no dependencies on application or infrastructure code.

This constraint is non-negotiable. If your domain layer needs to persist data, call an external API, or perform any other infrastructure operation, that's a signal that the operation doesn't belong in the domain layer. Instead, the domain layer returns a value or error, and a higher layer (application or infrastructure) handles the side effect.

---

## Why Keep the Domain Layer Pure?

The purity constraint might feel restrictive at first. Why not let the domain layer save itself to a database or send an email directly?

The answer is portability and testability. By keeping the domain layer pure, you can:

- **Test domain logic in isolation**, without needing to mock databases, HTTP clients, or other infrastructure.
- **Reuse domain logic across different contexts**, such as HTTP handlers, background jobs, or event subscribers.
- **Change infrastructure without touching domain code**. If you migrate databases or swap out an external API, the domain layer remains unchanged.
- **Understand business rules at a glance**, without infrastructure noise obscuring the core logic.

In a legacy monorepo, where infrastructure patterns shift frequently, this isolation is especially valuable. The domain layer becomes a stable core that evolves only when business requirements change, not when infrastructure does.

---

## What Doesn't Belong Here

It's worth being explicit about what doesn't belong in the domain layer:

- **Database access:** Domain models don't know about repositories, ORMs, or SQL.
- **HTTP requests or responses:** The domain layer doesn't deal with request parsing, routing, or status codes.
- **Framework-specific code:** No Express middleware, no Effect layers, no library-specific abstractions (unless they're purely functional utilities with no I/O).
- **Application orchestration:** The domain layer provides building blocks; it doesn't coordinate multi-step use-cases.

If you find yourself wanting to add any of these to the domain layer, that's a clue that the responsibility belongs in a higher layer.

---

## A Practical Example

Imagine you're modelling an order in an e-commerce service. The domain layer might define:

```typescript
// domain/order.ts
export class Order {
  private constructor(
    public readonly id: OrderId,
    public readonly items: OrderItem[],
    public readonly status: OrderStatus,
  ) {
    // Invariant: orders must have at least one item
    if (items.length === 0) {
      throw new InvalidOrderError("Order must contain at least one item");
    }
  }

  static create(id: OrderId, items: OrderItem[]): Order {
    return new Order(id, items, OrderStatus.Pending);
  }

  cancel(): Result<Order, DomainError> {
    // Business rule: can't cancel shipped orders
    if (this.status === OrderStatus.Shipped) {
      return Result.failure(new CannotCancelShippedOrderError());
    }
    return Result.success(new Order(this.id, this.items, OrderStatus.Cancelled));
  }
}
```

Notice:
- The `Order` class enforces an invariant (at least one item) at construction.
- The `cancel` method captures a business rule (shipped orders can't be cancelled).
- There's no database access, no HTTP handling, no infrastructure.

The domain layer defines what an order is and what you can do with it. How orders are persisted, retrieved, or exposed over HTTP is a concern for higher layers.

---

## Looking Ahead

In the next post, we'll move up one layer and look at the application layer. This is where we orchestrate domain logic to fulfill use-cases, and where we start to see the need for infrastructure without directly depending on it.

---

## Further reading and resources

- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book) – the canonical reference for domain modelling, invariants, and keeping domain logic pure.
- [Domain Modeling Made Functional (Scott Wlaschin)](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/) (book) – a practical guide to modelling domains using types and pure functions.
- [The Domain Model Pattern (Martin Fowler)](https://martinfowler.com/eaaCatalog/domainModel.html) – a concise overview of the domain model pattern and its role in application architecture.

---

## Glossary terms in this post

- [Domain layer](../glossary.md#domain-layer)
- [Invariants](../glossary.md#invariants)
- [Clean Architecture](../glossary.md#clean-architecture)
- [Bounded contexts](../glossary.md#bounded-contexts)
