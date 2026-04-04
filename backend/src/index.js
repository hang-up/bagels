import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = new Hono();
const PORT = Number(process.env.PORT ?? 3100);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");

const readJson = async (fileName) => {
  const fullPath = path.join(dataDir, fileName);
  const raw = await readFile(fullPath, "utf8");
  return JSON.parse(raw);
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

app.get("/api/stories/:id", async (c) => {
  const stories = await readJson("stories.json");
  const story = stories.find((item) => item.id === c.req.param("id"));
  if (!story) return c.json({ error: "Story not found" }, 404);
  return c.json(story);
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
