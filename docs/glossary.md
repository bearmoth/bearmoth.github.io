# Glossary

This glossary collects recurring concepts, patterns and technologies that appear across posts in this blog. Each entry reflects how I use the term in practice, rather than a formal definition.

Entries are listed alphabetically by concept name.

## Bounded contexts

A way of carving a large domain into smaller, cohesive areas of language, rules and models. Each bounded context owns its own terminology and invariants, and only collaborates with others through explicit, well-designed boundaries.

In a monorepo that uses Clean Architecture, I want each bounded context to contain its own layers (domain, application, infrastructure) rather than sharing a single, bloated "core" across everything.

**How I use this**
- [Discovering Clean Architecture in a Legacy Monorepo](./discovering-clean-architecture-legacy-monorepo/01-introduction.md)

**Related concepts**
- [Monorepo](#monorepo)
- [Clean Architecture](#clean-architecture)

**External references**
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book)

## Clean Architecture

A set of principles for structuring code so that business and domain logic sit at the centre, insulated from infrastructure and frameworks. Dependencies point inwards towards the domain, making it easier to change details like databases, HTTP frameworks or messaging without rewriting core behaviour.

**How I use this**
- [Discovering Clean Architecture in a Legacy Monorepo](./discovering-clean-architecture-legacy-monorepo/01-introduction.md)

**Related concepts**
- [Bounded contexts](#bounded-contexts)
- [Monorepo](#monorepo)

**External references**
- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book)

## Effect

A TypeScript library for managing effects such as asynchronous work, dependency injection, and error handling in a principled way. Effect encourages explicit dependencies and makes it easier to compose complex behaviours while keeping the core logic testable.

**How I use this**
- [Discovering Clean Architecture in a Legacy Monorepo](./discovering-clean-architecture-legacy-monorepo/01-introduction.md)

**External references**
- [Effect documentation](https://effect.website/docs)

## Monorepo

A single repository that contains multiple applications, services and libraries. A monorepo can make it easier to share code and keep changes coordinated, but it also raises the stakes for architectural decisions: messy boundaries in one area can leak out and constrain the rest of the codebase.

**How I use this**
- [Discovering Clean Architecture in a Legacy Monorepo](./discovering-clean-architecture-legacy-monorepo/01-introduction.md)

**Related concepts**
- [Clean Architecture](#clean-architecture)
- [Bounded contexts](#bounded-contexts)

**External references**
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book)

## Vertical Slice Architecture

An approach to structuring code by feature, so that each "slice" contains everything it needs end-to-end: handlers, application logic, validation and persistence. The goal is to make each slice independently understandable and to keep dependencies between slices explicit.

In practice I treat Vertical Slice Architecture more as a way of thinking about flows and features than as the primary source-code structure, especially in a large monorepo.

**How I use this**
- [Discovering Clean Architecture in a Legacy Monorepo](./discovering-clean-architecture-legacy-monorepo/01-introduction.md)

**Related concepts**
- [Clean Architecture](#clean-architecture)
- [Bounded contexts](#bounded-contexts)

**External references**
- [Vertical Slice Architecture by Jimmy Bogard](https://jimmybogard.com/vertical-slice-architecture/)
