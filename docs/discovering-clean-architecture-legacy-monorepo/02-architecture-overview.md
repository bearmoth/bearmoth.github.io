# Clean Architecture: A High-Level Map

Published on 2025-12-05

**Themes:** clean architecture, layered architecture, dependency rules, separation of concerns, software design

In this post, I'll step back from the introduction and give you a high-level map of the Clean Architecture approach I'm using for new services in this monorepo. We'll look at the three main layers—domain, application, and infrastructure—and establish the dependency rules that hold everything together. This is the foundation we'll build on in the rest of the series.

---

## Series Navigation
- [Introduction](./01-introduction.md)
- **[Architecture Overview](./02-architecture-overview.md)** (current)
- [The Domain Layer](./03-domain-layer.md)
- [The Application Layer](./04-application-layer.md)
- [The Infrastructure Layer](./05-infrastructure-layer.md)
- [Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)

---

## The Three Layers

[Clean Architecture](../glossary.md#clean-architecture) organises code into concentric layers, with dependencies pointing inward towards the core business logic. In the services I'm building, that translates to three main layers:

### Domain

The innermost layer. This is where the business rules, models, and invariants live. Domain code is pure: it doesn't know about databases, HTTP frameworks, or any other infrastructure concerns. It only depends on itself.

### Application

The orchestration layer. Application code coordinates domain logic to fulfill use-cases. It defines what the service does, without knowing how infrastructure details are implemented. This layer depends on the domain layer, but not on infrastructure.

### Infrastructure

The outermost layer. This is where we interact with the outside world: databases, HTTP servers, message queues, external APIs, and so on. Infrastructure code depends on both the application and domain layers, implementing the contracts those layers define.

![Clean Architecture layers diagram – placeholder]

---

## Dependency Rules

The key principle behind Clean Architecture is that **dependencies point inward**. Outer layers can depend on inner layers, but inner layers never depend on outer layers. This keeps the core business logic insulated from volatile infrastructure details.

Here's how that plays out in practice:

### Domain Layer Dependencies

The domain layer can only import from other domain code. It has zero dependencies on application or infrastructure.

This restriction keeps domain logic pure and portable. If you need to change databases, switch HTTP frameworks, or even port the service to a different language, the domain layer shouldn't need to change.

### Application Layer Dependencies

The application layer can import from:
- The application layer itself (other services, DTOs, application errors)
- The domain layer (models, domain logic, domain errors)

It **cannot** import from infrastructure. When the application layer needs infrastructure (for example, to persist data or call an external API), it expresses that need through an interface (a "port"), which infrastructure will implement.

### Infrastructure Layer Dependencies

The infrastructure layer can import from:
- The infrastructure layer itself (shared utilities, configuration)
- The application layer (ports/interfaces, DTOs, application services)
- The domain layer (models, errors)

Infrastructure is the only layer allowed to reach across all three. This makes sense: infrastructure is where we wire everything together, so it needs visibility into the contracts defined by application and the models defined by domain.

![Dependency flow diagram – placeholder]

---

## Why These Rules Matter

At first glance, these dependency rules might feel restrictive. Why not let the domain layer directly call a repository? Why force the application layer to define interfaces instead of just importing what it needs?

The answer is resilience to change. In a legacy monorepo, change is constant. Databases get migrated, APIs evolve, infrastructure patterns shift. By keeping dependencies pointing inward, we isolate the core business logic from those changes.

When you need to swap out a database or change how you handle external API calls, you only modify infrastructure. The domain and application layers don't need to know or care. That isolation saves time, reduces risk, and makes the codebase easier to reason about as it grows.

---

## A Note on Import Paths

In practical terms, these dependency rules show up in your import statements. For example:

- A file in `/domain/` should never import from `/application/` or `/infrastructure/`.
- A file in `/application/` can import from `/domain/`, but not from `/infrastructure/`.
- A file in `/infrastructure/` can import from both `/application/` and `/domain/`.

These aren't just conventions; they're constraints you can enforce with linters or build-time checks. Making the rules explicit and automated helps keep the architecture intact as the codebase evolves.

---

## Looking Ahead

In the next post, we'll zoom in on the domain layer. We'll look at what actually lives there—models, invariants, domain errors, and pure business logic—and why keeping this layer isolated is worth the effort.

---

## Further reading and resources

- [The Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) – the original blog post outlining the layered approach and dependency rules.
- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book) – a comprehensive exploration of the principles behind the pattern.
- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/) – another perspective on isolating core logic from infrastructure, closely related to Clean Architecture.

---

## Glossary terms in this post

- [Clean Architecture](../glossary.md#clean-architecture)
- [Domain layer](../glossary.md#domain-layer)
- [Application layer](../glossary.md#application-layer)
- [Infrastructure layer](../glossary.md#infrastructure-layer)
- [Dependency inversion](../glossary.md#dependency-inversion)
