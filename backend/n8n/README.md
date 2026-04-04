# Hana n8n Workflows

## Files

- [`workflows/hana-voice-to-story.json`](/Users/robert.hang/Documents/webdev/personal/bagelshack-2/backend/n8n/workflows/hana-voice-to-story.json): importable n8n workflow for converting a voice recording into the structured story payload used by Hana.
- [`samples/story-submitted.payload.json`](/Users/robert.hang/Documents/webdev/personal/bagelshack-2/backend/n8n/samples/story-submitted.payload.json): sample webhook request body.

## What This Workflow Does

1. Receives `story.submitted` style payload via webhook (`POST /webhook/hana/voice-to-story`).
2. Loads profile + heritage context from API.
3. Marks queue item as `processing` (best-effort).
4. Downloads audio and transcribes via OpenAI.
5. Extracts grounded facts from transcript via an n8n **AI Agent** node + OpenAI Chat Model.
6. Generates a structured story payload (`metadata + beats`) via an n8n **AI Agent** node + OpenAI Chat Model.
7. Validates shape against expected contract.
8. On success:
- Attempts to persist story to `POST /api/stories`.
- Attempts to patch queue item to `complete` with `story_id`.
9. On failure:
- Attempts to patch queue item back to `queued` with error note.

## Environment Variables (n8n)

- `OPENAI_API_KEY` (required)
- `HANA_API_BASE` (optional, default `http://localhost:3100/api`)
- `OPENAI_TRANSCRIBE_MODEL` (optional, default `gpt-4o-mini-transcribe`)
- `OPENAI_STRUCTURING_MODEL` (optional, default `gpt-4.1-mini`)

## Current Backend Notes

The backend now supports the write endpoints used by the workflow:

- `POST /api/stories`
- `PATCH /api/story-queue/:id`

The workflow can persist generated stories and update queue states end-to-end.

## Import and Test

1. In n8n, import `backend/n8n/workflows/hana-voice-to-story.json`.
2. Set environment variables above.
3. In the workflow, open `Facts Model (OpenAI Chat)` and `Story Model (OpenAI Chat)` and select your OpenAI credential.
4. Activate workflow.
5. `POST` sample payload from `backend/n8n/samples/story-submitted.payload.json` to:
- `http://localhost:5678/webhook/hana/voice-to-story`
