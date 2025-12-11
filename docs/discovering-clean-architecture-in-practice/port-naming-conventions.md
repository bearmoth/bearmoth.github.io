# Architectural Decision: Port Naming Conventions

Last updated 2025-12-11

**Status:** Decided  
**Context:** Clean Architecture example project - Hexagonal architecture ports

---

## Problem Statement

What naming convention should we use for ports (interfaces) in hexagonal architecture?

Specifically: Should we use a "Port" suffix (e.g., `CustomerPort`, `OrderRepositoryPort`), use domain-meaningful names without suffixes (e.g., `CustomerRepository`, `OrderRepository`), or use names that express the specific purpose of the interface (e.g., `CustomerValidator`, `CustomerLookup`)?

---

## Context

In our clean architecture example, the application layer defines ports (interfaces) that describe contracts for external interactions. We have two types of ports:

1. **Repository ports**: Interfaces for data persistence (e.g., `OrderRepository`, `CustomerRepository`)
2. **Cross-context collaboration ports**: Interfaces for interacting with other bounded contexts (e.g., `CustomerPort` for validating customers in the Order context)

The naming was inconsistent:
- `OrderRepository` and `CustomerRepository` used domain-meaningful names
- `CustomerPort` (in Order context) used a "Port" suffix

This inconsistency prompted the question: should we standardise on one approach?

---

## Options Considered

### Option 1: Use "Port" Suffix for All Interfaces

Name all ports with a "Port" suffix: `CustomerRepositoryPort`, `OrderRepositoryPort`, `CustomerValidationPort`.

**Pros:**
- Makes the hexagonal architecture explicit
- Clear distinction between interfaces (ports) and implementations (adapters)
- Consistent naming pattern across all ports
- Educational value - helps developers understand the architecture

**Cons:**
- Verbose and redundant when the interface name already suggests it's a contract
- Adds noise - "Port" doesn't add semantic meaning about what the interface does
- Not idiomatic in most programming communities (e.g., Java uses `Repository`, not `RepositoryPort`)
- Makes code less readable and more mechanical

### Option 2: Use Domain-Meaningful Names (Canonical Pattern Names)

Use established pattern names without suffixes: `Repository`, `Service`, etc.

**Pros:**
- Idiomatic and widely understood (e.g., `CustomerRepository` immediately signals repository pattern)
- Concise and readable
- Aligns with industry conventions (Spring Data uses `Repository`, Entity Framework uses `DbContext`, etc.)
- Pattern names carry semantic meaning

**Cons:**
- Less explicit that these are interfaces/ports rather than implementations
- Could confuse developers new to hexagonal architecture
- Doesn't help distinguish between different kinds of ports

### Option 3: Use Purpose-Specific Names ✅

Name each port according to its specific purpose: `CustomerValidator`, `OrderRepository`, `EmailSender`.

**Pros:**
- Expresses the **specific role** the interface plays in the application
- Follows Interface Segregation Principle - interfaces are named for what they do, not what they are
- More meaningful than generic suffixes
- Reduces coupling - consumers depend on specific capabilities, not broad abstractions
- Makes the interface's responsibility immediately clear from its name
- Natural fit for focused, single-purpose ports

**Cons:**
- Requires more thought to name each interface appropriately
- Less mechanical/formulaic than just adding "Port" or using pattern names
- May not have an obvious canonical name for some interfaces

---

## Deciding Factors

1. **Interface Segregation Principle**: Interfaces should be focused on specific client needs. Names should reflect these specific purposes rather than generic categories.

2. **Semantic clarity**: A name like `CustomerValidator` tells you exactly what the interface does (validates customers). A name like `CustomerPort` or `CustomerService` is vaguer.

3. **Bounded context collaboration**: When contexts interact through ports, the port name should express what capability the consuming context needs, not just that it's talking to another context.

4. **Industry idioms for repositories**: The Repository pattern is so well-established that `CustomerRepository` and `OrderRepository` are immediately understood. No need to add "Port" suffix.

5. **Consistency through purpose, not through mechanical naming**: Rather than mechanically adding "Port" everywhere, we achieve consistency by always naming interfaces according to their purpose.

---

## Decision

**Use purpose-specific names that clearly express what each port does.**

Specifically:
- **Repository ports** use the canonical `Repository` pattern name: `CustomerRepository`, `OrderRepository`
- **Cross-context collaboration ports** use names that express the specific capability: `CustomerValidator` (for validating customer existence)
- **Other ports** follow the same principle: name them for their purpose

---

## Implementation Notes

**Before (inconsistent):**
```typescript
// Repository port - no suffix
export interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: OrderId): Promise<Order | null>;
}

// Cross-context port - "Port" suffix
export interface CustomerPort {
  customerExists(customerId: string): Promise<boolean>;
}
```

**After (purpose-specific):**
```typescript
// Repository port - canonical pattern name
export interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: OrderId): Promise<Order | null>;
}

// Cross-context port - purpose-specific name
export interface CustomerValidator {
  customerExists(customerId: string): Promise<boolean>;
}
```

**Comment added to clarify decision:**
```typescript
// Port for customer validation in Order context.
// Named CustomerValidator to clearly express its purpose - validating customer existence.
// This interface represents only what the Order context needs from the Customer context,
// following Interface Segregation Principle to prevent coupling.
export interface CustomerValidator {
  customerExists(customerId: string): Promise<boolean>;
}
```

**Files updated:**
- `src/application/orders/ports/customer-port.ts` - interface renamed from `CustomerPort` to `CustomerValidator`
- `src/application/orders/order-service.ts` - usage updated
- `src/adapters/orders/customer-service-adapter.ts` - adapter implementation updated

---

## Related Concepts

- [Ports and adapters](../glossary.md#ports-and-adapters)
- [Interface Segregation Principle](../glossary.md#interface-segregation-principle)
- [Repository pattern](../glossary.md#repository-pattern)
- [Hexagonal architecture](../glossary.md#hexagonal-architecture)

## Related Posts

- [Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)
- [The Application Layer](./04-application-layer.md)
- [Bounded Contexts and Cross-Context Collaboration](../bounded-contexts-collaboration.md)

---

## Further Considerations

### When Is "Service" an Appropriate Name?

The term "Service" is common but vague. We avoid it for ports in favour of more specific names:

- Instead of `CustomerService` (vague), use `CustomerValidator`, `CustomerFinder`, or `CustomerNotifier` depending on the specific responsibility
- The application layer *implementations* might be called services (`CustomerService`, `OrderService`) because they orchestrate multiple operations, but ports should be more focused

### Why Not Use "Port" Suffix?

The "Port" suffix is common in hexagonal architecture literature and examples, particularly for educational purposes. However:

1. **It's redundant**: The fact that something is an interface (port) is already clear from context and language syntax (e.g., TypeScript's `interface` keyword)
2. **It obscures purpose**: `CustomerPort` could mean anything - validation, fetching, updating. `CustomerValidator` is specific.
3. **It's not idiomatic**: Most mature frameworks and codebases don't use suffixes like this. They use `Repository`, not `RepositoryPort`.

For teaching hexagonal architecture, we can rely on documentation, diagrams, and code structure rather than mechanical suffixes.

### Adapter Naming

Following this pattern, adapters (implementations) should also have meaningful names:

- `CustomerServiceAdapter` clearly indicates it adapts the `CustomerService` to implement `CustomerValidator`
- `PostgresOrderRepository` clearly indicates it's a PostgreSQL implementation of `OrderRepository`

The "Adapter" suffix on adapters is useful because adapters often adapt between two things (hence "Adapter"), and the suffix prevents name collisions with the ports they implement.

### Evolution Over Time

As the application evolves, port names might need refinement:
- If `CustomerValidator` gains more methods beyond existence checking, we might split it into more focused interfaces (`CustomerExistenceChecker`, `CustomerEligibilityValidator`)
- This is a good thing - it forces us to keep interfaces focused and properly segregated
