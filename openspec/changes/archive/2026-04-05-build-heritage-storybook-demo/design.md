## Context

This change starts from a minimal repository with Docker and nginx scaffolding but no meaningful frontend or backend implementation yet. The demo goal is to present a believable end-to-end product where a family member's recording appears to flow through processing and emerges as a culturally grounded interactive storybook, while avoiding the complexity of real speech-to-text, audio processing, or production-grade content generation.

The product flow has three user-facing surfaces:
- a lightweight family member profile picker with pre-configured heritage or family background context
- a story capture library inspired by a SoundCloud-like recording list, including waveform visuals and processing states
- a shareable storybook page that renders processed stories through three locked interaction modes: memory cards with animated text, generated images, and a recipe scroll

The core design constraint is hackathon reliability. The system should look rich and reactive while depending on seeded data, deterministic mappings, and a small amount of AI-assisted generation only where it creates visible value.
Clay will serve as the design system source for shared UI primitives, layout conventions, and visual consistency, while the story experiences can still add custom presentation on top.

## Goals / Non-Goals

**Goals:**
- Make capture feel nearly frictionless by centering the flow around existing family member profiles instead of repeated form entry.
- Support a convincing queue-based story pipeline with clear states such as queued, processing, and complete.
- Define a structured story data model that is stable enough to drive deterministic UI experiences.
- Personalize output with heritage-aware content packs so the storybook feels grounded in cultural context.
- Limit the experience system to three polished presentation modes that can be completed within hackathon constraints.
- Keep the architecture simple enough to implement quickly in a mostly empty repository.

**Non-Goals:**
- Real audio recording, playback, speech-to-text, or transcript quality guarantees.
- Universal cultural coverage or a deeply configurable generation engine.
- User accounts, permissions, collaboration, or long-term content management.
- Full CMS workflows for asset authoring or story editing.
- Production-ready background jobs, observability, or media pipelines.

## Decisions

### 1. Use seeded demo data as the source of truth for profiles, recordings, and processed stories

The primary data source will be static or lightweight backend-served JSON fixtures representing family profiles, recording queue items, heritage packs, and completed story payloads. This keeps the demo resilient and removes risk from real-time ingestion.

Why this over building a true pipeline:
- It guarantees the team can always show multiple polished states during the demo.
- It allows the frontend to be developed against stable contracts immediately.
- It keeps engineering effort focused on visible product moments instead of infrastructure.

Alternative considered:
- Build a real upload plus processing flow with asynchronous jobs. Rejected for hackathon scope and higher failure risk.

### 2. Model processed stories as `metadata + beats`, with each beat explicitly mapped to an experience type

Instead of storing story content as generic sections, the system will use a normalized story object with top-level metadata and a list of beats. Each beat contains content, theme, and an explicit `experience` field so the renderer does not need complex inference at runtime.

Why this over pure theme-based matching:
- It makes the frontend predictable and easier to demo.
- It separates extraction concerns from presentation concerns.
- It still allows theme tags to influence visuals and copy without making rendering ambiguous.

Alternative considered:
- Infer the experience directly from theme values such as `food` or `relationship`. Rejected because multiple themes can map to the same UI pattern, and demo reliability matters more than automation elegance.

### 3. Lock the storybook renderer to three experience modules

The story page will support exactly three module types:
- `memory-cards`: card-based moments that reveal animated text, using Pretext or a similar text animation library
- `generated-image`: a visual scene or portrait generated from prompts enriched by heritage packs and curated assets
- `recipe-scroll`: a vertical storytelling layout for food memories, ingredients, rituals, and preparation details

Why this over a more open-ended component system:
- It creates a concise creative brief for design and implementation.
- It concentrates polish into three memorable experiences instead of spreading effort thinly.
- It keeps sample data and prompts easier to author.

Alternative considered:
- Create a general-purpose component registry with many story block types. Rejected as unnecessary complexity for the demo.

### 4. Treat heritage context as a curated content pack, not a freeform personalization engine

Each family profile references one or more heritage tags that map to a content pack. A content pack contains:
- visual references or asset bank pointers
- style tokens such as palette, motifs, and texture guidance
- prompt fragments for generated imagery
- optional language or terminology hints

Why this over direct user-entered personalization:
- It lowers user friction and makes the experience feel pre-configured.
- It gives the team editorial control over tone and avoids generic AI output.
- It supports the demo narrative that the product respects cultural context.

Alternative considered:
- Let users type their background in freeform text each time. Rejected because it creates friction and weakens consistency.

### 5. Present the recording library as a fake queue with visually rich status, not as a media player

The capture library will mimic an audio platform layout with waveform-like thumbnails, timestamps, family member attribution, and states such as queued, processing, and complete. The recording cards are navigational and atmospheric rather than functional audio players.

Why this over real playback:
- Playback is not required to validate the product concept in the demo.
- Static waveform visuals still communicate "captured memory" effectively.
- It reduces the amount of browser media handling and edge cases.

Alternative considered:
- Implement partial playback with placeholder files. Rejected because it adds work without increasing the clarity of the demo story.

### 6. Keep the backend optional and thin

If a backend is used, it should only serve seeded JSON and possibly simulate status transitions for queue items. The system should also be viable as a frontend-only prototype if implementation speed becomes the top priority.

Why this over committing early to a full API:
- The repo is mostly empty, so the team should preserve flexibility.
- A frontend-first path reduces setup time.
- A minimal API can be added only if it meaningfully improves the illusion of processing.

Alternative considered:
- Build a richer CRUD backend from the outset. Rejected because it consumes time better spent on story presentation.

### 7. Use Clay as the design system source and extend only where the story experience needs custom treatment

The implementation should use Clay as the baseline source for shared UI structure such as navigation, cards, lists, spacing, and foundational interaction patterns. Custom styling should be layered on top only for the three story experiences and heritage-specific presentation where the demo needs a more expressive surface.

Why this over inventing a bespoke design language from scratch:
- It speeds up implementation in a nearly empty codebase.
- It creates consistency across the profile picker, queue library, and story shell.
- It lets the team focus custom design effort on the moments users will remember in the demo.

Alternative considered:
- Create a fully custom design system for every surface. Rejected because it adds design and frontend overhead without improving the core product demo.

## Risks / Trade-offs

- [The demo may feel fake if queue states never change] -> Add timed or user-triggered transitions from queued to complete, even if driven by seeded data.
- [Generated images may look inconsistent across heritage packs] -> Use curated prompt templates and fall back to manually selected placeholder images where necessary.
- [The recipe scroll could become underdesigned compared to the other two experiences] -> Treat it as a structured editorial layout first and add interaction only if time remains.
- [The heritage selector could feel reductive or overly broad] -> Use warmer framing such as heritage or family background and start with a small number of intentionally curated packs.
- [Using animated text heavily could hurt readability] -> Constrain animation to reveal moments and allow the text to settle into a static readable state.
- [Clay components may feel too generic for the storytelling moments] -> Use Clay for structural surfaces and reserve custom treatment for the story experiences that need stronger emotional presentation.
- [A thin architecture may need rework after the hackathon] -> Accept this trade-off explicitly; optimize for demo clarity over long-term extensibility.

## Migration Plan

1. Define the seeded data contracts for profiles, queue items, heritage packs, and processed stories.
2. Build the capture library and family profile surfaces against those contracts.
3. Build the storybook renderer with the three locked experiences.
4. Add a thin mock API only if needed to improve perceived realism for state transitions or data loading.
5. Prepare curated demo data covering a few family members, multiple queue states, and at least one completed story per heritage pack.

Rollback strategy:
- If a backend-backed approach becomes unstable, switch to frontend-hosted fixtures without changing the user-facing flow.
- If generated images are weak, replace them with curated static assets while preserving the same storybeat contract.

## Open Questions

- Identify the minimum Clay foundations the team wants to adopt directly versus restyling for the storybook shell.
- Decide whether the first AI-assisted static payloads are authored manually in fixtures or generated through a lightweight one-off workflow before being committed.
