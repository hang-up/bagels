<script setup lang="ts">
import { computed } from "vue";
import type { StoryPayload } from "../types/demo";

const props = defineProps<{
  story: StoryPayload;
}>();

const splitParagraphs = (text?: string) =>
  (text ?? "")
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

const originalBeats = computed(() =>
  (props.story.beats ?? [])
    .filter((beat) => beat.content_origin?.trim())
    .map((beat) => ({
      id: beat.id,
      title: beat.title,
      paragraphs: splitParagraphs(beat.content_origin),
    }))
    .filter((beat) => beat.paragraphs.length > 0),
);

const originalLanguageLabel = computed(() => {
  const tags = (props.story.metadata.language_tags ?? []).filter((tag) => tag !== "en");
  if (tags.length === 0) return "Original language";
  return `Original language: ${tags.join(" • ").toUpperCase()}`;
});
</script>

<template>
  <details v-if="originalBeats.length" class="original-language-section">
    <summary class="original-language-summary">
      <span class="original-language-summary-copy">
        <span class="chip">{{ originalLanguageLabel }}</span>
        <span class="original-language-summary-title">As it was told</span>
      </span>
      <span class="original-language-summary-icon" aria-hidden="true"></span>
    </summary>

    <div class="original-language-list">
      <article
        v-for="beat in originalBeats"
        :key="beat.id"
        class="original-language-entry"
      >
        <h3 class="original-language-title">{{ beat.title }}</h3>
        <div class="original-language-copy">
          <p
            v-for="(paragraph, index) in beat.paragraphs"
            :key="`${beat.id}-origin-${index + 1}`"
          >
            {{ paragraph }}
          </p>
        </div>
      </article>
    </div>
  </details>
</template>
