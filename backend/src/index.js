import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = new Hono();
const PORT = Number(process.env.PORT ?? 4200);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const QUEUE_STATUSES = new Set(["queued", "processing", "complete"]);

const jsonPath = (fileName) => path.join(dataDir, fileName);

const readJson = async (fileName) => {
  const fullPath = jsonPath(fileName);
  const raw = await readFile(fullPath, "utf8");
  return JSON.parse(raw);
};

const writeJson = async (fileName, payload) => {
  const fullPath = jsonPath(fileName);
  const tmpPath = `${fullPath}.${process.pid}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(tmpPath, fullPath);
};

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["*"],
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

app.get("/api/family-profiles", async (c) =>
  c.json(await readJson("family-profiles.json")),
);
app.get("/api/heritage-packs", async (c) =>
  c.json(await readJson("heritage-packs.json")),
);
app.get("/api/story-queue", async (c) =>
  c.json(await readJson("story-queue.json")),
);
app.get("/api/stories", async (c) => c.json(await readJson("stories.json")));

app.patch("/api/story-queue/:id", async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const status = body?.status;
  const storyId = body?.story_id;
  const errorNote = body?.error_note;

  if (status !== undefined && !QUEUE_STATUSES.has(status)) {
    return c.json(
      { error: "Invalid status; expected queued, processing, or complete" },
      400,
    );
  }

  if (status === "complete" && storyId !== undefined && storyId !== null) {
    if (typeof storyId !== "string" || storyId.trim() === "") {
      return c.json({ error: "story_id must be a non-empty string" }, 400);
    }
  }

  if (errorNote !== undefined && typeof errorNote !== "string") {
    return c.json({ error: "error_note must be a string" }, 400);
  }

  const queue = await readJson("story-queue.json");
  const index = queue.findIndex((item) => item.id === c.req.param("id"));

  if (index === -1) return c.json({ error: "Queue item not found" }, 404);

  const current = queue[index];
  const updated = { ...current };

  if (status !== undefined) updated.status = status;
  if (storyId !== undefined) updated.story_id = storyId;
  if (errorNote !== undefined) updated.error_note = errorNote;

  queue[index] = updated;
  await writeJson("story-queue.json", queue);

  return c.json(updated);
});

app.get("/api/stories/:id", async (c) => {
  const stories = await readJson("stories.json");
  const story = stories.find((item) => item.id === c.req.param("id"));
  if (!story) return c.json({ error: "Story not found" }, 404);
  return c.json(story);
});

app.post("/api/stories", async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const requiredFields = [
    "id",
    "profile_id",
    "heritage_pack_id",
    "status",
    "metadata",
    "beats",
  ];
  for (const field of requiredFields) {
    if (body?.[field] === undefined || body?.[field] === null) {
      return c.json({ error: `Missing required field: ${field}` }, 400);
    }
  }

  if (typeof body.id !== "string" || body.id.trim() === "") {
    return c.json({ error: "id must be a non-empty string" }, 400);
  }
  if (!QUEUE_STATUSES.has(body.status)) {
    return c.json(
      { error: "status must be one of queued, processing, complete" },
      400,
    );
  }
  if (!Array.isArray(body.beats)) {
    return c.json({ error: "beats must be an array" }, 400);
  }

  const stories = await readJson("stories.json");
  if (stories.some((story) => story.id === body.id)) {
    return c.json({ error: "Story with this id already exists" }, 409);
  }

  stories.push(body);
  await writeJson("stories.json", stories);

  return c.json(body, 201);
});

app.get("/api/share/stories/:id", async (c) => {
  const stories = await readJson("stories.json");
  const story = stories.find(
    (item) => item.id === c.req.param("id") && item.status === "complete",
  );
  if (!story) return c.json({ error: "Story unavailable" }, 404);
  return c.json(story);
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
