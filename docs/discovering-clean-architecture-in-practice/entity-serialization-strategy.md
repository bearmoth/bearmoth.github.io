# Architectural Decision: Entity Serialization Strategy

Last updated 2025-12-11

**Status:** Decided  
**Context:** Clean Architecture example project - HTTP adapters and domain entities

---

## Problem Statement

When converting domain entities to JSON responses in HTTP adapters, where should the serialization logic live?

Specifically: Should we manually serialize entity fields in the adapter layer, or should domain entities provide a `toJson()` method?

---

## Context

In our clean architecture example, HTTP route handlers need to convert domain entities (like `Customer` and `Order`) to JSON responses. Domain entities use value objects for properties (`CustomerId`, `CustomerName`, `CustomerEmail`), which need to be converted to primitives (strings, numbers) for JSON serialization.

Current implementation (manual serialization):
```typescript
return ctx.json(
  {
    id: customer.id.toString(),
    name: customer.name.toString(),
    email: customer.email.toString(),
  },
  201,
);
```

Alternative approach (entity method):
```typescript
return ctx.json(customer.toJson(), 201);
```

---

## Options Considered

### Option 1: Manual Field Serialization in Adapters ✅

Keep serialization logic in the adapter layer, manually calling `.toString()` or similar methods on each field.

**Pros:**
- Maintains pure domain entities - no coupling to representation concerns
- Adapters control exactly what gets serialized and how it's structured
- Different adapters can serialize the same entity differently for different purposes (API v1 vs v2, public vs internal APIs, etc.)
- Clear separation of concerns: domain defines behaviour and invariants, adapters handle presentation
- Aligns with Ports and Adapters (Hexagonal) architecture - adapters translate between domain and external systems
- Easier to test domain entities without needing to test serialization logic

**Cons:**
- More verbose - each adapter must manually map fields
- Risk of inconsistency if multiple adapters serialize the same entity differently
- Changes to entity structure require updates in all adapters that serialize that entity

### Option 2: Add `toJson()` Method to Domain Entities

Add a method like `toJson()` or `toDTO()` to domain entities that returns a plain JavaScript object suitable for JSON serialization.

**Pros:**
- More convenient - adapters just call `.toJson()`
- Consistent serialization across all adapters
- Less code in adapters
- Centralised knowledge of how an entity should be represented

**Cons:**
- Couples domain entities to presentation concerns
- Domain entities shouldn't know how they'll be represented externally
- Different contexts may need different representations (e.g., public API vs admin API)
- Violates Single Responsibility Principle - entities now handle both domain logic and serialization
- Makes domain entities harder to test independently
- Creates dependency direction violation: domain would be aware of infrastructure concerns

---

## Deciding Factors

1. **Dependency direction**: Clean Architecture mandates that dependencies point inward. Domain entities should not be aware of how they're presented externally. Adding `toJson()` would violate this principle.

2. **Single Responsibility Principle**: Domain entities are responsible for enforcing business rules and invariants, not for serialization. Serialization is a presentation concern.

3. **Flexibility**: Different adapters may need different representations. A REST API might need one structure, GraphQL another, and an internal message queue yet another. Manual serialization allows this flexibility without polluting the domain.

4. **Testability**: Pure domain entities are easier to test. We test domain behaviour, not serialization formats. Serialization testing belongs in adapter tests.

5. **Real-world evolution**: As APIs evolve (versioning, deprecation, new fields), the serialization needs change. Keeping serialization in adapters makes these changes safer and more localised.

---

## Decision

**Use manual field serialization in the adapter layer.**

Domain entities remain pure, focused solely on business rules and invariants. Adapters are responsible for translating between the domain model and external representations (HTTP JSON, database rows, message queue payloads, etc.).

---

## Implementation Notes

**Adapter layer (HTTP routes):**
```typescript
app.post("/customers", async (ctx) => {
  const customer = await customerService.registerCustomer(body.name, body.email);

  // Manual field serialization in the adapter layer keeps domain entities pure.
  // Serialization is a presentation concern, not a domain concern.
  return ctx.json(
    {
      id: customer.id.toString(),
      name: customer.name.toString(),
      email: customer.email.toString(),
    },
    201,
  );
});
```

**Domain entities remain focused:**
```typescript
export class Customer {
  private constructor(
    public readonly id: CustomerId,
    public readonly name: CustomerName,
    public readonly email: CustomerEmail,
  ) {}

  // Only domain behaviour, no serialization methods
  static create(id: CustomerId, name: CustomerName, email: CustomerEmail): Customer {
    return new Customer(id, name, email);
  }

  updateName(newName: CustomerName): Customer {
    return new Customer(this.id, newName, this.email);
  }
}
```

**Comment added to clarify decision:**
Files updated: `src/adapters/customer/http/customer-routes.ts`

---

## Related Concepts

- [Clean architecture](../glossary.md#clean-architecture)
- [Ports and adapters](../glossary.md#ports-and-adapters)
- [Interface adapters layer](../glossary.md#interface-adapters-layer)
- [Single Responsibility Principle](../glossary.md#single-responsibility-principle)

## Related Posts

- [The Interface Adapters Layer](./05-interface-adapters-layer.md)
- [Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)
- [The Domain Layer](./03-domain-layer.md)

---

## Further Considerations

### The Teaching vs Pragmatic Trade-off

**For this teaching example, we use manual serialization** to demonstrate clean architecture principles in their purest form. This makes the separation of concerns explicit and shows the intended dependency direction.

**However, in production codebases, there are valid arguments for `.toJson()` on entities:**

1. **We already have `.toString()` on value objects**: If we're comfortable with value objects providing string representations, why not entities providing JSON representations?

2. **The adapter can still customize**: Even with `.toJson()`, adapters can call it and then modify the result, or ignore it entirely and serialize manually for special cases.

3. **Convenience vs purity**: The productivity gain of `customer.toJson()` might outweigh the philosophical purity of manual field mapping, especially if serialization is consistent across your application.

4. **The line is blurry**: Where exactly does "domain concern" end and "presentation concern" begin? If `.toString()` on a value object is acceptable (it's a presentation concern!), then `.toJson()` on an entity might be as well.

**A pragmatic middle ground:**

```typescript
// Domain entity with convenience method
export class Customer {
  // ... domain logic ...

  // Convenience method for common serialization
  // Adapters are free to use this or serialize manually
  toJson() {
    return {
      id: this.id.toString(),
      name: this.name.toString(),
      email: this.email.toString(),
    };
  }
}

// Adapter can use it directly
return ctx.json(customer.toJson(), 201);

// Or customize as needed
return ctx.json({
  ...customer.toJson(),
  _links: { self: `/customers/${customer.id}` }
}, 201);
```

**When to choose manual serialization (purist approach):**
- Teaching clean architecture concepts
- Multiple serialization formats needed (REST, GraphQL, message queues)
- API versioning with different representations
- Strong emphasis on dependency inversion

**When to choose `.toJson()` (pragmatic approach):**
- Small to medium applications with consistent serialization
- Single API representation per entity
- Team values convenience and readability over architectural purity
- The `.toString()` precedent makes `.toJson()` feel natural

For this example, we demonstrate the purist approach, but acknowledge that production code might reasonably choose the pragmatic path.

### When Might `toJson()` Be Appropriate?

In some contexts, a `toJson()` or `toDTO()` method might be acceptable:

1. **Application DTOs (not domain entities)**: Application layer DTOs that exist specifically for data transfer could include serialization methods, since their purpose is data representation.

2. **Read models in CQRS**: Read models designed specifically for queries might include serialization, as they're presentation-focused rather than domain-focused.

3. **Pragmatic production codebases**: As discussed above, the trade-off between convenience and purity often favors `.toJson()` in real-world applications.

### Reducing Verbosity with Helper Functions

If manual serialization becomes too verbose, we can introduce **serializer helper functions** in the adapter layer:

```typescript
// In adapter layer
function serializeCustomer(customer: Customer) {
  return {
    id: customer.id.toString(),
    name: customer.name.toString(),
    email: customer.email.toString(),
  };
}

// Usage
return ctx.json(serializeCustomer(customer), 201);
```

This keeps serialization out of the domain while reducing repetition in adapters.

### Value Object Serialization

Note that our value objects (like `OrderItem`) do provide a `toJSON()` method, but this is different from entity serialization:

- Value objects are primitives in domain language - they represent atomic values
- Serializing a value object is like serializing any other primitive
- This doesn't violate clean architecture because value objects don't contain complex business rules

The distinction is: entities coordinate complex behaviour, value objects are building blocks. Serialization helpers on building blocks are acceptable; serialization methods on entities are not.
