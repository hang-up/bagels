# story-capture-queue Specification

## Purpose
TBD - created by archiving change build-heritage-storybook-demo. Update Purpose after archive.
## Requirements
### Requirement: Story submissions appear in a visual capture library
The system SHALL display submitted story items in a capture library that resembles an audio platform feed, including a waveform-style visual, associated family member, submission metadata, and processing state.

#### Scenario: User views the capture library
- **WHEN** the user opens the story library
- **THEN** the system shows a list of recording cards with non-playable waveform visuals and story metadata

### Requirement: Queue states are seeded and demo-selectable
The system SHALL represent processing progress using seeded states selected in demo data rather than live timers or background processing.

#### Scenario: Demo data marks an item as queued
- **WHEN** a story item is seeded with a queued state
- **THEN** the system presents it as waiting for processing without requiring any asynchronous job execution

#### Scenario: Demo data marks an item as complete
- **WHEN** a story item is seeded with a complete state
- **THEN** the system presents it as ready to open in the storybook experience

### Requirement: Only completed stories open the storybook route
The system MUST provide storybook navigation for completed items and MUST avoid treating queued or processing items as fully readable stories.

#### Scenario: User selects a completed story
- **WHEN** the user opens a recording card whose state is complete
- **THEN** the system navigates to that story's shareable route

#### Scenario: User selects a queued story
- **WHEN** the user opens a recording card whose state is queued or processing
- **THEN** the system keeps the user in the library context and indicates that the story is not ready yet

