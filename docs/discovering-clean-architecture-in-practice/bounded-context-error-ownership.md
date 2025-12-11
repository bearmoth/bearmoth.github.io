# Architectural Decision: Bounded Context Error Ownership

Last updated 2025-12-11

**Status:** Decided  
**Context:** Clean Architecture example project - Order and Customer bounded contexts

---

## Problem Statement

When an error concept references entities from multiple bounded contexts, which context should own the error definition?

Specifically: Should `CustomerNotFoundError` (thrown when validating customer existence during order placement) live in the Customer context or the Order context?

---

## Context

In our clean architecture example, the Order application service needs to validate that a customer exists before placing an order. This cross-context validation can fail, requiring an error to be thrown.

The error is:
- **Named after a Customer concept** (`CustomerNotFoundError`)
- **Thrown by the Order context** during its validation workflow
- **References a customer ID** (a primitive string, not a domain object)
- **Used in the Order context's HTTP adapter** for error handling and HTTP status mapping

---

## Options Considered

### Option 1: Customer Context Owns the Error

Place `CustomerNotFoundError` in `application/customer/errors/`.

**Pros:**
- The error name references "Customer", so it feels like it belongs with Customer concepts
- Could be reused if other contexts also need to signal "customer not found"
- Canonical definition in one place

**Cons:**
- Creates a dependency from Order context to Customer context's application layer
- Violates bounded context independence - Order context shouldn't import from Customer context
- The error represents Order's validation failure, not Customer's domain concern
- If Customer context is extracted to a separate service, Order would need to handle the error differently anyway

### Option 2: Order Context Owns the Error ✅

Place `CustomerNotFoundError` in `application/orders/errors/`.

**Pros:**
- Maintains clear bounded context separation - Order context doesn't depend on Customer context
- The error represents a validation failure within Order's application layer
- Order context defines what it means for customer validation to fail
- Aligns with the principle that contexts should translate errors at their boundaries
- Supports future evolution where Customer context could be extracted to a separate service

**Cons:**
- The error name references "Customer", which might feel misplaced in the Order context
- If multiple contexts need similar errors, they'd each define their own version

---

## Deciding Factors

1. **Bounded context independence**: Order context should not depend on Customer context's internal types. The Order context only depends on the `CustomerValidator` port (interface), not on Customer's implementation details or errors.

2. **Error semantics**: This error represents "Order's customer validation failed", not "Customer domain operation failed". The Order context is responsible for defining what constitutes a validation failure in its workflow.

3. **Anti-Corruption Layer principle**: Each context should translate external concerns into its own domain language. Even though the error references "customer", it's expressing an Order context concern.

4. **Future evolution**: If Customer context becomes a separate microservice, Order context would need to handle customer lookup failures on its own terms anyway (network errors, timeouts, not-found responses). Having the error in Order context prepares for this.

5. **Alignment with existing pattern**: Our `bounded-contexts-collaboration.md` post establishes that contexts interact through focused ports, not by sharing domain concepts or application-layer types.

---

## Decision

**Keep `CustomerNotFoundError` in the Order context** (`application/orders/errors/`).

The error belongs in the Order context because:
- It represents a validation failure within the Order application layer
- Order context owns its validation rules and failure modes
- This maintains bounded context independence
- The error name describes the failure from Order's perspective, even though it references a Customer concept

---

## Implementation Notes

**File location:**
```
src/application/orders/errors/customer-not-found-error.ts
```

**Comment added to clarify decision:**
```typescript
// This error belongs in the Order context because it represents a validation failure
// within the Order application layer, not a domain concern of the Customer context.
// The Order context defines what it means for customer validation to fail.
export class CustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer ${customerId} not found`);
    this.name = "CustomerNotFoundError";
  }
}
```

**Usage:**
- Thrown by `OrderService.placeOrder()` when `customerValidator.customerExists()` returns false
- Caught by the Order HTTP adapter (`order-routes.ts`) and mapped to a 400 Bad Request response

---

## Related Concepts

- [Bounded contexts](../glossary.md#bounded-contexts)
- [Anti-corruption layer](../glossary.md#anti-corruption-layer)
- [Interface Segregation Principle](../glossary.md#interface-segregation-principle)

## Related Posts

- [Bounded Contexts and Cross-Context Collaboration](../bounded-contexts-collaboration.md)
- [The Application Layer](./04-application-layer.md)
- [Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)

---

## Further Considerations

### When Would Customer Context Own This Error?

If Customer context exposed a **public API** (not just an internal port) that explicitly includes this error in its contract, and multiple external consumers need to handle it consistently, then Customer context might own the canonical definition.

However, in a modular monolith or microservices architecture, each context should handle external failures on its own terms, translating them into context-specific errors.

### Alternative Naming

We could rename the error to be more explicit about whose concern it represents:
- `OrderCustomerValidationError`
- `CustomerValidationFailedError`
- `InvalidCustomerForOrderError`

However, `CustomerNotFoundError` is clear and concise, and with proper file location and comments, the ownership is unambiguous.
