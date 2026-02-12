# Bounded Contexts in Practice: Discovery and Definition

Last updated 2025-12-11

**Topics:** bounded contexts, domain-driven design, clean architecture, context mapping, ubiquitous language, domain modelling

Bounded contexts are one of the most powerful—and most misunderstood—patterns in domain-driven design. When applied well, they give you clear ownership boundaries, focused vocabularies, and independent evolution paths for different parts of your system. When applied poorly, they can feel arbitrary, create unnecessary duplication, or fail to prevent the coupling they're meant to address.

In this post, I'll walk through how I discover and define bounded contexts in practice, how they manifest differently across Clean Architecture layers, and why a 1:1 mapping between layers and contexts is neither required nor always desirable.

---

## What is a Bounded Context?

A [bounded context](../glossary.md#bounded-contexts) is a boundary within which a particular domain model is defined and applicable. Inside that boundary, terms have specific, consistent meanings. Outside the boundary, the same terms might mean something different, or might not exist at all.

For example, in an e-commerce system:
- The **Customer** context might model customers with registration dates, loyalty tiers, and communication preferences.
- The **Order** context might model customers as simply a customer ID and billing address—it doesn't care about loyalty tiers.
- The **Shipping** context might model customers as a delivery address and contact number—it doesn't care about registration dates or orders.

Each context has its own language, its own rules, and its own model of what a "customer" means. The contexts collaborate, but they don't share a single, universal "Customer" entity.

This is the essence of bounded contexts: **focused models that serve specific purposes, with explicit boundaries and clear collaboration points**.

---

## Why Bounded Contexts Matter in Clean Architecture

Clean Architecture gives us horizontal layers—domain, application, adapters—but without vertical boundaries, those layers can easily become dumping grounds. In a monorepo, this is especially dangerous: without deliberate context boundaries, you end up with a single, bloated "core" that everything depends on.

Bounded contexts provide those vertical boundaries. They let you carve the system into cohesive areas that evolve independently, with only intentional collaboration between them.

In practice, this means:
- Each bounded context has its own domain model, application services, and adapters.
- Contexts are organised within the horizontal layers (for example, `domain/customer/`, `domain/orders/`, `application/customer/`, `application/orders/`).
- Cross-context dependencies flow through well-defined ports and adapters, not through direct imports of internal types or services.

This structure prevents horizontal bloat whilst maintaining the benefits of Clean Architecture's dependency rules.

---

## Discovering Bounded Contexts

Discovering context boundaries is more art than science. There's no formula that works in every situation. But there are patterns and heuristics that can guide the process.

### Start with Language

The most reliable signal for context boundaries is language. Listen to how domain experts talk about different areas of the system. If the same term means different things in different conversations, you've likely found a context boundary.

For example:
- In a **Billing** conversation, "customer" might mean "account holder with payment method and billing history."
- In a **Support** conversation, "customer" might mean "person with support tickets and contact history."
- In a **Shipping** conversation, "customer" might mean "delivery address and fulfilment preferences."

These aren't just different views of the same concept—they're genuinely different models serving different purposes. Each deserves its own bounded context.

### Look for Invariants and Rules

Invariants and business rules often cluster within context boundaries. If a set of rules consistently applies to a particular model, and those rules don't leak into other areas, that's a signal you've found a cohesive context.

For example:
- **Order** context rules: "an order must have at least one item", "orders can only be cancelled before shipping", "orders calculate tax based on delivery address."
- **Inventory** context rules: "stock levels cannot go negative", "reserved stock is unavailable for new orders", "stock adjustments must include a reason."

The Order context doesn't need to know how inventory tracks stock levels. The Inventory context doesn't need to know how orders calculate tax. Each context enforces its own rules independently.

### Identify Ownership and Change Patterns

Bounded contexts often align with team ownership and change patterns. If different teams or individuals are responsible for different areas, and changes in one area rarely affect the other, that's a natural context boundary.

In a monorepo, this is particularly valuable: it lets teams work independently without stepping on each other's toes, and reduces the risk of merge conflicts and coordination overhead.

### Beware of Premature Splitting

Not every model needs its own context. Small, tightly coupled concepts can often live together in a single context without causing problems.

For example, in the reference implementation for this series:
- `Order`, `OrderItem`, and `OrderStatus` all live in the Order context. They're tightly coupled, they change together, and splitting them would create more complexity than it solves.
- Similarly, `Customer`, `CustomerName`, and `CustomerEmail` live in the Customer context.

The key question is: **do these concepts naturally belong together, or am I forcing them together because I haven't recognised the boundary?**

If splitting a context would require complex coordination, introduce artificial dependencies, or scatter a cohesive set of rules across multiple places, it's probably not worth it.

---

## How Bounded Contexts Manifest Across Layers

One of the most important insights about bounded contexts in Clean Architecture is that **contexts don't need to map 1:1 across layers**. A context boundary in the domain layer doesn't necessarily require a matching boundary in the application layer or adapters.

### Domain Layer: Models and Invariants

In the domain layer, bounded contexts are most clearly expressed as distinct models with their own invariants and rules.

For example, in `domain/customer/`:
```typescript
export class Customer {
  private constructor(
    public readonly id: CustomerId,
    public readonly name: CustomerName,
    public readonly email: CustomerEmail,
  ) {}

  static create(id: CustomerId, name: CustomerName, email: CustomerEmail): Customer {
    // Customer-specific invariants
    return new Customer(id, name, email);
  }
}
```

And in `domain/orders/`:
```typescript
export class Order {
  private constructor(
    public readonly id: OrderId,
    public readonly customerId: string, // Just an ID, not the full Customer model
    public readonly items: OrderItem[],
    public readonly status: OrderStatus,
  ) {
    if (items.length === 0) {
      throw new InvalidOrderError("Order must contain at least one item");
    }
  }
}
```

Notice that `Order` doesn't import or depend on the `Customer` domain model. It only knows about a `customerId` string. The Order context's domain model is independent of the Customer context's domain model.

### Application Layer: Orchestration and Collaboration

In the application layer, bounded contexts often blur more than in the domain layer. Application services may need to coordinate across multiple domain contexts to fulfil a use-case.

For example, `OrderService` in `application/orders/` might:
- Use domain models from the Order context (`Order`, `OrderItem`, `OrderStatus`).
- Validate customer existence through a port that calls into the Customer context.
- Persist orders through a repository that stores order data.

The application layer is where cross-context collaboration happens, typically through ports and adapters rather than direct imports.

We'll explore this in more detail in the next post, [Application Layer Composition Patterns](./application-layer-composition-patterns.md).

### Adapters Layer: Shared Infrastructure and Context-Specific Implementations

In the adapters layer, context boundaries can become even more fluid. Some adapters are context-specific (for example, `PostgresOrderRepository` implements order persistence), whilst others are shared across contexts (for example, a database connection pool).

This flexibility is intentional. The adapters layer is where we make pragmatic trade-offs between isolation and efficiency. If sharing a database connection pool across contexts saves complexity without introducing coupling, that's a win.

The key is to keep context-specific business logic out of shared adapters. A shared database client is fine; a shared repository that mixes Order and Customer persistence logic is not.

---

## When to Split vs. When to Merge Contexts

Knowing when to split contexts and when to merge them is one of the hardest judgements to make. Here are some heuristics:

### Signs You Should Split

- **Different vocabularies:** The same term means different things in different conversations.
- **Independent rules:** Changes to one set of rules rarely affect the other.
- **Team ownership:** Different teams own and evolve the areas independently.
- **Coupling pain:** Keeping the contexts together creates frequent conflicts, coordination overhead, or merge pain.

### Signs You Should Merge

- **Shared invariants:** The contexts enforce the same rules on the same data.
- **Tight collaboration:** Every operation in one context requires coordination with the other.
- **Artificial boundaries:** The split feels forced, and most changes touch both contexts anyway.
- **Premature optimisation:** You're splitting in anticipation of future complexity that hasn't materialised yet.

When in doubt, start with fewer, larger contexts and split only when the pain of keeping them together outweighs the complexity of splitting.

---

## Practical Example: Customer and Order Contexts

In the reference implementation for this series, I've defined two bounded contexts: Customer and Order. Let's examine why these are separate contexts rather than a single "Commerce" context.

### Language and Invariants

- **Customer context:** Focuses on registration, profile management, and customer identity. Invariants include "email must be unique", "customer name must not be empty."
- **Order context:** Focuses on order placement, cancellation, and order lifecycle. Invariants include "orders must have at least one item", "shipped orders cannot be cancelled."

These are distinct vocabularies with distinct rules. Merging them would create a bloated context with mixed responsibilities.

### Collaboration Without Coupling

The Order context needs to validate that customers exist before accepting orders. But it doesn't need the full `Customer` model—it only needs a yes/no answer.

This is handled through a focused port:
```typescript
// application/orders/ports/customer-port.ts
export interface CustomerPort {
  customerExists(customerId: string): Promise<boolean>;
}
```

The Order context depends on this abstraction, not on the Customer context's internals. This keeps the contexts loosely coupled whilst enabling necessary collaboration.

We covered this pattern in detail in [Bounded Contexts and Cross-Context Collaboration](./bounded-contexts-collaboration.md).

### Directory Structure

The contexts are organised within horizontal layers:
```
src/
  domain/
    customer/
      customer.ts
      customer-id.ts
      customer-name.ts
      customer-email.ts
    orders/
      order.ts
      order-id.ts
      order-item.ts
      order-status.ts
  application/
    customer/
      customer-service.ts
      dtos/
      ports/
    orders/
      order-service.ts
      dtos/
      ports/
        customer-port.ts  // Order's view of Customer
  adapters/
    customer/
      repositories/
      http/
    orders/
      repositories/
      http/
      customer-service-adapter.ts  // Implements CustomerPort
```

This structure keeps contexts clear within layers whilst maintaining Clean Architecture's dependency rules.

---

## Common Pitfalls

### Pitfall 1: Too Many Contexts Too Early

Creating too many fine-grained contexts upfront can lead to excessive coordination overhead and unclear boundaries. Start with fewer, larger contexts and split only when the coupling pain becomes real.

### Pitfall 2: Forcing 1:1 Mapping Across Layers

Not every domain context needs its own application service or adapter. It's fine for an application service to orchestrate multiple domain contexts, or for an adapter to serve multiple contexts (for example, a shared database connection).

The domain layer is where context boundaries are strictest. The application and adapter layers have more flexibility.

### Pitfall 3: Sharing Domain Models Across Contexts

One of the most common mistakes is having multiple contexts import the same domain model. This creates tight coupling and defeats the purpose of bounded contexts.

If two contexts need similar data, they should each have their own model, tailored to their needs. Cross-context collaboration happens through ports and adapters, not through shared domain models.

### Pitfall 4: Treating Contexts as Micro-Services

Bounded contexts are logical boundaries, not deployment boundaries. In a monorepo, multiple contexts often live in the same service, sharing infrastructure and runtime.

You don't need separate databases, separate services, or separate deployments for each context. Contexts help you organise code and manage complexity—they don't dictate deployment architecture.

---

## Summary

Discovering and defining bounded contexts is about finding natural boundaries in your domain: places where language, rules, and ownership align. In Clean Architecture, contexts provide vertical structure within horizontal layers, preventing bloat whilst maintaining clear dependency rules.

Key takeaways:
- Start with language and listen for different meanings of the same term.
- Look for clusters of invariants and rules that belong together.
- Don't force 1:1 mapping across layers—contexts can be stricter in the domain layer and more fluid in application and adapters.
- Split contexts when coupling pain is real, not in anticipation of future complexity.
- Use ports and adapters for cross-context collaboration, not shared domain models.

In the next post, we'll explore how application services compose domain logic across multiple bounded contexts, and when to inject services versus building multi-domain services.

---

## Further reading and resources

- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book) — the canonical reference for bounded contexts and strategic design.
- [Bounded Context (Martin Fowler)](https://martinfowler.com/bliki/BoundedContext.html) — a concise overview of bounded contexts and how they relate to ubiquitous language.
- [Context Mapping (Domain-Driven Design)](https://github.com/ddd-crew/context-mapping) — practical patterns for describing relationships between bounded contexts.
- [Domain Modeling Made Functional (Scott Wlaschin)](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/) (book) — includes practical guidance on discovering context boundaries through language and workflows.

---

## Glossary terms in this post

- [Bounded contexts](../glossary.md#bounded-contexts)
- [Clean Architecture](../glossary.md#clean-architecture)
- [Domain layer](../glossary.md#domain-layer)
- [Application layer](../glossary.md#application-layer)
- [Interface adapters layer](../glossary.md#interface-adapters-layer)
- [Invariants](../glossary.md#invariants)
- [Ports and adapters](../glossary.md#ports-and-adapters)
