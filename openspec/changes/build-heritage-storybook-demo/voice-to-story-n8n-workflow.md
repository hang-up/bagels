# Voice to Structured Story Workflow (n8n)

## Purpose

Define a lightweight workflow that converts a recorded voice memory into the existing structured story payload used by the app (`backend/data/stories.json` shape), without requiring a heavy production pipeline.

This is the recommended replacement path for static story authoring.

## Why n8n Fits

- Fast to stand up for hackathon/demo timelines.
- Visual branching for retries, validation failures, and fallback logic.
- Easy to call OpenAI APIs, backend endpoints, and storage providers.
- Lets us keep frontend contracts stable while iterating on prompts.

## Trigger and Input Contract

Workflow trigger: `story.submitted`

Input payload:

```json
{
  "queue_item_id": "queue-010",
  "profile_id": "profile-nanay",
  "audio_url": "https://.../recording.m4a",
  "duration_seconds": 184,
  "submitted_at": "2026-04-04T15:22:00Z"
}
```

## Target Output Contract (Existing Story Shape)

The workflow should produce one story object compatible with the existing seed shape:

- Top-level:
  - `id`
  - `profile_id`
  - `heritage_pack_id`
  - `status` (`complete`)
  - `metadata` (title + authoring context)
  - `beats[]`
  - `throughline`
  - `dedication`
- Beat fields:
  - `id`
  - `kind`
  - `theme`
  - `experience` (`memory-cards` | `generated-image` | `recipe-scroll`)
  - `title`
  - `content`
  - `content_origin`
  - `visual_prompt`
  - `ambient_detail`

## n8n Node-Level Workflow

1. `Webhook` (or queue event trigger)
- Receives `queue_item_id`, `profile_id`, `audio_url`.

2. `HTTP Request: Load Profile`
- `GET /api/family-profiles`
- Resolve selected profile and language/heritage hints.

3. `HTTP Request: Load Heritage Pack`
- `GET /api/heritage-packs`
- Resolve visual motifs, palette, prompt fragments.

4. `HTTP Request: Mark Queue Processing`
- `PATCH /api/story-queue/:id` with `status=processing`.
- If PATCH is not available yet, write to a lightweight JSON store or n8n data store and sync later.

5. `OpenAI Audio Transcription`
- Model: current transcription model (e.g. `gpt-4o-mini-transcribe` or latest equivalent).
- Input: `audio_url`.
- Output: transcript + optional timestamps/segments.

6. `OpenAI: Transcript Normalization + Fact Extraction`
- Convert raw transcript into:
  - cleaned transcript
  - speaker/audience hints
  - memory moments list
  - candidate themes (`memory`, `food`, `place`, `relationship`, `identity`)
  - language tags and tone tags

7. `OpenAI: Story Structuring`
- Prompt with:
  - cleaned transcript
  - profile fields
  - heritage pack context
  - strict JSON schema instructions
- Require output to include `metadata + beats` in final shape.
- Require all beats to use allowed `experience` enum values only.

8. `Function: Validate + Normalize`
- Validate JSON shape (Ajv in Code node).
- Enforce:
  - `profile_id` matches trigger.
  - `status = "complete"`.
  - Each beat has required fields.
  - `experience` in allowed set.
  - IDs deterministic (`story-{profile}-{date}-{slug}`, `beat-001...`).

9. `IF: Validation Passed?`
- `true` branch -> persist.
- `false` branch -> repair.

10. `OpenAI: JSON Repair` (failure branch)
- Provide validation errors + rejected JSON.
- Ask for corrected JSON only.
- Re-validate once. If still invalid -> fail hard.

11. `HTTP Request: Persist Story`
- `POST /api/stories` (recommended) with full story payload.
- Temporary fallback: append to JSON fixture file via a small internal endpoint.

12. `HTTP Request: Mark Queue Complete`
- `PATCH /api/story-queue/:id` with:
  - `status=complete`
  - `story_id=<new story id>`

13. `Respond/Notify`
- Return story id and share route `/story/:id`.
- Optional Slack/Discord notification for demo operators.

14. `Error Trigger Branch`
- On any failure:
  - mark queue item `status=queued` or `status=failed` (if introduced),
  - include short `error_note`,
  - alert operator channel.

## Prompting Strategy (Two-Step is Recommended)

- Step A (extract): focus on factual grounding from transcript.
- Step B (compose): map facts to narrative beats and required experience types.

This separation reduces hallucination and improves structural consistency.

## Suggested Deterministic Rules

- Keep `beats` length between `4` and `8`.
- If food-heavy content exists, include at least one `recipe-scroll` beat.
- Include at least one `memory-cards` beat for emotional anchor moments.
- Only include `generated-image` when visual detail is strong enough; otherwise reuse `memory-cards`.
- Use heritage pack fragments inside each `visual_prompt`.

## Injection Points Into Current Codebase

Current read endpoints exist:
- `GET /api/story-queue`
- `GET /api/share/stories/:id`
- `GET /api/stories/:id`

Recommended thin write endpoints to add:
- `POST /api/stories`
- `PATCH /api/story-queue/:id`

This keeps frontend unchanged while swapping static authoring for automated generation.

## Rollout Plan

1. Implement n8n with a manual trigger and one known audio file.
2. Validate that generated payload renders in current frontend without code changes.
3. Add queue status updates.
4. Add webhook trigger from capture submission.
5. Keep seeded fallback stories for demo reliability.

