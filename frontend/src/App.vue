<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import OriginalLanguageSection from "./components/OriginalLanguageSection.vue";
import StorybookRenderer from "./components/StorybookRenderer.vue";
import type {
  FamilyProfile,
  HeritagePack,
  QueueItem,
  QueueStatus,
  StoryPayload,
} from "./types/demo";

const API_BASE = "/api";

const profiles = ref<FamilyProfile[]>([]);
const heritagePacks = ref<HeritagePack[]>([]);
const queue = ref<QueueItem[]>([]);
const selectedProfileId = ref<string | null>(null);
const activeProfileDialogId = ref<string | null>(null);
const statusNote = ref("");
const story = ref<StoryPayload | null>(null);
const apiError = ref("");
const storyLoadError = ref("");

const waveformCache = new Map<string, number[]>();
const PROFILE_DIALOG_ARTWORK = "/nanay.png";
const languageLabelByTag: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  ms: "Malay",
  tl: "Tagalog",
  ilo: "Ilocano",
};
const onboardingDetailByProfileId: Record<
  string,
  {
    hometown: string;
    born: string;
    familyRole: string;
    storyFocus: string;
    keepsakes: string;
    firstPrompt: string;
  }
> = {
  "profile-noura": {
    hometown: "Omdurman, Sudan",
    born: "1948",
    familyRole: "Grandmother on mom's side",
    storyFocus: "Migration memories, Eid traditions, and family recipes",
    keepsakes: "Jebena coffee pot, prayer beads, handwritten recipe pages",
    firstPrompt: "Ask about the first home she built after marriage and the meal everyone remembers.",
  },
  "profile-lila": {
    hometown: "George Town, Penang",
    born: "1963",
    familyRole: "Aunt and reunion organizer",
    storyFocus: "Holiday gatherings, neighborhood memories, and playful family stories",
    keepsakes: "Photo albums, spice tins, reunion invitation cards",
    firstPrompt: "Start with the celebration she never lets the family miss.",
  },
  "profile-nanay": {
    hometown: "Laoag City, Philippines",
    born: "1956",
    familyRole: "Mother and keeper of kitchen traditions",
    storyFocus: "Comfort meals, caregiving stories, and lessons passed down at home",
    keepsakes: "Apron pocket notes, rosary, embossed serving platter",
    firstPrompt: "Open with the dish she made when the whole family needed comfort.",
  },
};

const storyRouteId = () => {
  const match = window.location.pathname.match(/^\/story\/([^/]+)$/);
  return match?.[1] ?? null;
};

const routeStoryId = ref<string | null>(storyRouteId());

const selectedProfile = computed(() =>
  profiles.value.find((profile) => profile.id === selectedProfileId.value),
);

const activeProfileDialog = computed(() =>
  profiles.value.find((profile) => profile.id === activeProfileDialogId.value),
);

const queueForProfile = computed(() => {
  const ordered = [...queue.value].sort((a, b) => {
    const aTime = a.submitted_at ? Date.parse(a.submitted_at) : 0;
    const bTime = b.submitted_at ? Date.parse(b.submitted_at) : 0;
    return bTime - aTime;
  });

  if (!selectedProfileId.value) return ordered;
  return ordered.filter((item) => item.profile_id === selectedProfileId.value);
});

const profileNameById = (id: string) =>
  profiles.value.find((profile) => profile.id === id)?.name ?? "Loved one";

const heritageLabel = (id: string) =>
  heritagePacks.value.find((pack) => pack.id === id)?.label ?? id;

const profileHeritageLabel = (profile: FamilyProfile) =>
  profile.heritage_pack_ids.map((id) => heritageLabel(id)).join(" • ");

const profileLanguageLabel = (profile: FamilyProfile) =>
  profile.language_tags
    .map((tag) => languageLabelByTag[tag] ?? tag.toUpperCase())
    .join(" • ");

const profileOnboardingDetail = (profile: FamilyProfile) =>
  onboardingDetailByProfileId[profile.id] ?? {
    hometown: "Unknown hometown",
    born: "Unknown",
    familyRole: "Loved one",
    storyFocus: "Family stories and shared memories",
    keepsakes: "Photos and keepsakes",
    firstPrompt:
      "Use a favorite place, dish, or milestone as the first prompt to help the story start naturally.",
  };

const badgeClass = (status: QueueStatus) => {
  if (status === "complete") return "badge badge-success";
  if (status === "processing") return "badge badge-warning";
  return "badge badge-secondary";
};

const statusLabel = (status: QueueStatus) => {
  if (status === "complete") return "Ready";
  if (status === "processing") return "Processing";
  return "Queued";
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

const formatSubmittedAt = (submittedAt?: string) => {
  if (!submittedAt) return "No date";
  const date = new Date(submittedAt);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const seedHash = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const buildWaveformBars = (seedSource: string, barsCount = 68) => {
  let state = seedHash(seedSource) || 1;

  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967295;
  };

  const bars: number[] = [];
  for (let i = 0; i < barsCount; i += 1) {
    const position = i / (barsCount - 1);
    const envelope = Math.pow(Math.sin(Math.PI * position), 0.8);
    const jitter = 0.45 + random() * 0.55;
    const harmonic = 0.6 + 0.4 * Math.sin(i * 0.55 + random() * Math.PI);
    const peak = 0.1 + envelope * jitter * harmonic;
    const height = Math.max(10, Math.min(100, Math.round(peak * 100)));
    bars.push(height);
  }

  return bars;
};

const waveformBars = (item: QueueItem) => {
  const key = `${item.waveform_seed ?? item.id}-${item.duration_seconds}`;
  if (!waveformCache.has(key)) {
    waveformCache.set(key, buildWaveformBars(key));
  }
  return waveformCache.get(key) ?? [];
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

  statusNote.value = "This voice story is still in queue and is not readable yet.";
};

const openProfileDialog = (profile: FamilyProfile) => {
  selectedProfileId.value = profile.id;
  activeProfileDialogId.value = profile.id;
  statusNote.value = "";
};

const closeProfileDialog = () => {
  activeProfileDialogId.value = null;
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
};

const loadStory = async () => {
  storyLoadError.value = "";
  if (!routeStoryId.value) {
    story.value = null;
    return;
  }

  try {
    story.value = await fetchJson<StoryPayload>(
      `/share/stories/${routeStoryId.value}`,
    );
  } catch {
    story.value = null;
    storyLoadError.value = "This story link is unavailable or not complete yet.";
  }
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
  window.addEventListener("popstate", () => {
    routeStoryId.value = storyRouteId();
    statusNote.value = "";
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeProfileDialogId.value) {
      closeProfileDialog();
    }
  });
});

watch(routeStoryId, () => {
  void loadStory();
});
</script>

<template>
  <main class="shell">
    <section v-if="apiError" class="panel">
      <h1 class="title">Hana unavailable</h1>
      <p class="muted">{{ apiError }}</p>
    </section>

    <template v-else-if="routeStoryId">
      <section v-if="story" class="story-wrap">
        <button class="back-btn story-back-btn" type="button" @click="navigateTo('/')">
          Back Home
        </button>

        <header class="story-header">
          <p class="story-kicker">
            {{ profileNameById(story.profile_id) }} • {{ heritageLabel(story.heritage_pack_id) }}
          </p>
          <h1 class="title story-title">{{ story.metadata.title }}</h1>
          <p v-if="story.throughline" class="story-deck">{{ story.throughline }}</p>
          <p class="story-meta">
            Told by {{ story.metadata.speaker || profileNameById(story.profile_id) }}
          </p>
        </header>

        <StorybookRenderer :story="story" />
        <OriginalLanguageSection :story="story" />

        <footer v-if="story.dedication" class="story-footer">
          <p class="story-dedication">{{ story.dedication }}</p>
        </footer>
      </section>

      <section v-else class="panel story-fallback">
        <button class="back-btn" type="button" @click="navigateTo('/')">Back Home</button>
        <h1 class="title">Story Unavailable</h1>
        <p class="muted">{{ storyLoadError || "Loading story..." }}</p>
      </section>
    </template>

    <template v-else>
      <section class="home-head">
        <p class="brand">Hana</p>
        <h1 class="home-title">Home</h1>
      </section>

      <section class="home-section">
        <div class="row-head">
          <h2>Loved Ones</h2>
        </div>

        <div class="profiles-grid">
          <button
            v-for="profile in profiles"
            :key="profile.id"
            type="button"
            class="profile-btn"
            :class="{ active: selectedProfileId === profile.id }"
            @click="openProfileDialog(profile)"
          >
            <div class="avatar" aria-hidden="true">{{ profile.name.slice(0, 1) }}</div>
            <div>
              <strong>{{ profile.name }}</strong>
              <p class="muted profile-meta">{{ profile.relationship_label }}</p>
              <p class="muted profile-meta">{{ profileHeritageLabel(profile) }}</p>
            </div>
          </button>
        </div>
      </section>

      <section class="home-section">
        <div class="row-head">
          <h2>Voice Stories</h2>
        </div>

        <p class="active-profile" v-if="selectedProfile">
          Showing stories for {{ selectedProfile.name }}
        </p>

        <div class="queue-list">
          <article
            v-for="item in queueForProfile"
            :key="item.id"
            class="queue-card"
            :class="{ 'not-ready': item.status !== 'complete' }"
            @click="openQueueItem(item)"
          >
            <div class="queue-head">
              <h3>{{ item.title }}</h3>
              <span :class="badgeClass(item.status)">{{ statusLabel(item.status) }}</span>
            </div>

            <p class="muted queue-meta">
              {{ profileNameById(item.profile_id) }} • {{ formatDuration(item.duration_seconds) }} •
              {{ formatSubmittedAt(item.submitted_at) }}
            </p>

            <div class="waveform" aria-hidden="true">
              <span
                v-for="(bar, index) in waveformBars(item)"
                :key="`${item.id}-bar-${index}`"
                class="wave-bar"
                :style="{ height: `${bar}%` }"
              />
            </div>
          </article>

          <p class="muted" v-if="queueForProfile.length === 0">No recordings for this profile yet.</p>
        </div>

        <p class="status-note" v-if="statusNote">{{ statusNote }}</p>
      </section>

      <div
        v-if="activeProfileDialog"
        class="profile-dialog-backdrop"
        role="presentation"
        @click="closeProfileDialog"
      >
        <section
          class="profile-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`profile-dialog-title-${activeProfileDialog.id}`"
          @click.stop
        >
          <button
            class="profile-dialog-close"
            type="button"
            aria-label="Close profile details"
            @click="closeProfileDialog"
          >
            Close
          </button>

          <div class="profile-dialog-media">
            <img
              :src="PROFILE_DIALOG_ARTWORK"
              :alt="`${activeProfileDialog.name} profile illustration`"
            />
          </div>

          <div class="profile-dialog-body">
            <p class="profile-dialog-kicker">Onboarding Preview</p>
            <h3
              :id="`profile-dialog-title-${activeProfileDialog.id}`"
              class="profile-dialog-title"
            >
              {{ activeProfileDialog.name }}
            </h3>
            <p class="profile-dialog-subtitle">
              {{ activeProfileDialog.relationship_label }} •
              {{ profileHeritageLabel(activeProfileDialog) }}
            </p>

            <div class="profile-dialog-grid">
              <article class="profile-detail-card">
                <span class="profile-detail-label">Born</span>
                <p>{{ profileOnboardingDetail(activeProfileDialog).born }}</p>
              </article>

              <article class="profile-detail-card">
                <span class="profile-detail-label">Hometown</span>
                <p>{{ profileOnboardingDetail(activeProfileDialog).hometown }}</p>
              </article>

              <article class="profile-detail-card">
                <span class="profile-detail-label">Languages</span>
                <p>{{ profileLanguageLabel(activeProfileDialog) }}</p>
              </article>

              <article class="profile-detail-card">
                <span class="profile-detail-label">Family Role</span>
                <p>{{ profileOnboardingDetail(activeProfileDialog).familyRole }}</p>
              </article>

              <article class="profile-detail-card profile-detail-card-wide">
                <span class="profile-detail-label">Story Focus</span>
                <p>{{ profileOnboardingDetail(activeProfileDialog).storyFocus }}</p>
              </article>

              <article class="profile-detail-card profile-detail-card-wide">
                <span class="profile-detail-label">Keepsakes to Ask About</span>
                <p>{{ profileOnboardingDetail(activeProfileDialog).keepsakes }}</p>
              </article>

              <article class="profile-detail-card profile-detail-card-wide">
                <span class="profile-detail-label">First Prompt</span>
                <p>{{ profileOnboardingDetail(activeProfileDialog).firstPrompt }}</p>
              </article>
            </div>

            <div class="profile-dialog-actions">
              <button class="profile-dialog-primary" type="button" @click="closeProfileDialog">
                Continue to stories
              </button>
            </div>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>
