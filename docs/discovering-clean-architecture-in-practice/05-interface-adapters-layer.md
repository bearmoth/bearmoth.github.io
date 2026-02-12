# The Interface Adapters Layer

Last updated 2025-12-09

**Topics:** interface adapters layer, adapters, repositories, HTTP servers, integration, side effects

The interface adapters layer is where we finally leave the world of pure logic and interfaces, and start dealing with the messy reality of databases, HTTP frameworks, external APIs, and all the other details that make software run. In this post, we'll look at what lives in the adapters layer and how it implements the contracts defined by the application layer.

---

## Series Navigation
- [Introduction](./01-introduction.md)
- [Architecture Overview](./02-architecture-overview.md)
- [The Domain Layer](./03-domain-layer.md)
- [The Application Layer](./04-application-layer.md)
- **[The Interface Adapters Layer](./05-interface-adapters-layer.md)** (current)
- [Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)

---

## What Lives in the Interface Adapters Layer

The interface adapters layer contains all the code that interacts with the outside world on behalf of our service. It's responsible for I/O, side effects, and integration with external systems. This includes:

### Database Repositories

Repositories handle persistence. They implement the repository interfaces (ports) defined by the application layer, translating between domain objects and database storage.

A repository might use an ORM, write raw SQL, or interact with a NoSQL database. The domain and application layers don't know or care. They depend on the repository interface, and adapters provide the implementation.

### Gateways and External API Clients

Gateways handle communication with external services. If your service needs to call a payment provider, send an email, or fetch data from a third-party API, that logic lives in the adapters layer.

Like repositories, gateways typically implement interfaces defined by the application layer. This keeps the application layer isolated from the specifics of HTTP clients, API authentication, and response parsing.

### HTTP and RPC Servers

HTTP servers (or RPC servers, or GraphQL servers) are part of the adapters layer. They handle routing, request parsing, response formatting, and all the other framework-specific concerns that surround exposing your service to the outside world.

A typical HTTP handler:
- Accepts a request.
- Parses and validates the request body.
- Maps the request to a DTO.
- Calls an application service (via its interface).
- Formats the result as an HTTP response.

The application layer doesn't know about HTTP status codes, headers, or routing. That's all adapters and framework infrastructure.

### Message Queue Subscribers and Workers

If your service subscribes to a message queue or runs background jobs, that logic lives in the adapters layer. Subscribers listen for messages, parse them, and invoke application services to handle the work.

Workers might poll for tasks, execute batch operations, or handle scheduled jobs. Like HTTP handlers, they translate external inputs into DTOs and delegate to the application layer.

### Configuration and Bootstrapping

Adapters code is also responsible for assembling the application. This includes reading configuration, wiring up dependencies, and creating instances of repositories, services, and handlers.

We'll cover this in more detail in the [next post on dependency inversion](./06-ports-and-adapters.md), but the key point is that adapters are where concrete implementations meet interfaces, and where everything gets connected.

---

## Dependency Rules for the Interface Adapters Layer

As covered in the [architecture overview](./02-architecture-overview.md), the adapters layer can import from:
- The adapters layer itself (shared utilities, configuration).
- The [application layer](./04-application-layer.md) (ports/interfaces, DTOs, application services).
- The [domain layer](./03-domain-layer.md) (models, domain errors).

Adapters are the only layer with visibility into all three. This makes sense: adapters need to know about domain models (to persist them), application interfaces (to implement them), and other adapter code (to share utilities).

---

## Containing the Mess

The interface adapters layer is inherently messy. It deals with unreliable networks, slow databases, external APIs with inconsistent behaviour, and frameworks with their own opinions about how code should be structured.

The goal isn't to eliminate that mess—it's to **contain** it. By keeping infrastructure at the outer edge of the architecture, we prevent it from leaking into the domain or application layers.

When you need to change databases, swap out an HTTP framework, or integrate with a new external API, you only touch infrastructure. The domain and application layers remain stable.

---

## A Practical Example

Here's a simplified example of a database repository in the infrastructure layer:

```typescript
// infrastructure/repositories/postgres-order-repository.ts
import { OrderRepository } from "../../application/ports/order-repository";
import { Order } from "../../domain/order";
import { Pool } from "pg";

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(order: Order): Promise<Order> {
    try {
      return await this.pool.query(
        "INSERT INTO orders (id, items, status) VALUES ($1, $2, $3)",
        [order.id, JSON.stringify(order.items), order.status]
      );
    } catch (error) {
      throw new RepositoryError("Failed to save order", error);
    };
  }

  async findById(id: OrderId): Promise<Order | null> {
    try {
      const result = await this.pool.query(
        "SELECT * FROM orders WHERE id = $1",
        [id]
      );
      if (result.rows.length === 0) return null;
      return this.mapRowToOrder(result.rows[0]);
    } catch(error) {
      throw new RepositoryError("Failed to fetch order", error);
    }
  }

  private mapRowToOrder(row: any): Order {
    // Map database row to domain model
    // ...
  }
}
```

Notice:
- The repository implements the `OrderRepository` interface from the application layer.
- It uses a specific database library (`pg` for PostgreSQL).
- It handles errors and converts them to domain-appropriate errors (`RepositoryError`).
- The domain and application layers have no knowledge of PostgreSQL, SQL queries, or the `pg` library.

If you later decide to switch to a different database, you create a new repository implementation. The rest of the codebase doesn't change.

---

## What Doesn't Belong Here

Even though infrastructure can import from all layers, not everything belongs here:

- **Business rules:** Those live in the domain layer.
- **Use-case orchestration:** That lives in the application layer.
- **Domain models:** Those are defined in the domain layer (though infrastructure uses them).

Infrastructure implements, integrates, and assembles. It doesn't define the rules or coordinate the logic.

---

## Looking Ahead

We've now covered all three layers—domain, application, and infrastructure. In the next post, we'll tie it all together by exploring the ports and adapters pattern in depth. We'll see how interfaces (ports) and implementations (adapters) enable dependency inversion, how driving and driven adapters differ, and how to assemble everything at runtime.

[<- Prev Article](./04-application-layer.md) | [Next Article ->](./06-ports-and-adapters.md)

---

## Further reading and resources

- [Repository Pattern (Martin Fowler)](https://martinfowler.com/eaaCatalog/repository.html) – a concise overview of the repository pattern and its role in persistence.
- [Adapter Pattern (Gang of Four)](https://refactoring.guru/design-patterns/adapter) – an explanation of the adapter pattern, which underpins much of infrastructure integration.
- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/) – the original source of the ports and adapters concept.

---

## Glossary terms in this post

- [Infrastructure layer](../glossary.md#infrastructure-layer)
- [Application layer](../glossary.md#application-layer)
- [Domain layer](../glossary.md#domain-layer)
- [Repository pattern](../glossary.md#repository-pattern)
- [Clean Architecture](../glossary.md#clean-architecture)
