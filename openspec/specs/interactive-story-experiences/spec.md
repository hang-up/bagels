# interactive-story-experiences Specification

## Purpose
TBD - created by archiving change build-heritage-storybook-demo. Update Purpose after archive.
## Requirements
### Requirement: Completed stories render through a public shareable route
The system SHALL expose each completed story through a shareable route that can be opened directly without first navigating through the in-app library.

#### Scenario: User opens a story from a direct link
- **WHEN** the user visits a valid shareable story route for a completed story
- **THEN** the system renders the interactive storybook page for that story

### Requirement: Story payloads use a static structured format for rendering
The system SHALL render story pages from a static structured payload containing story metadata and ordered story beats so the rendering engine can be developed and tested independently of live generation workflows.

#### Scenario: Renderer receives a valid story payload
- **WHEN** the story page loads a structured story payload with metadata and beats
- **THEN** the system renders the storybook in the order defined by that payload

### Requirement: The storybook supports exactly three demo experiences
The system SHALL support the following story beat experience types for the initial demo: `memory-cards`, `generated-image`, and `recipe-scroll`.

#### Scenario: Story includes memory card beats
- **WHEN** a story beat is marked with the `memory-cards` experience type
- **THEN** the system renders card-based memory moments with animated text treatment

#### Scenario: Story includes generated image beats
- **WHEN** a story beat is marked with the `generated-image` experience type
- **THEN** the system renders a visual scene using imagery associated with the story and its heritage context

#### Scenario: Story includes recipe scroll beats
- **WHEN** a story beat is marked with the `recipe-scroll` experience type
- **THEN** the system renders an editorial food-memory layout with recipe and ritual content

### Requirement: Story content can originate from AI-assisted authoring before live automation exists
The system SHALL support story payloads that were prepared through AI-assisted authoring and stored as static demo content prior to runtime generation integration.

#### Scenario: Story is pre-authored before demo runtime
- **WHEN** a completed story is seeded from an AI-assisted static payload
- **THEN** the story renders without requiring a live LLM or workflow call during the demo

