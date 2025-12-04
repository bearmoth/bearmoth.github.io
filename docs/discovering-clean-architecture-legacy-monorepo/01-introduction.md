# Discovering Clean Architecture in a Legacy Monorepo

Published on 2025-12-04

**Themes:** clean architecture, legacy monorepo, vertical slice architecture, bounded contexts, Effect

Welcome to the first post in my series on discovering and introducing [clean architecture](../../glossary.md#clean-architecture) patterns while building new services in a TypeScript [monorepo](../../glossary.md#monorepo). I’ll document how I surface improved patterns, integrate with legacy libraries, and evolve architectural decisions in a real-world context.

Along the way, we’ll iteratively build out a concrete service, using it as a living reference implementation rather than a purely theoretical example. That service is the thread that ties the series together: we’ll revisit it in each post, refine the design, and use it to test how well the patterns hold up under real constraints.

> **Disclaimer:** This service and its design are very much a work in progress. I’m still uncovering constraints, surfacing awkward edges in the existing monorepo, and experimenting with how far these patterns will stretch before they become painful. Wherever something is unresolved, I’ll call it out explicitly so you can see both what is working and what still feels uncertain.

---

## Series Navigation
- **[Introduction](./01-introduction.md)** (current)

---

## Motivation and Goals

In this series, I’ll explore how I iteratively built a PoC for modern services within a monorepo that contains legacy code and conventions. The goal is to share practical strategies for evaluating and adopting clean architecture patterns, while balancing the realities of legacy integration. The PoC service we’ll build together is intentionally modest in scope, but rich enough to expose real-world trade-offs, integration pain, and areas where the “clean” ideals need to be adapted.

I’ll cover:
- The principles of Clean Architecture and their relevance to monorepos
- Challenges of supporting legacy code and conventions
- How [Effect](https://effect.website/) helps with dependency injection, error handling and more
- Practical steps for introducing Clean Architecture in a monorepo
- Lessons learned and key takeaways

One theme that will appear throughout is the importance of **well-considered [bounded contexts](../../glossary.md#bounded-contexts)**. Clean Architecture on its own gives us horizontal layers, but in a large monorepo, those layers need to sit inside clearly defined domains to avoid becoming a single, bloated "core". I want each context to have its own cohesive model, language and rules, with only deliberate, well-designed collaboration points between them.

---

## The Initial Appeal of [Vertical Slice Architecture](../../glossary.md#vertical-slice-architecture)

When I began planning improvements to our legacy TypeScript monorepo, I initially aimed for a hybrid of Vertical Slice Architecture and Clean Architecture. I wanted to organise code by feature first, and then keep a clear separation of concerns by layer inside each slice.

Vertical Slice Architecture stood out as an attractive starting point. Its promise of organising code by feature—rather than by technical layer—seemed ideal for clarifying boundaries, reducing cross-cutting complexity, and making each “slice” independently understandable and testable.

I was drawn to several benefits:
- **Clear feature boundaries:** Each slice encapsulates its own logic, data access, and presentation, making it easier to reason about changes.
- **Reduced coupling:** By focusing on vertical slices, shared concerns are minimised, and dependencies are explicit.
- **Improved onboarding:** New contributors can focus on a single slice without needing deep knowledge of the entire codebase.

### Challenges in Team Adoption

However, as I dogfooded this hybrid approach, several challenges emerged:
- **Explaining boundaries:** It was not always clear what constituted a “slice,” leading to inconsistent implementations and confusion. My concern was that this pain point would surface when onboarding new developers, and time spent debating boundaries might be better spent elsewhere.
- **Duplication vs. shared concerns:** Some logic (validation, error handling, utilities, db repositories) was duplicated across slices, while attempts to share code risked reintroducing tight coupling.
- **Legacy integration and existing structure:** The existing services were not organised around clear architectural boundaries; they had grown organically over time. That lack of structure was already a problem, and the hybrid sometimes highlighted it rather than solving it. It became clear that what we really needed was a consistent set of practices and a _reference_ implementation for future services.

## Exploring the Hybrid in Practice

In practice, the hybrid meant aiming for:
- Features grouped together so that a slice still felt like a coherent unit.
- Layers within a slice that roughly followed Clean Architecture ideas: domain logic separated from infrastructure, and a clear boundary to the outside world.

This worked up to a point, but it also surfaced some tensions:
- When slices needed to share domain concepts, it was not obvious whether those concepts “belonged” to one slice, should be duplicated or should be pulled out into a shared core (not ideal).
- Trying to keep both the slice boundaries and the Clean Architecture layers consistent added cognitive load, especially for people new to the codebase.

That experience nudged me further towards treating Clean Architecture as the primary organising idea, and using “vertical slice” more as a way of thinking about features and flows, rather than the main source-code structure.

Ultimately, while the hybrid Vertical Slice and Clean Architecture approach offered valuable lessons, the friction in adoption, the existing legacy structure, and the complexity of the model led me to reconsider. This experience set the stage for my transition to Clean Architecture, which I’ll explore throughout this series.

## Why Clean Architecture Looked Like a Better Fit

When I stepped back and looked at the problems we were actually running into, they were less about how to slice features and more about having clear, consistent boundaries between concerns: domain logic, infrastructure, and the outside world. Clean Architecture gave me a vocabulary and a set of patterns for drawing those boundaries explicitly, instead of relying on directory structure alone.

As I adopt Clean Architecture, I also want to stay deliberate about how I use **horizontal layering**. Shared layers are powerful, but without strong bounded contexts they can quietly turn into a bloated “shared” area — a kind of monolith in disguise where everything depends on everything else. Being conscious of that risk is part of why I’m aiming for a combination of:
- Clear horizontal layers (domain, application, infrastructure), and
- Clear vertical boundaries in the form of bounded contexts that keep models, language and rules tightly focused.

At a high level, it looked like a better fit because it:
- Encourages a clear separation between domain logic and infrastructure details.
- Makes dependencies flow in one direction, which is easier to reason about in a growing monorepo.
- Provides a stable “core” that new services can share as a reference, without forcing every team to adopt the same feature slicing strategy.
- Leaves room for each bounded context to evolve at its own pace, without dragging the rest of the monorepo along with every change.

I’ll dig into these ideas in more detail in the next posts, but for this introduction I mainly want to capture the pivot: Vertical Slices helped me see some of the problems; Clean Architecture, anchored in well-defined bounded contexts, gave me a more sustainable way to address them.

---

## Looking Ahead

In the next posts, I’ll step back from Vertical Slices and lay out the Clean Architecture principles I’m using as a reference point for new services in this monorepo. I’ll talk about how those ideas show up in day-to-day decisions, how [Effect](../../glossary.md#effect) helps with dependency management and error handling, and how I’m trying to turn one service into a concrete reference for the rest of the codebase.

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
