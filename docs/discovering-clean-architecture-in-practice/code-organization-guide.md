# Code Organization Guide: Structuring Clean Architecture Projects

Last updated 2025-12-11

**Topics:** code organization, project structure, naming conventions, clean architecture, bounded contexts, file layout

Clear, consistent code organisation makes it easier to navigate a codebase, understand where new code should go, and maintain architectural boundaries over time. In this post, I'll share the directory structure conventions, naming patterns, and organisational principles I use when structuring Clean Architecture projects with bounded contexts.

This guidance is based on the reference implementation in `examples/01-clean-code-arch-simple/`, but the patterns apply more broadly to any TypeScript monorepo or standalone service using Clean Architecture.

---

## High-Level Structure

The top-level directory structure reflects Clean Architecture's three main layers:

```
src/
  composition-root.ts
  index.ts
  domain/
  application/
  adapters/
```

**Key principles:**
- Each layer is a top-level directory under `src/`.
- Bounded contexts are organised within layers, not the other way around.
- The composition root lives at the top level, since it's where all layers come together.

---

## Domain Layer Structure

The domain layer contains pure business logic, models, and invariants. Each bounded context has its own subdirectory:

```
src/
  domain/
    customer/
      customer.ts
      customer-id.ts
      customer-name.ts
      customer-email.ts
      index.ts
      errors/
        invalid-customer-email-error.ts
        index.ts
    orders/
      order.ts
      order-id.ts
      order-item.ts
      order-status.ts
      index.ts
      errors/
        invalid-order-error.ts
        cannot-cancel-shipped-order-error.ts
        index.ts
    index.ts
```

### Naming Conventions

- **Domain models:** Singular, PascalCase (for example, `Customer`, `Order`, `OrderItem`).
- **Value objects:** PascalCase, descriptive (for example, `CustomerId`, `CustomerName`, `OrderStatus`).
- **Errors:** PascalCase, suffix with `Error` (for example, `InvalidOrderError`, `CannotCancelShippedOrderError`).

### Subdirectories

- **`errors/`**: Contains domain-specific error classes. Always present when a context defines domain errors.
- **`index.ts`**: Exports public types and functions from the context. Consumers import from the context directory, not individual files.

### When to Create a New File

- Each domain model (entity or aggregate) gets its own file.
- Each value object gets its own file.
- Each domain error gets its own file within `errors/`.

**Avoid:**
- Putting multiple unrelated models in the same file.
- Creating deeply nested subdirectories (for example, `domain/customer/models/entities/`). Keep the structure flat within each context.

---

## Application Layer Structure

The application layer contains use-cases, orchestration logic, and interfaces (ports). Each bounded context has its own subdirectory:

```
src/
  application/
    customer/
      customer-service.ts
      index.ts
      dtos/
        register-customer-dto.ts
        get-customer-dto.ts
        index.ts
      ports/
        customer-repository.ts
        index.ts
    orders/
      order-service.ts
      index.ts
      dtos/
        place-order-dto.ts
        cancel-order-dto.ts
        index.ts
      ports/
        order-repository.ts
        customer-port.ts
        index.ts
      errors/
        customer-not-found-error.ts
        order-not-found-error.ts
        validation-error.ts
        index.ts
    index.ts
```

### Naming Conventions

- **Services:** PascalCase, suffix with `Service` (for example, `CustomerService`, `OrderService`).
- **DTOs:** PascalCase, suffix with `DTO` (for example, `PlaceOrderDTO`, `RegisterCustomerDTO`).
- **Ports (interfaces):** PascalCase, descriptive (for example, `CustomerRepository`, `OrderRepository`, `CustomerPort`).
- **Application errors:** PascalCase, suffix with `Error` (for example, `CustomerNotFoundError`, `ValidationError`).

### Subdirectories

- **`dtos/`**: Contains Data Transfer Objects for the context. Always present when a context defines application services that accept or return DTOs.
- **`ports/`**: Contains interface definitions (ports) for infrastructure dependencies. Always present when a context needs infrastructure (repositories, gateways, etc.).
- **`errors/`**: Contains application-level errors (distinct from domain errors). Present when the context has application-specific error conditions.
- **`index.ts`**: Exports public services, DTOs, ports, and errors.

### When to Create a New File

- Each application service gets its own file.
- Each DTO gets its own file within `dtos/`.
- Each port interface gets its own file within `ports/`.
- Each application error gets its own file within `errors/`.

**Avoid:**
- Putting multiple services in the same file (unless they're tightly coupled and unlikely to diverge).
- Combining ports and DTOs in the same file.

---

## Adapters Layer Structure

The adapters layer contains implementations of ports, HTTP handlers, database clients, and other infrastructure. Each bounded context typically has its own subdirectory, but shared infrastructure (for example, database connections) may live at the top level:

```
src/
  adapters/
    database/
      postgres-connection.ts
      index.ts
    customer/
      index.ts
      http/
        customer-routes.ts
        index.ts
      repositories/
        in-memory-customer-repository.ts
        postgres-customer-repository.ts
        index.ts
    orders/
      index.ts
      customer-service-adapter.ts
      http/
        order-routes.ts
        index.ts
      repositories/
        postgres-order-repository.ts
        index.ts
      errors/
        repository-error.ts
        index.ts
    index.ts
```

### Naming Conventions

- **Repositories:** PascalCase, prefix with implementation type, suffix with `Repository` (for example, `PostgresCustomerRepository`, `InMemoryOrderRepository`).
- **Gateways:** PascalCase, suffix with `Gateway` or `Client` (for example, `PaymentGateway`, `EmailClient`).
- **HTTP routes:** kebab-case for files, PascalCase for route functions (for example, file: `customer-routes.ts`, function: `registerCustomerRoutes`).
- **Adapters:** PascalCase, descriptive, suffix with `Adapter` (for example, `CustomerServiceAdapter`).
- **Errors:** PascalCase, suffix with `Error` (for example, `RepositoryError`).

### Subdirectories

- **`database/`**: Shared database infrastructure (connection pools, clients). Present when multiple contexts share database access.
- **`http/`**: HTTP route handlers and controllers for the context. Always present when a context exposes HTTP endpoints.
- **`repositories/`**: Repository implementations for the context. Always present when a context persists data.
- **`gateways/`**: Gateway implementations for external APIs. Present when a context integrates with external services.
- **`errors/`**: Infrastructure-specific errors (for example, database errors, network errors). Present when the context has adapter-specific error conditions.
- **`index.ts`**: Exports public adapters and implementations.

### When to Create a New File

- Each repository implementation gets its own file within `repositories/`.
- Each gateway implementation gets its own file within `gateways/`.
- Each set of related HTTP routes gets its own file within `http/` (for example, all customer routes in `customer-routes.ts`).
- Each cross-context adapter (for example, adapters that wrap other contexts' services) gets its own file at the context level.

**Avoid:**
- Mixing HTTP routes for different contexts in the same file.
- Putting repository and gateway implementations in the same file.
- Creating deeply nested subdirectories (for example, `adapters/customer/repositories/postgres/implementations/`).

---

## Gateway Naming and Placement

Gateways handle communication with external services and third-party APIs. They follow similar conventions to repositories but represent outbound dependencies rather than data persistence.

### Naming

- **Gateway interfaces:** Defined in `application/{context}/ports/`, suffixed with `Gateway` (for example, `PaymentGateway`, `EmailGateway`).
- **Gateway implementations:** Defined in `adapters/{context}/gateways/`, prefixed with implementation type, suffixed with `Gateway` (for example, `StripePaymentGateway`, `SendGridEmailGateway`).

### Example Structure

```
src/
  application/
    billing/
      ports/
        payment-gateway.ts
        index.ts
  adapters/
    billing/
      gateways/
        stripe-payment-gateway.ts
        mock-payment-gateway.ts
        index.ts
```

**Why separate implementations?**
- Allows you to swap implementations easily (Stripe vs. PayPal, SendGrid vs. Mailgun).
- Supports testing with mock implementations without production dependencies.
- Follows the same pattern as repositories: interface in `application/`, implementation in `adapters/`.

---

## Shared Infrastructure

Some infrastructure is shared across contexts, such as database connection pools, HTTP clients, or logging utilities. These live in top-level subdirectories within `adapters/`:

```
src/
  adapters/
    database/
      postgres-connection.ts
      index.ts
    http-client/
      axios-client.ts
      index.ts
    logging/
      winston-logger.ts
      index.ts
```

**Key principle:** Shared infrastructure should be generic and context-agnostic. If an infrastructure component contains business logic or context-specific knowledge, it belongs in a context subdirectory, not in shared infrastructure.

**Example:**
- ✅ `adapters/database/postgres-connection.ts` — generic connection pool, shared across contexts.
- ❌ `adapters/database/customer-order-query-helper.ts` — context-specific, should live in `adapters/customer/` or `adapters/orders/`.

---

## Composition Root

The composition root lives at the top level of `src/` and is responsible for wiring together all dependencies:

```
src/
  composition-root.ts
  index.ts
```

**Typical content:**
- Instantiate infrastructure adapters (repositories, gateways, HTTP clients).
- Instantiate application services, injecting their dependencies.
- Wire HTTP routes, passing in application services.
- Return the configured application (for example, a Hono app, Express app).

**Example:**
```typescript
// composition-root.ts
import { Pool } from "pg";
import { Hono } from "hono";
import { CustomerService } from "./application/customer";
import { OrderService } from "./application/orders";
import { PostgresCustomerRepository } from "./adapters/customer/repositories";
import { PostgresOrderRepository } from "./adapters/orders/repositories";
import { CustomerServiceAdapter } from "./adapters/orders/customer-service-adapter";
import { customerRoutes } from "./adapters/customer/http";
import { orderRoutes } from "./adapters/orders/http";

export function createApp(databasePool: Pool): Hono {
  // Instantiate adapters
  const customerRepository = new PostgresCustomerRepository(databasePool);
  const orderRepository = new PostgresOrderRepository(databasePool);

  // Instantiate services
  const customerService = new CustomerService(customerRepository);
  const customerServiceAdapter = new CustomerServiceAdapter(customerService);
  const orderService = new OrderService(orderRepository, customerServiceAdapter);

  // Wire HTTP routes
  const app = new Hono();
  app.route("/customers", customerRoutes(customerService));
  app.route("/orders", orderRoutes(orderService));

  return app;
}
```

---

## Index Files and Exports

Each context and subdirectory should have an `index.ts` file that exports public types, functions, and classes. This keeps import paths clean and encapsulates internal implementation details.

**Example:**
```typescript
// application/orders/index.ts
export * from "./order-service";
export * from "./dtos";
export * from "./ports";
export * from "./errors";

// Consumers import from the context:
import { OrderService, PlaceOrderDTO, OrderRepository } from "./application/orders";
```

**Benefits:**
- Shorter, cleaner import paths.
- Internal implementation details remain hidden (consumers don't import from nested files directly).
- Easier to refactor: you can reorganise files within a context without breaking external imports.

**Avoid:**
- Deep import paths like `import { OrderService } from "./application/orders/services/order-service"`.
- Exporting everything indiscriminately. Only export what external consumers need.

---

## When to Create New Subdirectories

As your codebase grows, you'll need to decide when to create new subdirectories vs. adding files to existing ones.

### Guidelines

- **Create a new context subdirectory** when you've identified a new bounded context with its own domain model, application logic, and adapters.
- **Create `dtos/`, `ports/`, `errors/` subdirectories** when you have more than 2-3 files of that type in a context.
- **Create `http/`, `repositories/`, `gateways/` subdirectories** in adapters when you have multiple implementations or routes for a context.
- **Avoid** creating subdirectories for a single file. If you only have one DTO, keep it at the context level until you add more.

**Example progression:**

**Initial structure (one DTO, one port):**
```
application/
  orders/
    order-service.ts
    place-order-dto.ts
    order-repository.ts
    index.ts
```

**After adding more DTOs and ports:**
```
application/
  orders/
    order-service.ts
    index.ts
    dtos/
      place-order-dto.ts
      cancel-order-dto.ts
      get-order-dto.ts
      index.ts
    ports/
      order-repository.ts
      payment-gateway.ts
      index.ts
```

**Key principle:** Structure evolves with the code. Don't create deep hierarchies upfront; add subdirectories as the need arises.

---

## Common Pitfalls

### Pitfall 1: Context Directories Outside Layers

Some teams organise by context first, then by layer:
```
src/
  customer/
    domain/
    application/
    adapters/
  orders/
    domain/
    application/
    adapters/
```

This structure makes it harder to enforce Clean Architecture's dependency rules (domain can't import from application, application can't import from adapters). Tooling and linters typically work better with layer-first organisation.

**Solution:** Organise by layer first, then by context within each layer.

### Pitfall 2: Shared "Common" or "Core" Directories

Creating a `src/common/` or `src/core/` directory for shared code often leads to horizontal bloat: the directory becomes a dumping ground for anything that "might be reused," and contexts start depending on it heavily.

**Solution:**
- Shared infrastructure (database connections, HTTP clients) goes in `adapters/database/`, `adapters/http-client/`, etc.
- Shared domain concepts that genuinely span contexts go in a [shared kernel](../glossary.md#shared-kernel-domain-driven-design) with explicit ownership and narrow scope.
- Most "shared" code should actually be duplicated across contexts or refactored into a proper abstraction.

### Pitfall 3: Deep Nesting

Creating directories like `adapters/customer/repositories/implementations/postgres/` adds navigation overhead without meaningful benefit.

**Solution:** Keep directory structures flat within contexts. Use descriptive file names instead of directory hierarchies.

### Pitfall 4: Inconsistent Naming

Mixing naming conventions (for example, `CustomerRepo` vs. `CustomerRepository`, `orderService` vs. `OrderService`) makes the codebase harder to navigate and understand.

**Solution:** Establish naming conventions early and enforce them through linting and code review.

---

## Summary

Clear code organisation supports Clean Architecture's goals: maintainable layers, clear context boundaries, and explicit dependencies. The key patterns are:

- **Layer-first structure:** Top-level directories for `domain/`, `application/`, `adapters/`.
- **Contexts within layers:** Each bounded context has its own subdirectory within each layer.
- **Consistent subdirectories:** Use `dtos/`, `ports/`, `errors/`, `http/`, `repositories/`, `gateways/` with consistent naming.
- **Flat hierarchies:** Avoid deep nesting; use descriptive file names instead.
- **Index files:** Export public types from `index.ts` in each context and subdirectory.
- **Evolving structure:** Add subdirectories as needed, not upfront.

These conventions make it easier to navigate the codebase, understand where new code belongs, and maintain architectural boundaries as the project grows.

In the next post, we'll explore the policy for external library dependencies in the domain layer: when to allow them, when to avoid them, and how to evaluate new libraries for domain use.

---

## Further reading and resources

- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book) — explores layered architecture and how to structure codebases around dependency rules.
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book) — includes guidance on organising code around bounded contexts.
- [Package Principles (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2014/05/12/TheOpenClosedPrinciple.html) — principles for organising packages and modules in a codebase.

---

## Glossary terms in this post

- [Clean Architecture](../glossary.md#clean-architecture)
- [Bounded contexts](../glossary.md#bounded-contexts)
- [Domain layer](../glossary.md#domain-layer)
- [Application layer](../glossary.md#application-layer)
- [Interface adapters layer](../glossary.md#interface-adapters-layer)
- [Repository pattern](../glossary.md#repository-pattern-data-access)
- [Gateways](../glossary.md#gateways-architecture-pattern)
- [DTOs](../glossary.md#dtos)
- [Ports and adapters](../glossary.md#ports-and-adapters)
- [Composition root](../glossary.md#composition-root-dependency-injection)
- [Shared kernel](../glossary.md#shared-kernel-domain-driven-design)
