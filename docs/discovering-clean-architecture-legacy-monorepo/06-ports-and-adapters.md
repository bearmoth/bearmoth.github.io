# Ports, Adapters, and Dependency Inversion

Published on 2025-12-05

**Themes:** ports and adapters, hexagonal architecture, dependency inversion, dependency injection, composition root

We've explored the three layers—domain, application, and infrastructure—and established the dependency rules that keep business logic insulated from infrastructure. In this post, we'll look at the mechanism that makes it all work: the ports and adapters pattern. We'll see how interfaces (ports) and implementations (adapters) enable dependency inversion, how to distinguish driving from driven adapters, and how to assemble everything at runtime.

---

## Series Navigation
- [Introduction](./01-introduction.md)
- [Architecture Overview](./02-architecture-overview.md)
- [The Domain Layer](./03-domain-layer.md)
- [The Application Layer](./04-application-layer.md)
- [The Infrastructure Layer](./05-interface-adapters-layer.md)
- **[Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)** (current)

---

## The Seeming Paradox

In the [application layer post](./04-application-layer.md), we highlighted a paradox: application services need to persist data, call external APIs, and perform other infrastructure operations, but they can't depend on infrastructure code.

How do we square this circle?

The answer is **dependency inversion**. Instead of the application layer importing concrete infrastructure implementations, it defines **interfaces** (contracts) that describe what it needs. Infrastructure then provides **implementations** of those interfaces.

This is the essence of the ports and adapters pattern, also known as hexagonal architecture.

---

## Ports and Adapters: The Core Idea

In the ports and adapters pattern:

- A **port** is an interface that defines a contract. It describes what operations are available, without specifying how they're implemented.
- An **adapter** is a concrete implementation of a port. It handles the details: database queries, HTTP requests, message queue subscriptions, and so on.

The application layer defines ports and depends on them. Infrastructure provides adapters that implement those ports. At runtime, we wire up the ports to their adapters (dependency injection), and the application layer remains blissfully unaware of the infrastructure details.

---

## Driving vs Driven Adapters

Ports and adapters come in two flavours: **driving** (or primary) and **driven** (or secondary).

### Driven Adapters (Secondary Ports)

Driven adapters are what the application layer **uses** to interact with the outside world. Examples include:

- **Repositories:** Interfaces for persisting and retrieving domain objects.
- **Gateways:** Interfaces for calling external APIs.
- **Notification services:** Interfaces for sending emails or push notifications.

The application layer defines these interfaces (ports), and infrastructure provides the implementations (adapters). The flow is:

**Application → Port (interface) ← Adapter (infrastructure)**

For example:

```typescript
// application/ports/order-repository.ts
export interface OrderRepository {
  save(order: Order): Effect<void, RepositoryError>;
  findById(id: OrderId): Effect<Order | null, RepositoryError>;
}

// application/services/place-order-service.ts
export class PlaceOrderService {
  constructor(private readonly orderRepository: OrderRepository) {}
  
  execute(dto: PlaceOrderDTO): Effect<Order, ApplicationError> {
    const order = Order.create(dto.orderId, dto.items);
    return this.orderRepository.save(order).pipe(
      Effect.map(() => order)
    );
  }
}
```

The service depends on the `OrderRepository` **interface**, not on any specific database implementation. Infrastructure provides a `PostgresOrderRepository` (or `MongoOrderRepository`, or `InMemoryOrderRepository` for tests), but the service doesn't know or care which one it's using.

### Driving Adapters (Primary Ports)

Driving adapters are what **invoke** the application layer. Examples include:

- **HTTP handlers:** Routes that accept requests and call application services.
- **Message queue subscribers:** Listeners that handle messages and invoke use-cases.
- **CLI commands:** Entry points that trigger application logic.

For driving adapters, the port is typically the application service itself (or a facade that exposes use-cases). The adapter is the infrastructure code that calls the service.

The flow is:

**Adapter (infrastructure) → Port (application service)**

For example:

```typescript
// infrastructure/http-server/routes/place-order-route.ts
import { PlaceOrderService } from "../../../application/services/place-order-service";

export function createPlaceOrderRoute(placeOrderService: PlaceOrderService) {
  return async (req: Request, res: Response) => {
    const dto = req.body; // Assume validation happens earlier
    
    const result = await Effect.runPromise(placeOrderService.execute(dto));
    
    if (result.isSuccess) {
      res.status(201).json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  };
}
```

The HTTP route (driving adapter) depends on the `PlaceOrderService` (port). It translates HTTP requests into DTOs, calls the service, and formats the response.

---

## Why Driving Adapters Often Don't Need Explicit Ports

You might notice that for driving adapters, we don't always define a separate interface for the application service. The service itself acts as the port.

Why?

Pragmatically, what would we gain from abstracting an HTTP server behind an interface? In most cases, the HTTP server is already an implementation detail of infrastructure. We're not going to swap it out for a different kind of "caller" in the same runtime.

That said, if you have multiple entry points that need a unified interface (for example, an HTTP API and a CLI that both trigger the same use-cases), you might introduce a facade or interface to standardise access. But for most services, the application service is a sufficient port for driving adapters.

---

## Dependency Inversion in Practice

Let's look at a concrete example of how this plays out in import paths.

**Application layer defines a port:**

```typescript
// application/ports/order-repository.ts
export interface OrderRepository {
  save(order: Order): Effect<void, RepositoryError>;
  findById(id: OrderId): Effect<Order | null, RepositoryError>;
}
```

**Adapters provide an implementation:**

```typescript
// adapters/repositories/postgres-order-repository.ts
import { OrderRepository } from "../../application/ports/order-repository";
import { Order } from "../../domain/order";

export class PostgresOrderRepository implements OrderRepository {
  // ...implementation details
}
```

Notice the import direction:
- The adapter (`/adapters/repositories/postgres-order-repository.ts`) imports from the application layer (`/application/ports/order-repository.ts`).
- The application layer never imports from adapters.

This is dependency inversion in action. The dependency points from infrastructure (outer layer) to application (inner layer), even though the data flow at runtime might be from application to infrastructure (when the service calls the repository).

---

## Assembling the Layers: The Composition Root

We've defined ports and adapters, but how do we actually wire them together at runtime?

The answer is a **composition root** (or bootstrap/assembly layer). This is where you create instances of your adapters and inject them into your application services.

Here's a simplified example:

```typescript
// infrastructure/composition-root.ts
import { PlaceOrderService } from "../application/services/place-order-service";
import { PostgresOrderRepository } from "./repositories/postgres-order-repository";
import { createPlaceOrderRoute } from "./http-server/routes/place-order-route";
import { Pool } from "pg";

export function bootstrap() {
  // Create infrastructure dependencies
  const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const orderRepository = new PostgresOrderRepository(dbPool);
  
  // Create application services, injecting infrastructure
  const placeOrderService = new PlaceOrderService(orderRepository);
  
  // Create driving adapters (HTTP routes, etc.)
  const placeOrderRoute = createPlaceOrderRoute(placeOrderService);
  
  // Return or register routes
  return { placeOrderRoute };
}
```

The composition root:
- Creates concrete infrastructure dependencies (database connections, HTTP clients, etc.).
- Creates application services, passing in the concrete implementations of ports.
- Creates driving adapters (HTTP routes, message subscribers), passing in the application services.

This is the only place in the codebase where we explicitly wire together ports and adapters. Everywhere else, code depends on interfaces, not implementations.

In a more sophisticated setup, you might use a dependency injection container (like those provided by [Effect](../glossary.md#effect) or InversifyJS) to manage this wiring automatically. But the principle remains the same: dependencies are assembled at the edges, and the core remains isolated.

---

## A Brief Comparison: Ports & Adapters vs Strategy Pattern

If you're familiar with design patterns, you might notice a similarity between ports and adapters and the **Strategy pattern**. Both involve defining an interface and swapping implementations at runtime.

The difference is in scope and intent:

- **Strategy** is typically used within the domain layer to encapsulate algorithms or behaviours that can vary. For example, different pricing strategies for an order.
- **Ports and adapters** are used at the boundary between layers to decouple core logic from infrastructure. The "strategy" here is not a business rule, but an implementation detail (which database, which HTTP client, etc.).

Both patterns leverage polymorphism and dependency inversion, but they solve different problems. Strategy helps you model variability in domain behaviour. Ports and adapters help you keep infrastructure concerns from leaking into your domain.

---

## Looking Ahead

We've now covered the foundational ideas of Clean Architecture: the three layers, the dependency rules, and the ports and adapters pattern that ties it all together.

In future posts, I'll dive into more specific topics: how [Effect](../glossary.md#effect) simplifies dependency injection and error handling, how to structure bounded contexts in a monorepo, and how to test this architecture effectively.

For now, you have the map. The rest of the series will fill in the details.

---

## Further reading and resources

- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/) – the original description of the ports and adapters pattern.
- [Dependency Inversion Principle (Robert C. Martin)](https://web.archive.org/web/20110714224327/http://www.objectmentor.com/resources/articles/dip.pdf) – the foundational principle behind ports and adapters.
- [Dependency Injection (Martin Fowler)](https://martinfowler.com/articles/injection.html) – a detailed exploration of dependency injection patterns.
- [Effect documentation](https://effect.website/docs) – the library I use for dependency management and composition.

---

## Glossary terms in this post

- [Ports and adapters](../glossary.md#ports-and-adapters)
- [Dependency inversion](../glossary.md#dependency-inversion)
- [Application layer](../glossary.md#application-layer)
- [Infrastructure layer](../glossary.md#infrastructure-layer)
- [Repository pattern](../glossary.md#repository-pattern)
- [Clean Architecture](../glossary.md#clean-architecture)
- [Effect](../glossary.md#effect)
