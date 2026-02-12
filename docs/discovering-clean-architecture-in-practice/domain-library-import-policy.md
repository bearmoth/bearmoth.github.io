# Domain Layer Import Policy: Dependencies and Domain Purity

Last updated 2025-12-11

**Topics:** domain layer, dependencies, architectural boundaries, clean architecture, domain purity, pragmatism

One of the most contentious decisions in Clean Architecture is what external dependencies, if any, should be allowed in the domain layer. Purists argue the domain should have zero external dependencies. Pragmatists argue that strict purity can create unnecessary friction and duplication. In this post, I'll share the policy I use, the trade-offs involved, and how to evaluate new libraries for domain layer use.

---

## The Purity Principle

The core idea behind Clean Architecture is that the domain layer should be isolated from infrastructure concerns: databases, HTTP frameworks, message queues, and so on. This isolation makes domain logic portable, testable, and resilient to infrastructure changes.

But what about utility libraries? Validation libraries? Functional programming libraries? Where do we draw the line?

The traditional answer is: **the domain layer should have zero external dependencies**. All domain logic should be written in pure TypeScript (or your language of choice), with no imports from third-party packages.

**Advantages of strict purity:**
- **Maximum portability:** Domain code can be moved to a different project, language, or runtime without dragging dependencies along.
- **No hidden coupling:** You can't accidentally depend on infrastructure through a "harmless" utility library.
- **Stable core:** The domain layer doesn't change when library versions are upgraded or replaced.

**Disadvantages of strict purity:**
- **Reinventing the wheel:** You end up writing your own validation, result types, option types, and functional utilities when excellent libraries already exist.
- **Lower productivity:** Writing and maintaining domain-specific utilities takes time and effort that could be spent on business logic.
- **Potential for bugs:** Reimplementing well-tested libraries introduces opportunities for subtle bugs.

---

## A Pragmatic Policy

I've settled on a pragmatic middle ground: **the domain layer may import carefully selected, stable, purely functional libraries that enhance type safety, correctness, and productivity without introducing infrastructure coupling or volatile dependencies**.

The key criteria are:
1. **Purely functional:** The library has no side effects, no I/O, no mutable state.
2. **Stable and mature:** The library is widely used, well-maintained, and unlikely to introduce breaking changes frequently.
3. **Narrow scope:** The library solves a specific problem (validation, option types, result types) without sprawling into infrastructure concerns.
4. **Enhances correctness:** The library makes domain logic safer, more explicit, or easier to reason about.

**Libraries I allow in the domain layer:**
- **[Zod](https://zod.dev/):** Schema validation and type inference. Keeps invariants explicit and ensures domain objects are always in a valid state.
- **[ts-belt](https://mobily.github.io/ts-belt/):** Functional utilities for working with arrays, objects, results, and options. Improves readability and reduces boilerplate.
- **[fp-ts](https://gcanti.github.io/fp-ts/):** Functional programming primitives (Option, Either, Result). Makes error handling explicit and composable.
- **[Effect](https://effect.website/):** Type-safe effects, dependency injection, and error handling. Keeps domain logic pure whilst expressing side effects explicitly.

**Why these libraries?**
- They're purely functional (no I/O, no mutable state).
- They enhance type safety and correctness.
- They're stable, mature, and widely used in the TypeScript ecosystem.
- They don't leak infrastructure concerns into the domain.

---

## What Not to Import

There are categories of libraries that should **never** be imported in the domain layer, no matter how convenient they might be:

### Database Libraries

- **ORMs (TypeORM, Prisma, etc.):** These tie your domain models to database schemas and introduce persistence concerns.
- **Database clients (pg, mysql2, etc.):** These perform I/O and require infrastructure configuration.

**Why not:** The domain layer doesn't know about databases. Persistence is an infrastructure concern handled by repositories in the adapters layer.

### HTTP Libraries

- **HTTP frameworks (Express, Hono, Fastify, etc.):** These are request/response handling concerns, not domain logic.
- **HTTP clients (Axios, node-fetch, etc.):** These perform network I/O and depend on external services.

**Why not:** The domain layer doesn't make HTTP requests or handle HTTP responses. This is infrastructure handled by gateways in the adapters layer.

### Logging Libraries

- **Loggers (Winston, Pino, etc.):** Logging is an infrastructure concern, not a domain concern.

**Why not:** Domain logic should return values or throw domain errors. Logging where and when those errors occur is an infrastructure decision.

### Date/Time Libraries (with caveats)

- **Moment.js, Day.js, Luxon:** These are generally acceptable for date manipulation, but be cautious about timezone logic that might be infrastructure-specific.

**Why (mostly) acceptable:** Date and time logic is often core to business rules (for example, "orders placed before midnight qualify for same-day shipping"). Just be careful not to leak infrastructure assumptions (system timezone, clock drift) into the domain.

### Configuration Libraries

- **dotenv, config, etc.:** Configuration loading is an infrastructure concern.

**Why not:** The domain layer doesn't know about environment variables or configuration files. Configuration values are passed in as constructor parameters, not loaded directly.

---

## Evaluating New Libraries

When considering a new library for domain use, ask these questions:

### 1. Does it perform I/O or side effects?

If yes, it doesn't belong in the domain layer. Domain logic should be pure.

**Examples of I/O/side effects:**
- Database queries
- HTTP requests
- File system access
- Console logging
- Mutable global state

### 2. Is it stable and mature?

Check:
- How long has it been around?
- How many downloads per week? (npm stats)
- How active is maintenance? (last commit, open issues, release cadence)
- Is it widely used in production?

Prefer libraries with:
- 1+ years of active development
- 100k+ weekly downloads
- Regular maintenance and clear roadmaps
- Stable APIs with semantic versioning

### 3. Does it enhance correctness or reduce boilerplate?

The library should make domain logic safer, clearer, or more concise. It should solve a real problem, not just add a dependency for convenience.

**Good reasons:**
- Makes invariants more explicit (Zod schemas)
- Makes error handling safer (fp-ts Either, Effect)
- Reduces boilerplate for common patterns (ts-belt utilities)

**Bad reasons:**
- "It's trendy"
- "I like the API"
- "It saves a few lines of code" (without meaningful safety or clarity gains)

### 4. Does it introduce infrastructure coupling?

Even if a library claims to be "domain-friendly," check if it introduces hidden infrastructure dependencies.

**Warning signs:**
- Requires configuration at module import time (not passed as parameters)
- Depends on other libraries that perform I/O
- Assumes specific runtime environment (Node.js vs. browser vs. Deno)
- Ties your domain models to framework-specific patterns (decorators for ORM mapping, annotations for serialisation)

### 5. What's the cost if we need to remove it?

Consider:
- How deeply would the library be embedded in domain logic?
- How hard would it be to replace with native TypeScript or another library?
- Would removing it require rewriting business logic, or just refactoring utilities?

Prefer libraries that:
- Have narrow, well-defined APIs
- Don't require framework-specific patterns (decorators, magic)
- Could be wrapped in a thin abstraction layer if needed

---

## Practical Examples

### Example 1: Zod for Domain Validation

**Scenario:** You want to validate that a customer email is in a valid format.

**Without a library:**
```typescript
export class CustomerEmail {
  private constructor(public readonly value: string) {}

  static create(email: string): CustomerEmail {
    // Custom validation logic
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new InvalidCustomerEmailError(email);
    }
    return new CustomerEmail(email);
  }
}
```

**With Zod:**
```typescript
import { z } from "zod";

const EmailSchema = z.string().email();

export class CustomerEmail {
  private constructor(public readonly value: string) {}

  static create(email: string): CustomerEmail {
    const result = EmailSchema.safeParse(email);
    if (!result.success) {
      throw new InvalidCustomerEmailError(email);
    }
    return new CustomerEmail(email);
  }
}
```

**Why this is acceptable:**
- Zod performs validation (no I/O, no side effects).
- It makes the validation rules explicit and type-safe.
- It's stable, mature, and widely used.

### Example 2: Effect for Domain Operations

**Scenario:** You want to express that an operation might fail with a domain error.

**Without a library:**
```typescript
export class Order {
  cancel(): Order {
    if (this.status === OrderStatus.Shipped) {
      throw new CannotCancelShippedOrderError();
    }
    return new Order(this.id, this.items, OrderStatus.Cancelled);
  }
}
```

**With Effect:**
```typescript
import { Effect } from "effect";

export class Order {
  cancel(): Effect.Effect<Order, CannotCancelShippedOrderError> {
    if (this.status === OrderStatus.Shipped) {
      return Effect.fail(new CannotCancelShippedOrderError());
    }
    return Effect.succeed(new Order(this.id, this.items, OrderStatus.Cancelled));
  }
}
```

**Why this is acceptable:**
- Effect makes error handling explicit in the type system.
- It doesn't perform I/O (the domain operation is still pure).
- Calling code can choose how to handle the error (application layer concern).

### Example 3: Axios for HTTP Requests (NOT ACCEPTABLE)

**Scenario:** Your domain needs to validate a customer's address by calling an external API.

**Incorrect approach:**
```typescript
import axios from "axios";

export class Address {
  static async validate(address: string): Promise<boolean> {
    const response = await axios.post("https://api.validation.com/address", { address });
    return response.data.valid;
  }
}
```

**Why this is wrong:**
- The domain layer is performing I/O (HTTP request).
- It's coupled to an external service and a specific HTTP client.
- It can't be tested without mocking the HTTP client or running against the real API.

**Correct approach:**
```typescript
// Domain layer: define a port (interface)
export interface AddressValidator {
  validate(address: string): Promise<boolean>;
}

// Application layer: use the port
export class CustomerService {
  constructor(private readonly addressValidator: AddressValidator) {}

  async registerCustomer(dto: RegisterCustomerDTO): Promise<Customer> {
    const isValid = await this.addressValidator.validate(dto.address);
    if (!isValid) {
      throw new InvalidAddressError(dto.address);
    }
    // ... rest of logic
  }
}

// Adapters layer: implement the port
export class HttpAddressValidator implements AddressValidator {
  async validate(address: string): Promise<boolean> {
    const response = await axios.post("https://api.validation.com/address", { address });
    return response.data.valid;
  }
}
```

Now the domain layer doesn't know about HTTP, Axios, or external APIs. The infrastructure concern is pushed to the adapters layer where it belongs.

---

## When to Break the Rules

There are rare situations where pragmatism demands bending the policy:

### Legacy Codebases

If you're refactoring a legacy codebase, it may not be feasible to remove all external dependencies from the domain layer immediately. In this case:
- Prioritise removing infrastructure dependencies (databases, HTTP frameworks).
- Be intentional about which utility dependencies you keep.
- Plan a path to remove or wrap problematic dependencies over time.

### Very Small Projects

For a tiny prototype or proof-of-concept, strict layer separation might add more overhead than value. Use your judgement, but be aware that cutting corners early makes refactoring harder later.

### Performance-Critical Code

In rare cases, a library dependency might be significantly faster than a pure TypeScript implementation (for example, native date parsing). If performance is genuinely critical and profiling proves the dependency is necessary, consider:
- Wrapping the library in a thin abstraction to isolate it.
- Documenting the trade-off clearly.
- Revisiting the decision when performance is no longer critical.

---

## Summary

The domain layer should be as pure as practical, but strict purity isn't always the best trade-off. My policy is:

**Allow in the domain layer:**
- Purely functional libraries (Zod, ts-belt, fp-ts, Effect)
- Stable, mature libraries that enhance type safety and correctness
- Libraries with narrow scope and no infrastructure coupling

**Never allow in the domain layer:**
- Database libraries (ORMs, clients)
- HTTP libraries (frameworks, clients)
- Logging libraries
- Configuration loaders
- Any library that performs I/O or side effects

**Evaluate new libraries by asking:**
1. Does it perform I/O or side effects?
2. Is it stable and mature?
3. Does it enhance correctness or reduce boilerplate meaningfully?
4. Does it introduce infrastructure coupling?
5. What's the cost if we need to remove it?

In the next post, we'll explore domain configuration patterns: how to inject configuration values (pricing strategies, rate limits, business rules) from the composition root through the application layer into the domain layer, whilst keeping the domain pure.

---

## Further reading and resources

- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book) — explores the principles behind keeping the domain layer pure and dependency-free.
- [Functional Core, Imperative Shell (Gary Bernhardt)](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell) — a screencast exploring the benefits of keeping core logic pure and pushing side effects to the edges.
- [Domain Modeling Made Functional (Scott Wlaschin)](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/) (book) — practical guidance on modelling domains with pure functions and explicit error handling.
- [Zod](https://zod.dev/) — TypeScript-first schema validation library, ideal for domain invariants.
- [Effect](https://effect.website/) — type-safe effects and dependency injection for TypeScript.

---

## Glossary terms in this post

- [Domain layer](../glossary.md#domain-layer)
- [Clean Architecture](../glossary.md#clean-architecture)
- [Application layer](../glossary.md#application-layer)
- [Interface adapters layer](../glossary.md#interface-adapters-layer)
- [Ports and adapters](../glossary.md#ports-and-adapters)
- [Invariants](../glossary.md#invariants)
