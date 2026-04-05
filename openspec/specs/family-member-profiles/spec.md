# family-member-profiles Specification

## Purpose
TBD - created by archiving change build-heritage-storybook-demo. Update Purpose after archive.
## Requirements
### Requirement: Family member profiles are preconfigured for low-friction capture
The system SHALL provide preconfigured family member profiles that can be selected before submitting a story so users do not need to re-enter the same family background and relationship context each time.

#### Scenario: User starts a story from an existing profile
- **WHEN** the user opens the capture flow
- **THEN** the system shows a list of available family member profiles with their name, relationship label, and heritage or family background context

#### Scenario: Selected profile preloads story context
- **WHEN** the user selects a family member profile
- **THEN** the system associates future story submissions with that profile's heritage context and identity metadata

### Requirement: Demo profiles include curated heritage context
The system SHALL support family member profiles that reference one or more curated heritage content packs, including North African and Southeast Asian packs for the initial demo scope.

#### Scenario: Profile references an in-scope heritage pack
- **WHEN** a user views a demo family member profile
- **THEN** the profile shows at least one heritage content pack identifier from the supported demo set

