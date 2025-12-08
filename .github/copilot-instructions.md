# Repository-wide Copilot instructions

## High-level purpose

- This repository powers a GitHub Pages site used to publish technical blog posts.
- All rendered blog content lives in Markdown under the `docs/` directory.
- The `docs/README.md` file is the landing page of the blog and acts as the index of posts and series.
- Some posts may reference separate “companion code” projects stored in sibling directories at the repository root (for example: `example-project-1/`). These are standalone codebases, not part of the GitHub Pages build itself.

When working in this repository, focus primarily on:
- Maintaining a consistent blog format.
- Keeping the blog index (`docs/README.md`) aligned with the actual posts and series.
- Avoiding breaking GitHub Pages publishing.

## Project layout

- `docs/`
  - Contains all blog content and supporting Markdown files.
  - `docs/README.md` is the landing page for the blog and should list:
    - All standalone posts (direct `.md` files in `docs/`).
    - All series (as a link to the first post in each series, with a description of the overall series).
  - For a **standalone blog post**:
    - Create a new Markdown file in `docs/` with a **clean, descriptive slug and no date prefix**.  
      - Example: `my-first-blog-post.md`, `rest-api-design.md`.
    - Add a link to it, with a brief description, in `docs/README.md`.
    - Represent the **last updated date** in the content, not in the filename:
      - Use front-matter (for example, `last_updated:`) if the site is configured for it, and/or
      - Add a “Last updated YYYY-MM-DD” line near the top of the post.
  - For a **blog series**:
    - Create a new directory inside `docs/` (for example, `docs/my-series/`).
    - Add each post in the series as a separate Markdown file within that directory.
    - Prefer structural naming over dates; you may prefix files with an order indicator if helpful:
      - Example: `01-introduction.md`, `02-building-the-core.md`, `03-deployment.md`.
    - Only the **first** post in the series should be linked from `docs/README.md`.
    - The description for that link should describe the **series as a whole**, not just the first post.
    - Each post in the series should contain internal navigation at the top that links to all posts in the series.
- Root-level directories (other than `docs/`):
  - May contain **companion code projects** referenced by specific posts.
  - Treat each such directory as its own project with its own build/test instructions (if any).
  - Do not assume these code projects are required to build or publish the GitHub Pages site.

If you need to locate a blog post or series:
- Standalone posts: look in `docs/*.md` (excluding `README.md`).
- Series: look in `docs/<series-name>/**/*.md`.

## Build, run, and validation

This repository is designed for GitHub Pages, and typically **does not require a complex local build** to validate Markdown content.

When proposing changes:

- Assume the main “build”/“run”/“test” is:
  - Ensuring Markdown is syntactically valid and renders correctly.
  - Ensuring relative links between posts, series, and companion repos are correct.
- Prefer simple, safe validation steps:
  - Check for broken internal links (relative paths) within `docs/`.
  - Check front-matter (if present) for correct syntax.
  - Keep GitHub Pages–specific configuration files (for example, `_config.yml`, `.nojekyll`, or workflows) consistent if they exist in this repo.

If you need to suggest commands, keep them generic and optional, for example:
- `markdownlint` or similar tools, only if they are already present in this repo’s configuration or documented in its README.
- Do **not** introduce new tooling (for example, new NPM packages, linters, or build chains) unless the repository already uses them or the user explicitly requests it.

If a GitHub Actions workflow for Pages exists:
- Respect any checks it performs (link checkers, Markdown lint, etc.).
- Do not modify CI configuration unless the requested change clearly requires that and you can keep it minimal.

## Blog formatting guidelines

When generating or editing blog posts in `docs/`:

### Tone

- Use a **calm, clear, and slightly conversational technical tone**.
- This is a personal blog: when referring to the author, prefer first-person language (“I”) and natural phrasing.
- Use **British/International English** spelling and vocabulary (for example, “behaviour”, “organisation”, “colour”) rather than US variants.
- It is also fine to use inclusive language like “we” and “you” to bring the reader along, with light, natural phrasing such as:
  - “In this post, we’ll look at… ”
  - “We’ll walk through the migration step by step.”
  - “You’ll see that this keeps the setup simple.”
- Avoid:
  - Jokes, memes, or try-hard humor.
  - Hype or marketing language (“life-changing,” “insane boost,” etc.).
  - Sarcasm or put-downs.
- When in doubt, prioritize clarity and technical accuracy over personality, but the writing should not feel stiff or overly formal.

### Structure

- Start each post with an H1 title (`# Title`).
- Directly under the title, include:
  - A short introductory paragraph explaining the goal or outcome of the post.
  - Optionally, a “Last updated YYYY-MM-DD” line and any other basic metadata (unless handled by front-matter).
  - Optionally, a **Themes** line listing 2–6 key topics for the post, for example:

    `**Themes:** clean architecture, legacy monorepo, refactoring`

  - If a post feels like it genuinely needs more than 6 core themes, pause and consider whether it would be clearer as a short series or multiple focused posts, rather than a single, overloaded article.

- Use section headings (`##`, `###`) to organize the content logically. Prefer:
  - Problem statement or context.
  - Explanation / background (if needed).
  - Step-by-step walkthrough or core content.
  - Summary or key takeaways.
- At the end of the post, include a `## Further reading and resources` section when there are relevant references. Use this to list:
  - External resources (books, articles, talks, documentation) that deepen or support the content of the post.
  - Internal resources (other posts in this blog or companion projects in this repo) that are directly relevant.
  - Prefer at least one **freely viewable, web-accessible** resource (official documentation, articles, talks) so readers can explore further without buying a book.
  - It is fine to include books, especially canonical ones (for example, Evans, Fowler, "Gang of Four"), but try not to rely on books as the **only** reference where good web resources exist.
  - When listing both web resources and books, put web resources first, then books, and label books clearly (for example, "(book)").

### Series navigation

- For posts that belong to a **series**:
  - At the very top of the file (immediately below the H1 title and optional metadata/themes), include a small navigation block listing all posts in the series, with links and clear indication of the current post.
  - Keep the order and labels consistent across all posts in the series.
  - When adding/removing posts from a series, update the navigation in **every** file in that series.

### Code examples

- Use fenced code blocks with appropriate language tags where supported by the blog renderer (for example, ```ts, ```js, ```python`, etc.).
- Prefer minimal, focused examples instead of large, unedited dumps.
- When referencing companion code projects in the root:
  - Clearly indicate the project path relative to the repository root.
  - Point readers to the key files or entry points relevant to the post.
- Avoid adding heavy or unnecessary dependencies to companion projects unless the user asks.

### Links

- For standalone posts:
  - After creating a new `.md` file in `docs/`, always add a link and a brief description to `docs/README.md`.
- For series:
  - Only link the **first** post from `docs/README.md`.
  - Description text on the landing page should describe the **overall series**, not just the first article.
- Use relative links within the repository (for example, `../other-post.md` or `./my-series/01-introduction.md`).
- Keep URLs stable; **do not rename files just to change dates**, since dates are represented in content, not filenames.

### Metadata/front-matter

- If the repository uses front-matter (for example, `---` blocks at the top of posts):
  - Preserve existing keys and structure when editing.
  - Only add new keys if already used elsewhere in the repo or if the user requests them.
  - Maintain consistent date formats and tag naming.
- When both front-matter and in-body “Published on” lines are present, keep them consistent.

### Concepts & patterns glossary

- This repo uses a central glossary file under `docs/` (typically `docs/glossary.md` or similar) to capture recurring concepts, patterns, anti-patterns, and key technologies.
- Each glossary entry should:
  - Use an H2 heading (`## Term`) for the concept name.
  - For terms with multiple meanings or that could be ambiguous without context, use the format `## Term (context)` to clarify which meaning is being used. For example:
    - `## Composition root (dependency injection)` rather than just `## Composition root`
    - `## Entities (domain-driven design)` rather than just `## Entities`
    - `## Gateways (architecture pattern)` rather than just `## Gateways`
  - This makes it clear which specific meaning of the term is being documented, especially when the term has different meanings in different contexts.
  - Immediately after the heading, include a **Type:** field that categorizes what kind of thing this entry describes. The type system is extensible—add new types as needed when existing categories don't fit. Common types include:
    - **Definition** — defines what a type or category of thing means (for example, what is a "principle", what is a "pattern")
    - **Principle** — fundamental design or architectural principle (for example, dependency inversion, SOLID principles)
    - **Pattern** — a reusable solution or approach to a recurring problem (for example, repository pattern, ports and adapters, anti-corruption layer)
    - **Technique** — a specific practice or method (for example, dependency injection, test-driven development)
    - **Concept** — an architectural or domain modeling concept (for example, clean architecture, bounded contexts, entities, value objects)
    - **Layer** — a specific architectural layer (for example, domain layer, application layer, interface adapter layer)
    - **Library/Tool** — a specific technology or library (for example, Effect, TypeScript)
    Use the most specific and accurate type. If a term could fit multiple categories, choose the one that best reflects its primary nature (for example, "ports and adapters" is primarily a pattern, even though it also embodies the dependency inversion principle). When introducing a new type category, consider adding a definition entry to explain what that type means.
  - Include a short, opinionated explanation of the term in the author's own words.
  - Optionally list **How I use this** (links to posts in this blog where the concept is applied or discussed).
  - Optionally list **Related concepts** (links to other glossary entries).
  - Optionally list **External references** (a small number of high-quality external resources). Prefer at least one freely viewable, web-accessible resource; books are welcome in addition, especially when they are the canonical reference.
- Order glossary entries **alphabetically by term name** (case-insensitive), ignoring the context qualifier in parentheses for sorting purposes.
  - When adding a new term, insert it in the correct alphabetical position rather than appending to the end.
  - Do not create separate "featured" or "pinned" sections; use links from posts instead to highlight particularly important concepts.
- When introducing or using an important concept in a post (for example, clean architecture, monorepo, strangler fig, seams, feature toggles):
  - Prefer to link the first mention of the term to its glossary entry, for example:

    `...we’ll apply [clean architecture](./glossary.md#clean-architecture) principles to a legacy monorepo.`

  - Optionally, add a short `## Glossary terms in this post` section near the end of the article that lists links to all relevant glossary entries used in the post.
- When new posts are added that rely on an existing concept:
  - Update the corresponding glossary entry’s “How I use this” section to include links to the new posts.
- When a post introduces a genuinely new, recurring concept or pattern:
  - Add a new glossary entry following the same structure and cross-link it where appropriate.
- **When acting as an automated agent (for example, GitHub Copilot Chat) and modifying or adding blog content, also update `docs/glossary.md` so that relevant entries, “How I use this” sections, and related links stay in sync with the new or changed posts.**

## Companion code projects

When a post references a “companion project”:

- Treat each companion project directory in the repository root as an independent codebase.
- If asked to modify or create a companion project:
  - Keep the structure simple and aligned with the technologies already in use in that project (for example, if it’s a small Node project, don’t convert it to another stack).
  - Ensure README or in-post instructions clearly explain:
    - How to run the example.
    - Any prerequisites (versions, tools).
- Do not assume that building or testing a companion project is required to “build” the blog itself.

## How to work efficiently in this repo

- When asked to create or change a blog post:
  - Prefer editing files in `docs/` and keeping `docs/README.md` in sync.
  - Use clean, date-free filenames and represent dates in content/metadata.
  - Ensure series navigation is updated consistently across all related posts.
  - Use the **Themes**, **Glossary**, and **Further reading and resources** conventions above to keep posts consistent and make it easy to discover related content.
  - **If you are an automated agent making these changes, treat updating `docs/glossary.md` (where relevant) as part of the same task, rather than a separate, optional step.**
- When asked to change site-wide or structural behavior:
  - Look for configuration at the repo root (for example, `_config.yml`, GitHub Actions workflows) and keep modifications minimal and clearly related to the request.
- Avoid introducing heavy tooling or restructuring the repo layout unless the user explicitly asks for it.

When uncertain:
- Favor minimal, focused changes that preserve existing patterns in `docs/` and the overall repository layout.
- Default to the calm, slightly conversational technical style described above.
