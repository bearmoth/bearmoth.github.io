# Discovering Clean Architecture in Practice

Last updated 2025-12-08

**Themes:** clean architecture, vertical slice architecture, bounded contexts, Effect

Welcome to the first post in my series on refining and applying [clean architecture](../../glossary.md#clean-architecture) patterns while building new services in a TypeScript [monorepo](../../glossary.md#monorepo). I’ll document how I surface improved patterns, integrate with existing libraries (including legacy ones), and evolve architectural decisions in contexts that don’t start from a blank slate.

Across the series, we'll follow a modest but realistic PoC service as a reference implementation. We'll revisit it in each post, refine the design, and use it to explore:
- How Clean Architecture's layers map onto day-to-day TypeScript services
- Where vertical slices help and where they add friction
- How bounded contexts shape the way we structure services in a monorepo
- How [Effect](https://effect.website/) helps with dependency injection, error handling and composition

The goal is not to present a perfect end state, but to show how these patterns behave under real constraints and trade-offs.

> **Disclaimer:** This service and its design are very much a work in progress. I’m still uncovering constraints, surfacing awkward edges in existing codebases (including a legacy monorepo), and experimenting with how far these patterns will stretch before they become painful. Wherever something is unresolved, I’ll call it out explicitly so you can see both what is working and what still feels uncertain.

---

## Series Navigation
- **[Introduction](./01-introduction.md)** (current)
- [Architecture Overview](./02-architecture-overview.md)
- [The Domain Layer](./03-domain-layer.md)
- [The Application Layer](./04-application-layer.md)
- [The Interface Adapters Layer](./05-interface-adapters-layer.md)
- [Ports, Adapters, and Dependency Inversion](./06-ports-and-adapters.md)

---

## Motivation and Goals

Part of my motivation for writing this series is to find a calmer, more structured way to talk about new architectural ideas without feeling like the Charlie Day conspiracy meme, gesturing at a wall of string and arrows. Capturing the journey in writing forces me to slow down, name trade-offs explicitly, and leave a trail my future self (and colleagues) can actually follow.

The other part is pragmatic. I keep seeing the same kinds of problems repeat: unclear boundaries between domain and infrastructure, "shared" areas that quietly turn into a dumping ground, and a gap between high-level architectural diagrams and the reality of shipping code in a monorepo. This series is my attempt to bridge that gap by grounding the ideas in one concrete service, showing both where the patterns help and where they get in the way.

One theme that will appear throughout is the importance of **well-considered [bounded contexts](../../glossary.md#bounded-contexts)**. Clean Architecture on its own gives us horizontal layers, but in a large monorepo, those layers need to sit inside clearly defined domains to avoid becoming a single, bloated "core". I want each context to have its own cohesive model, language and rules, with only deliberate, well-designed collaboration points between them.

---

## The Initial Appeal of [Vertical Slice Architecture](../../glossary.md#vertical-slice-architecture)

When I began planning improvements to a large TypeScript monorepo that already contained a mix of newer and legacy code, I initially aimed for a hybrid of Vertical Slice Architecture and Clean Architecture. I wanted to organise code by feature first, and then keep a clear separation of concerns by layer inside each slice.

Vertical Slice Architecture stood out as an attractive starting point. Its promise of organising code by feature—rather than by technical layer—seemed ideal for clarifying boundaries, reducing cross-cutting complexity, and making each “slice” independently understandable and testable.

I was drawn to several benefits:
- **Clear feature boundaries:** Each slice encapsulates its own logic, data access, and presentation, making it easier to reason about changes.
- **Reduced coupling:** By focusing on vertical slices, shared concerns are minimised, and dependencies are explicit.
- **Improved onboarding:** New contributors can focus on a single slice without needing deep knowledge of the entire codebase.

### Challenges in Team Adoption

However, as I dogfooded this hybrid approach, several challenges emerged:
- **Explaining boundaries:** It was not always clear what constituted a “slice,” leading to inconsistent implementations and confusion. My concern was that this pain point would surface when onboarding new developers, and time spent debating boundaries might be better spent elsewhere.
- **Duplication vs. shared concerns:** Some logic (validation, error handling, utilities, db repositories) was duplicated across slices, while attempts to share code risked reintroducing tight coupling.
- **Legacy integration and existing structure:** The existing services were not organised around clear architectural boundaries; they had grown organically over time. That lack of structure was already a problem, and the hybrid sometimes highlighted it rather than solving it. It became clear that what we really needed was a consistent set of practices and a _reference_ implementation for future services, regardless of whether the surrounding code was greenfield or legacy.

## Exploring the Hybrid in Practice

In practice, the hybrid meant aiming for:
- Features grouped together so that a slice still felt like a coherent unit.
- Layers within a slice that roughly followed Clean Architecture ideas: domain logic separated from infrastructure, and a clear boundary to the outside world.

This worked up to a point, but it also surfaced some tensions:
- When slices needed to share domain concepts, it was not obvious whether those concepts “belonged” to one slice, should be duplicated or should be pulled out into a [shared kernel](../../glossary.md#shared-kernel-domain-driven-design).
- Trying to keep both the slice boundaries and the Clean Architecture layers consistent added cognitive load, especially for people new to the codebase.

That experience nudged me further towards treating Clean Architecture as the primary organising idea, and using “vertical slice” more as a way of thinking about features and flows, rather than the main source-code structure. In practice, one reasonable compromise is to treat each service (or bounded context) as its own coarse-grained "vertical slice" through the wider system, and then use Clean Architecture-style layering _within_ that slice.

Ultimately, while the hybrid Vertical Slice and Clean Architecture approach offered valuable lessons, the friction in adoption, the existing legacy structure, and the complexity of the model led me to reconsider. This experience set the stage for my transition to Clean Architecture, which I’ll explore throughout this series.

## Why Clean Architecture Looked Like a Better Fit

When I stepped back and looked at the problems we were actually running into, they were less about how to slice features and more about having clear, consistent boundaries between concerns: domain logic, interface adapters (infrastructure), and the outside world. Clean Architecture gave me a vocabulary and a set of patterns for drawing those boundaries explicitly, instead of relying on directory structure alone.

As I adopt Clean Architecture, I also want to stay deliberate about how I use **horizontal layering**. Shared layers are powerful, but without strong bounded contexts they can quietly turn into a bloated “shared” area — a kind of monolith in disguise where everything depends on everything else. Being conscious of that risk is part of why I’m aiming for a combination of:
- Clear horizontal layers (domain, application, interface adapters), and
- Clear vertical boundaries in the form of bounded contexts that keep models, language and rules tightly focused.

At a high level, it looked like a better fit because it:
- Encourages a clear separation between domain logic and infrastructure details.
- Makes dependencies flow in one direction, which is easier to reason about in a growing monorepo.
- Provides a stable “core” that new services can share as a reference, without forcing every team to adopt the same feature slicing strategy.
- Leaves room for each bounded context to evolve at its own pace, without dragging the rest of the monorepo along with every change.

I’ll dig into these ideas in more detail in the next posts, but for this introduction I mainly want to capture the pivot: Vertical Slices helped me see some of the problems; Clean Architecture, anchored in well-defined bounded contexts, gave me a more sustainable way to address them.

---

## Looking Ahead

In the next post, I'll step back and give you a high-level map of the Clean Architecture approach I'm using. We'll look at the three main layers — domain, application, and interface adapters — and establish the dependency rules that hold everything together. This foundation will carry us through the rest of the series.

---

## Further reading and resources

- [Effect documentation](https://effect.website/docs) – the library I use for dependency management, error handling and more.
- [Vertical Slice Architecture by Jimmy Bogard](https://jimmybogard.com/vertical-slice-architecture/) – background on vertical slices and why they can be attractive for feature-based organisation.
- [Clean Architecture (Robert C. Martin)](https://www.goodreads.com/book/show/18043011-clean-architecture) (book) – foundational ideas behind the layering and dependency rules I draw on in this series.
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/) (book) – the source of concepts like bounded contexts that I rely on when structuring monorepo services.

## Glossary terms in this post

- [Clean Architecture](../../glossary.md#clean-architecture)
- [Monorepo](../../glossary.md#monorepo)
- [Bounded contexts](../../glossary.md#bounded-contexts)
- [Vertical Slice Architecture](../../glossary.md#vertical-slice-architecture)
- [Effect](../../glossary.md#effect)
