# Glossary

This glossary collects recurring concepts, patterns and technologies that appear across posts in this blog. Each entry reflects how I use the term in practice, rather than a formal definition.

Entries are listed alphabetically by concept name.

## Anti-corruption layer

**Type:** Pattern

A translation layer that sits between your domain and external systems or legacy code. The anti-corruption layer converts external models, terminology, and protocols into terms your domain understands, preventing external concepts from leaking into your core logic.

This is particularly useful when integrating with legacy systems that have messy or inconsistent models, or when working with third-party APIs that use different terminology from your domain.

**How I use this**
- [The Application Layer](./discovering-clean-architecture-in-practice/04-application-layer.md)

**Related concepts**
- [Application layer](#application-layer)
- [Domain layer](#domain-layer)

**External references**
- [Anti-Corruption Layer (Martin Fowler)](https://martinfowler.com/bliki/AnticorruptionLayer.html)
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book)

## Application layer

**Type:** Layer

The middle layer in Clean Architecture, sitting between the domain and interface adapters/infrastructure. The application layer orchestrates domain logic to fulfill use-cases, defines what the service does (without knowing how adapters or infrastructure are implemented), and expresses infrastructure needs through interfaces (ports).

Application services coordinate domain objects, apply application-level validation, and interact with adapters and other infrastructure through dependency injection.

**How I use this**
- [Architecture Overview](./discovering-clean-architecture-in-practice/02-architecture-overview.md)
- [The Application Layer](./discovering-clean-architecture-in-practice/04-application-layer.md)
- [The Interface Adapters Layer](./discovering-clean-architecture-in-practice/05-interface-adapters-layer.md)
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-in-practice/06-ports-and-adapters.md)

**Related concepts**
- [Domain layer](#domain-layer)
- [Interface adapters layer](#interface-adapters-layer)
- [Clean Architecture](#clean-architecture)
- [Ports and adapters](#ports-and-adapters)

**External references**
- [The Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book)

## Bounded contexts

**Type:** Concept

A way of carving a large domain into smaller, cohesive areas of language, rules and models. Each bounded context owns its own terminology and invariants, and only collaborates with others through explicit, well-designed boundaries.

In a monorepo that uses Clean Architecture, I want each bounded context to contain its own layers (domain, application, interface adapters) rather than sharing a single, bloated "core" across everything.

**How I use this**
- [Discovering Clean Architecture in Practice](./discovering-clean-architecture-in-practice/01-introduction.md)

**Related concepts**
- [Monorepo](#monorepo)
- [Clean Architecture](#clean-architecture)

**External references**
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book)

## Clean Architecture

**Type:** Concept

A set of principles for structuring code so that business and domain logic sit at the centre, insulated from infrastructure and frameworks. Dependencies point inwards towards the domain, making it easier to change details like databases, HTTP frameworks or messaging without rewriting core behaviour.

**How I use this**
- [Discovering Clean Architecture in Practice](./discovering-clean-architecture-in-practice/01-introduction.md)
- [Architecture Overview](./discovering-clean-architecture-in-practice/02-architecture-overview.md)
- [The Domain Layer](./discovering-clean-architecture-in-practice/03-domain-layer.md)
- [The Application Layer](./discovering-clean-architecture-in-practice/04-application-layer.md)
- [The Interface Adapters Layer](./discovering-clean-architecture-in-practice/05-interface-adapters-layer.md)
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-in-practice/06-ports-and-adapters.md)

**Related concepts**
- [Bounded contexts](#bounded-contexts)
- [Monorepo](#monorepo)
- [Application layer](#application-layer)
- [Domain layer](#domain-layer)
- [Interface adapters layer](#interface-adapters-layer)

**External references**
- [The Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book)
- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/)

## Composition root (dependency injection)

**Type:** Pattern

The single place in a codebase (typically at application startup) where all dependencies are instantiated and wired together. The composition root creates instances of infrastructure adapters, injects them into application services, and connects application services to driving adapters (HTTP routes, message subscribers, etc.).

This is the only part of the codebase where concrete implementations are explicitly connected to interfaces. Everywhere else, code depends on abstractions. In more sophisticated setups, a dependency injection container can manage this wiring automatically, but the principle remains: dependencies are assembled in one place, at the "root" of the application.

**How I use this**
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-legacy-monorepo/06-ports-and-adapters.md)

**Related concepts**
- [Dependency injection](#dependency-injection)
- [Ports and adapters](#ports-and-adapters)
- [Interface adapters layer](#interface-adapters-layer)

**External references**
- [Dependency Injection (Martin Fowler)](https://martinfowler.com/articles/injection.html)
- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book)

## Definition (glossary type)

**Type:** Definition

An entry that explains what a glossary type or category means. Definitions describe meta-concepts about how we classify and understand the other entries in this glossary.

## Dependency injection

**Type:** Technique

A technique where a component receives its dependencies from the outside rather than creating them internally. Instead of a service constructing its own database connection or API client, those dependencies are passed in (injected) at construction time, typically via constructor parameters.

Dependency injection enables dependency inversion and makes code more testable: you can inject real implementations in production and test doubles (mocks, stubs) in tests. The composition root is where injection happens in practice.

**How I use this**
- [Discovering Clean Architecture in Practice](./discovering-clean-architecture-in-practice/01-introduction.md)
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-in-practice/06-ports-and-adapters.md)

**Related concepts**
- [Dependency inversion](#dependency-inversion)
- [Composition root](#composition-root)
- [Ports and adapters](#ports-and-adapters)

**External references**
- [Dependency Injection (Martin Fowler)](https://martinfowler.com/articles/injection.html)
- [Dependency Inversion Principle (Robert C. Martin)](https://web.archive.org/web/20110714224327/http://www.objectmentor.com/resources/articles/dip.pdf)

## Dependency inversion

**Type:** Principle

A principle where high-level modules (like application services) define interfaces for what they need, and low-level modules (like infrastructure) implement those interfaces. This inverts the typical dependency direction: instead of high-level code depending on low-level code, both depend on abstractions.

In Clean Architecture, dependency inversion is what allows the application layer to use infrastructure (repositories, gateways) without directly depending on infrastructure code. The application layer defines ports (interfaces), and infrastructure provides adapters (implementations).

**How I use this**
- [Architecture Overview](./discovering-clean-architecture-in-practice/02-architecture-overview.md)
- [The Application Layer](./discovering-clean-architecture-in-practice/04-application-layer.md)
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-in-practice/06-ports-and-adapters.md)

**Related concepts**
- [Ports and adapters](#ports-and-adapters)
- [Application layer](#application-layer)
- [Infrastructure layer](#infrastructure-layer)

**External references**
- [Dependency Inversion Principle (Robert C. Martin)](https://web.archive.org/web/20110714224327/http://www.objectmentor.com/resources/articles/dip.pdf)
- [Dependency Injection (Martin Fowler)](https://martinfowler.com/articles/injection.html)

## Domain layer

**Type:** Layer

The innermost layer in Clean Architecture, containing business rules, models, invariants, and pure domain logic. The domain layer has no dependencies on application or interface-adapter/infrastructure code—it only depends on itself.

This isolation keeps domain logic portable, testable, and insulated from infrastructure changes. When business requirements change, the domain layer changes. When infrastructure changes (databases, frameworks, external APIs), the domain layer remains stable.

**How I use this**
- [Architecture Overview](./discovering-clean-architecture-in-practice/02-architecture-overview.md)
- [The Domain Layer](./discovering-clean-architecture-in-practice/03-domain-layer.md)
- [The Application Layer](./discovering-clean-architecture-in-practice/04-application-layer.md)
- [The Interface Adapters Layer](./discovering-clean-architecture-in-practice/05-interface-adapters-layer.md)

**Related concepts**
- [Application layer](#application-layer)
- [Interface adapters layer](#interface-adapters-layer)
- [Clean Architecture](#clean-architecture)
- [Invariants](#invariants)

**External references**
- [The Domain Model Pattern (Martin Fowler)](https://martinfowler.com/eaaCatalog/domainModel.html)
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book)

## DTOs

**Type:** Pattern

Data Transfer Objects. Simple structures that carry data between layers or across boundaries (for example, between HTTP handlers and application services). DTOs decouple the domain model from external formats (JSON payloads, database rows, message queue events), keeping the domain free from external concerns.

DTOs typically live in the application layer, where they act as a translation layer between the outside world and the domain.

**How I use this**
- [The Application Layer](./discovering-clean-architecture-in-practice/04-application-layer.md)

**Related concepts**
- [Application layer](#application-layer)
- [Anti-corruption layer](#anti-corruption-layer)

**External references**
- [Data Transfer Object (Martin Fowler)](https://martinfowler.com/eaaCatalog/dataTransferObject.html)

## Entities (domain-driven design)

**Type:** Concept

Domain objects that have a distinct identity that persists over time, regardless of their attribute values. Two entities with the same data are still different if they have different identities. For example, two users with the same name are distinct people with different user IDs.

Entities typically encapsulate business rules, enforce invariants, and expose domain operations. Unlike value objects, entities are mutable (though changes should preserve invariants), and equality is based on identity rather than attributes.

**How I use this**
- [The Domain Layer](./discovering-clean-architecture-in-practice/03-domain-layer.md)

**Related concepts**
- [Value objects](#value-objects)
- [Domain layer](#domain-layer)
- [Invariants](#invariants)

**External references**
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book)
- [Domain Modeling Made Functional (Scott Wlaschin)](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/) (book)

## Effect

**Type:** Library

A TypeScript library for managing effects such as asynchronous work, dependency injection, and error handling in a principled way. Effect encourages explicit dependencies and makes it easier to compose complex behaviours while keeping the core logic testable.

**How I use this**
- [Discovering Clean Architecture in a Legacy Monorepo](./discovering-clean-architecture-legacy-monorepo/01-introduction.md)
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-legacy-monorepo/06-ports-and-adapters.md)

**External references**
- [Effect documentation](https://effect.website/docs)

## Gateways (architecture pattern)

**Type:** Pattern

Infrastructure components that handle communication with external services and third-party APIs. Gateways encapsulate the details of HTTP clients, API authentication, request/response parsing, and error handling, presenting a clean interface to the application layer.

Like repositories, gateways implement interfaces (ports) defined by the application layer. This keeps the application isolated from the specifics of how external systems are accessed. Examples include payment provider clients, email services, and third-party data sources.

**How I use this**
- [The Interface Adapters Layer](./discovering-clean-architecture-in-practice/05-interface-adapters-layer.md)
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-in-practice/06-ports-and-adapters.md)

**Related concepts**
- [Interface adapters layer](#interface-adapters-layer)
- [Ports and adapters](#ports-and-adapters)
- [Repository pattern](#repository-pattern)
- [Anti-corruption layer](#anti-corruption-layer)

**External references**
- [Gateway (Martin Fowler)](https://martinfowler.com/eaaCatalog/gateway.html)
- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/)

## Interface Segregation Principle

**Type:** Principle

The "I" in SOLID, stating that clients should not be forced to depend on interfaces they don't use. Instead of one large interface serving all clients, define multiple focused interfaces, each tailored to a specific client's needs.

In the context of bounded contexts, this principle guides us to create separate, focused ports for each consuming context rather than sharing a single, bloated interface. For example, if three contexts need customer data, each should define its own `CustomerPort` with only the methods it requires, rather than all three depending on a shared interface containing the union of all their needs.

**How I use this**
- [Bounded Contexts and Cross-Context Collaboration](./bounded-contexts-collaboration.md)

**Related concepts**
- [Ports and adapters](#ports-and-adapters)
- [Bounded contexts](#bounded-contexts)
- [Dependency inversion](#dependency-inversion)

**External references**
- [Interface Segregation Principle (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html)
- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book)

## Interface adapters layer

**Type:** Layer

The outermost layer in Clean Architecture that we own in our services, responsible for interacting with the outside world: databases, HTTP frameworks, external APIs, message queues, and all other I/O and side effects. Interface adapters implement the interfaces (ports) defined by the application layer and can import from all three layers.

The interface adapters layer contains the "messy details" that make software run in the real world, while keeping that mess contained at the edges of the architecture.

**How I use this**
- [Architecture Overview](./discovering-clean-architecture-in-practice/02-architecture-overview.md)
- [The Application Layer](./discovering-clean-architecture-in-practice/04-application-layer.md)
- [The Interface Adapters Layer](./discovering-clean-architecture-in-practice/05-interface-adapters-layer.md)
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-in-practice/06-ports-and-adapters.md)

**Related concepts**
- [Application layer](#application-layer)
- [Domain layer](#domain-layer)
- [Ports and adapters](#ports-and-adapters)
- [Repository pattern](#repository-pattern)

**External references**
- [The Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book)

## Invariants

**Type:** Concept

Constraints that must always hold true for a domain object to be in a valid state. Invariants are enforced at construction and mutation points in the domain layer. If an operation would violate an invariant, the domain rejects it, typically by returning a domain error.

Examples include "an order must have at least one item" or "a user's age must be non-negative." By encoding invariants in the domain layer, you make business rules explicit and prevent invalid states from propagating through the system.

**How I use this**
- [The Domain Layer](./discovering-clean-architecture-in-practice/03-domain-layer.md)

**Related concepts**
- [Domain layer](#domain-layer)

**External references**
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book)

## Layer (glossary type)

**Type:** Definition

A structural part of an architecture that groups related responsibilities, concerns, or code. Layers are a way to organise software into horizontal sections, each with a specific role (for example, domain layer, application layer, infrastructure layer). While layers are architectural concepts, calling them out as a distinct type helps clarify when an entry describes a structural section of an architecture rather than a more general or abstract idea.

## Monorepo

**Type:** Concept

A single repository that contains multiple applications, services and libraries. A monorepo can make it easier to share code and keep changes coordinated, but it also raises the stakes for architectural decisions: messy boundaries in one area can leak out and constrain the rest of the codebase.
## Pattern (glossary type)

**Type:** Definition

A reusable solution or approach to a recurring problem in software design. Patterns describe a general structure or technique that can be applied in different contexts. Examples include anti-corruption layer, repository pattern, ports and adapters, and composition root. Patterns often embody or enable principles.

## Principle (glossary type)

**Type:** Definition

A fundamental design or architectural guideline that informs how code should be structured. Principles are more abstract than patterns—they describe the "why" and the desired properties of good design rather than the "how". Examples include dependency inversion and the SOLID principles. Principles are typically implemented through specific techniques and patterns.

## Shared kernel (domain-driven design)

**Type:** Concept

A deliberate, explicitly owned set of domain concepts that is shared between two or more bounded contexts. A shared kernel is more than a "common" or "utils" module: it has a clear purpose, limited scope, and a small set of collaborators who agree to evolve it carefully.

Used well, a shared kernel captures genuinely shared language and rules (for example, a core customer identity model) without turning into a dumping ground. Used poorly, it becomes an accidental, overgrown dependency that couples contexts too tightly and makes change harder.

**Related concepts**
- [Bounded contexts](#bounded-contexts)
- [Domain layer](#domain-layer)

## Strategy pattern (design pattern)

**Type:** Pattern

A behavioural design pattern where you define a family of algorithms behind a common interface and select which implementation to use at runtime. Each strategy encapsulates a different way of performing some piece of work, and the caller depends only on the interface, not on any specific implementation.

In domain-driven design, strategies are often used inside the domain layer to model varying business behaviours (for example, different pricing or discount policies) without scattering `if/else` logic throughout the codebase. This is conceptually similar to ports and adapters, but focused on domain behaviour rather than infrastructure integration.

**Related concepts**
- [Domain layer](#domain-layer)
- [Ports and adapters](#ports-and-adapters)

## Vertical Slice Architecture

**Type:** Concept

An approach to structuring code by feature, so that each "slice" contains everything it needs end-to-end: handlers, application logic, validation and persistence. The goal is to make each slice independently understandable and to keep dependencies between slices explicit.

In practice I treat Vertical Slice Architecture more as a way of thinking about flows and features than as the primary source-code structure, especially in a large monorepo.

**How I use this**
- [Discovering Clean Architecture in Practice](./discovering-clean-architecture-in-practice/01-introduction.md)

**Related concepts**
- [Clean Architecture](#clean-architecture)
- [Bounded contexts](#bounded-contexts)

**External references**
- [Vertical Slice Architecture by Jimmy Bogard](https://jimmybogard.com/vertical-slice-architecture/)

## Ports and adapters (hexagonal architecture)

**Type:** Pattern

A pattern where the application layer defines interfaces (ports) that describe what it needs from infrastructure, and infrastructure provides implementations (adapters) of those interfaces. This enables dependency inversion and keeps core logic isolated from infrastructure details.

Ports come in two flavours: driven (secondary) ports are used by the application to interact with the outside world (repositories, gateways), and driving (primary) ports are entry points that invoke the application (HTTP handlers, message subscribers).

**How I use this**
- [The Application Layer](./discovering-clean-architecture-in-practice/04-application-layer.md)
- [The Infrastructure Layer](./discovering-clean-architecture-in-practice/05-interface-adapters-layer.md)
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-in-practice/06-ports-and-adapters.md)

**Related concepts**
- [Dependency inversion](#dependency-inversion)
- [Application layer](#application-layer)
- [Infrastructure layer](#infrastructure-layer)

**External references**
- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book)

## Repository pattern (data access)

**Type:** Pattern

A pattern where data access logic is encapsulated behind an interface that mimics a collection of domain objects. Repositories handle the translation between domain models and database storage, allowing the domain and application layers to work with objects without knowing how they're persisted.

In Clean Architecture, repository interfaces (ports) are defined in the application layer, and concrete implementations (adapters) live in the infrastructure layer.

**How I use this**
- [The Interface Adapters Layer](./discovering-clean-architecture-in-practice/05-interface-adapters-layer.md)
- [Ports, Adapters, and Dependency Inversion](./discovering-clean-architecture-in-practice/06-ports-and-adapters.md)

**Related concepts**
- [Interface adapters layer](#interface-adapters-layer)
- [Ports and adapters](#ports-and-adapters)

**External references**
- [Repository Pattern (Martin Fowler)](https://martinfowler.com/eaaCatalog/repository.html)
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book)

## Value objects (domain-driven design)

**Type:** Concept

Domain objects that are defined entirely by their attributes and have no distinct identity. Two value objects with the same data are considered equal and interchangeable. For example, two instances of "5 pounds sterling" represent the same value, regardless of where they came from.

Value objects are typically immutable. Operations on value objects return new instances rather than modifying existing ones. This makes them safe to share across contexts and easier to reason about in domain logic.

**How I use this**
- [The Domain Layer](./discovering-clean-architecture-in-practice/03-domain-layer.md)

**Related concepts**
- [Entities](#entities)
- [Domain layer](#domain-layer)

**External references**
- [Value Object (Martin Fowler)](https://martinfowler.com/bliki/ValueObject.html)
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book)

## Vertical Slice Architecture