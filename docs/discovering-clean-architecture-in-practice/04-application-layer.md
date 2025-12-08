# The Application Layer

Last updated 2025-12-09

**Themes:** application layer, use-cases, orchestration, anti-corruption layer, DTOs

The application layer sits between the domain and infrastructure. It's where use-cases live, where domain logic gets orchestrated to achieve specific goals, and where we start to express the need for infrastructure without directly depending on it. In this post, we'll explore what belongs in the application layer and how it keeps the domain pure while still getting real work done.

---

## Series Navigation
- [Introduction](./01-introduction.md)
- [Architecture Overview](./02-architecture-overview.md)
- [The Domain Layer](./03-domain-layer.md)
- **[The Application Layer](./04-application-layer.md)** (current)
- [The Infrastructure Layer](./05-interface-adapters-layer.md)
- [Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)

---

## What Lives in the Application Layer

The application layer is home to the logic that coordinates domain objects to fulfill use-cases. It doesn't contain business rules (those live in the domain), and it doesn't handle infrastructure details (those live in infrastructure). Instead, it sits in the middle, orchestrating the two.

### Use-Cases and Services

Use-cases (often implemented as "services") represent the operations your system supports. Examples might include "place an order," "cancel a subscription," or "generate a report."

Each use-case coordinates domain logic, applies application-level validation, and interacts with infrastructure (through interfaces) to persist data, send messages, or communicate with external systems.

A service in the application layer typically:
- Accepts input (often as a DTO).
- Validates that input at the application level (distinct from domain invariants).
- Retrieves domain objects from infrastructure (via repositories or other ports).
- Invokes domain methods to apply business rules.
- Persists the updated state back to infrastructure.
- Returns a result to the caller.

### Application Errors

Application errors represent failures at the orchestration level. These might include validation errors ("missing required field"), authorisation errors ("user not permitted"), or errors surfacing from domain logic.

Application errors are distinct from domain errors (which capture rule violations) and infrastructure errors (which capture I/O failures). By keeping these error types separate, you make it easier to handle them appropriately at different layers.

### Data Transfer Objects (DTOs)

DTOs are simple structures that carry data between layers. They're used to decouple the domain model from the format expected by external consumers (HTTP APIs, message queues, etc.).

For example, an HTTP handler might accept a JSON payload, convert it to a DTO, and pass that DTO to an application service. The service then maps the DTO to domain objects, applies business logic, and returns a result. DTOs act as a translation layer, keeping the domain model free from external concerns.

### Anti-Corruption Layer

When integrating with external systems or legacy code, the application layer often includes an anti-corruption layer. This is a set of adapters or translators that convert external models and protocols into terms your domain understands.

The anti-corruption layer prevents external concepts from leaking into your domain. If an external API uses different terminology or a legacy system has a messy data model, the anti-corruption layer handles the translation, so your domain remains clean and consistent.

---

## Dependency Rules for the Application Layer

As covered in the [architecture overview](./02-architecture-overview.md), the application layer can import from:
- The application layer itself (other services, DTOs, application errors).
- The [domain layer](./03-domain-layer.md) (models, domain logic, domain errors).

It **cannot** import from infrastructure. This is the key constraint that shapes how the application layer works.

---

## The Paradox: Needing Infrastructure Without Depending on It

Here's where things get interesting. Use-cases in the application layer need to interact with the outside world. They need to persist data, call external APIs, send emails, and so on. But the application layer can't depend on infrastructure code directly.

How do we resolve this?

The answer is **interfaces** (or "ports," in hexagonal architecture terminology). The application layer defines interfaces that describe what it needs from infrastructure, without knowing how those needs are fulfilled.

For example, an application service might need to save an order to a database. Instead of importing a concrete database repository (which would be an infrastructure dependency), the service depends on an interface:

```typescript
// application/ports/order-repository.ts
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
}
```

The service uses this interface, and infrastructure provides the implementation. We'll explore this pattern in detail in the [next post on ports and adapters](./06-ports-and-adapters.md).

For now, the key point is that the application layer expresses what it needs, and defers the "how" to infrastructure.

---

## What Doesn't Belong Here

To keep the application layer focused, it's worth being explicit about what doesn't belong:

- **Business rules and invariants:** Those belong in the domain layer.
- **Infrastructure details:** Database queries, HTTP requests, message queue subscriptions—those belong in infrastructure.
- **Presentation logic:** Formatting responses, rendering views, handling HTTP-specific concerns—those are infrastructure concerns (even if they feel "close" to the application layer).

The application layer orchestrates and coordinates. It doesn't contain the rules, and it doesn't handle the I/O.

---

## A Practical Example

Here's a simplified example of an application service that handles placing an order:

```typescript
// application/services/order-service.ts
import { OrderRepository } from "../ports/order-repository";
import { Order } from "../../domain/order";
import { PlaceOrderDTO } from "../dtos/place-order-dto";

export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  placeOrder(dto: PlaceOrderDTO): Promise<Order> {
    // Application-level validation
    if (dto.items.length === 0) {
      throw new ValidationError("Order must contain items");
    }

    // Create domain object (domain enforces invariants)
    const order = Order.create(dto.orderId, dto.items);

    // Persist via infrastructure port
    return this.orderRepository.save(order);
  }
}
```

Notice:
- The service accepts a DTO (decoupling from external input format).
- It performs application-level validation (not a domain invariant, but a use-case requirement).
- It creates a domain object (delegating business rules to the domain layer).
- It depends on `OrderRepository` (an interface), not a concrete implementation.

The application layer coordinates without containing business rules or infrastructure details.

---

## Looking Ahead

In the next post, we'll look at the infrastructure layer—the outermost layer where we finally interact with databases, HTTP frameworks, external APIs, and all the messy details that make software run in the real world.

[Next Article ->](./05-interface-adapters-layer.md)
[<- Prev Article](./03-domain-layer.md)

---

## Further reading and resources

- [Application Services in Domain-Driven Design (Vaughn Vernon)](https://vaughnvernon.com/) – practical guidance on structuring application services.
- [Use Case Driven Object Modeling](https://www.amazon.com/Use-Case-Driven-Object-Modeling/dp/1430243058) (book) – a detailed exploration of use-case-centric design.
- [Anti-Corruption Layer (Martin Fowler)](https://martinfowler.com/bliki/AnticorruptionLayer.html) – a short article on protecting your domain from external models.

---

## Glossary terms in this post

- [Application layer](../glossary.md#application-layer)
- [Domain layer](../glossary.md#domain-layer)
- [Anti-corruption layer](../glossary.md#anti-corruption-layer)
- [DTOs](../glossary.md#dtos)
- [Clean Architecture](../glossary.md#clean-architecture)
- [Dependency inversion](../glossary.md#dependency-inversion)
