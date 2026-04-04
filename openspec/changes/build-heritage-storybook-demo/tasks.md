## 1. Seed Demo Data Contracts

- [x] 1.1 Create seeded data files or mock API responses for family member profiles, heritage packs, queue items, and completed story payloads
- [ ] 1.2 Define the static story payload shape with story metadata and ordered beats mapped to `memory-cards`, `generated-image`, or `recipe-scroll`
- [ ] 1.3 Author initial heritage content packs for North African and Southeast Asian story context, including prompt fragments and styling tokens
- [ ] 1.4 Prepare AI-assisted static demo stories for at least one completed story per heritage pack plus additional queued items

## 2. Build Frictionless Capture Surfaces

- [x] 2.1 Establish Clay as the source for shared UI primitives and layout patterns used by the profile and library surfaces
- [x] 2.2 Implement the family member profile picker showing name, relationship label, and preconfigured heritage or family background context
- [x] 2.3 Implement the story library layout with SoundCloud-style recording cards, waveform visuals, and seeded status badges
- [x] 2.4 Wire completed library items to a story route and keep queued or processing items in the library with a not-ready state

## 3. Build Shareable Storybook Rendering

- [ ] 3.1 Implement a public shareable route that loads a completed story directly from the seeded data source
- [ ] 3.2 Build the storybook renderer that reads the static structured story payload and renders beats in order
- [ ] 3.3 Implement the `memory-cards` experience with animated text treatment suitable for readable story moments
- [ ] 3.4 Implement the `generated-image` experience using heritage pack context plus curated or generated visual assets
- [ ] 3.5 Implement the `recipe-scroll` experience as an editorial food-memory layout for recipe and ritual content
- [ ] 3.6 Layer custom story presentation on top of Clay foundations without breaking overall shell consistency

## 4. Add Heritage-Aware Presentation

- [ ] 4.1 Connect family profiles and stories to heritage content packs so the selected pack influences story presentation
- [ ] 4.2 Apply heritage-aware styling, imagery prompts, and asset references in the storybook renderer
- [ ] 4.3 Verify that both North African and Southeast Asian stories feel visually distinct while still sharing the same rendering engine

## 5. Prepare Demo Reliability and Handoff

- [ ] 5.1 Decide whether the demo runs frontend-only or with a thin mock backend, then wire the simplest stable loading path
- [ ] 5.2 Add seeded queue states selected in demo data so the team can reliably show queued and completed stories on demand
- [ ] 5.3 Add fallback assets or placeholder visuals for weak generated-image outputs to protect the demo
- [ ] 5.4 Document where an n8n workflow or other simple LLM injection point can later replace the static story payload generation step
