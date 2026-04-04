<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type QueueStatus = "queued" | "processing" | "complete";

type FamilyProfile = {
  id: string;
  name: string;
  relationship_label: string;
  heritage_pack_ids: string[];
  language_tags: string[];
};

type HeritagePack = {
  id: string;
  label: string;
};

type QueueItem = {
  id: string;
  profile_id: string;
  story_id: string | null;
  title: string;
  duration_seconds: number;
  status: QueueStatus;
};

type StoryBeat = {
  id: string;
  experience: string;
  title: string;
  content: string;
};

type StoryPayload = {
  id: string;
  profile_id: string;
  heritage_pack_id: string;
  metadata: { title: string };
  beats: StoryBeat[];
};

const API_BASE = "/api";

const profiles = ref<FamilyProfile[]>([]);
const heritagePacks = ref<HeritagePack[]>([]);
const queue = ref<QueueItem[]>([]);
const selectedProfileId = ref<string | null>(null);
const statusNote = ref("");
const story = ref<StoryPayload | null>(null);
const apiError = ref("");

const storyRouteId = () => {
  const match = window.location.pathname.match(/^\/story\/([^/]+)$/);
  return match?.[1] ?? null;
};

const routeStoryId = ref<string | null>(storyRouteId());

const selectedProfile = computed(() =>
  profiles.value.find((profile) => profile.id === selectedProfileId.value),
);

const queueForProfile = computed(() => {
  if (!selectedProfileId.value) return queue.value;
  return queue.value.filter((item) => item.profile_id === selectedProfileId.value);
});

const profileNameById = (id: string) =>
  profiles.value.find((profile) => profile.id === id)?.name ?? "Unknown";

const heritageLabel = (id: string) =>
  heritagePacks.value.find((pack) => pack.id === id)?.label ?? id;

const profileHeritageLabel = (profile: FamilyProfile) =>
  profile.heritage_pack_ids.map((id) => heritageLabel(id)).join(" • ");

const badgeClass = (status: QueueStatus) => {
  if (status === "complete") return "badge badge-success";
  if (status === "processing") return "badge badge-warning";
  return "badge badge-secondary";
};

const fetchJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`Request failed: ${path}`);
  return response.json() as Promise<T>;
};

const navigateTo = (path: string) => {
  window.history.pushState({}, "", path);
  routeStoryId.value = storyRouteId();
  statusNote.value = "";
};

const openQueueItem = (item: QueueItem) => {
  if (item.status === "complete" && item.story_id) {
    navigateTo(`/story/${item.story_id}`);
    return;
  }
  statusNote.value =
    "This recording is still queued/processing in demo mode and is not readable yet.";
};

const hydrateBaseData = async () => {
  const [profilesPayload, heritagePayload, queuePayload] = await Promise.all([
    fetchJson<FamilyProfile[]>("/family-profiles"),
    fetchJson<HeritagePack[]>("/heritage-packs"),
    fetchJson<QueueItem[]>("/story-queue"),
  ]);

  profiles.value = profilesPayload;
  heritagePacks.value = heritagePayload;
  queue.value = queuePayload;

  if (!selectedProfileId.value) {
    selectedProfileId.value = profilesPayload[0]?.id ?? null;
  }
};

const loadStory = async () => {
  if (!routeStoryId.value) {
    story.value = null;
    return;
  }
  story.value = await fetchJson<StoryPayload>(`/stories/${routeStoryId.value}`);
};

const initialize = async () => {
  try {
    await hydrateBaseData();
    await loadStory();
  } catch {
    apiError.value = "Could not load data from /api.";
  }
};

onMounted(() => {
  initialize();
  window.addEventListener("popstate", async () => {
    routeStoryId.value = storyRouteId();
    statusNote.value = "";
    await loadStory();
  });
});
</script>

<template>
  <main class="shell">
    <section v-if="apiError" class="panel">
      <h1 class="title">API unavailable</h1>
      <p class="muted">{{ apiError }}</p>
    </section>

    <template v-else-if="routeStoryId && story">
      <section class="panel story-wrap">
        <button class="back-btn" type="button" @click="navigateTo('/')">Back to Queue</button>
        <h1 class="title">{{ story.metadata.title }}</h1>
        <p class="muted">
          {{ profileNameById(story.profile_id) }} • {{ heritageLabel(story.heritage_pack_id) }}
        </p>

        <article v-for="beat in story.beats" :key="beat.id" class="beat">
          <span class="chip">{{ beat.experience }}</span>
          <h3>{{ beat.title }}</h3>
          <p>{{ beat.content }}</p>
        </article>
      </section>
    </template>

    <template v-else>
      <section class="panel hero">
        <h1 class="title">Family Story Capture</h1>
        <p class="muted">
          Clay-based shell for profile selection and queue browsing with seeded story states.
        </p>
      </section>

      <section class="panel">
        <div class="row-head">
          <h2>Family Profiles</h2>
          <small class="muted">Preloaded heritage context</small>
        </div>
        <div class="profiles-grid">
          <button
            v-for="profile in profiles"
            :key="profile.id"
            type="button"
            class="profile-btn card"
            :class="{ active: selectedProfileId === profile.id }"
            @click="
              selectedProfileId = profile.id;
              statusNote = '';
            "
          >
            <strong>{{ profile.name }}</strong>
            <p class="muted profile-meta">{{ profile.relationship_label }}</p>
            <p class="muted profile-meta">{{ profileHeritageLabel(profile) }}</p>
          </button>
        </div>
      </section>

      <section class="panel">
        <div class="row-head">
          <h2>Story Queue</h2>
          <small class="muted">SoundCloud-style cards, non-playable waveform</small>
        </div>

        <p class="active-profile" v-if="selectedProfile">Showing {{ selectedProfile.name }}</p>

        <div class="queue-list">
          <article
            v-for="item in queueForProfile"
            :key="item.id"
            class="queue-card card"
            :class="{ 'not-ready': item.status !== 'complete' }"
            @click="openQueueItem(item)"
          >
            <div class="queue-head">
              <h3>{{ item.title }}</h3>
              <span :class="badgeClass(item.status)">{{ item.status }}</span>
            </div>
            <p class="muted">{{ profileNameById(item.profile_id) }} • {{ item.duration_seconds }}s</p>
            <div class="wave" />
          </article>

          <p class="muted" v-if="queueForProfile.length === 0">No recordings for this profile yet.</p>
        </div>

        <p class="status-note" v-if="statusNote">{{ statusNote }}</p>
      </section>
    </template>
  </main>
</template>
