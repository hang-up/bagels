<script setup lang="ts">
import { computed } from "vue";
import type { StoryBeat } from "../types/demo";

const props = defineProps<{
  beat: StoryBeat;
  sceneImage?: string;
}>();

const paragraphs = computed(() =>
  (props.beat.content ?? "")
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean),
);

const visualAsset = computed(
  () => props.beat.asset_url ?? props.beat.image_url ?? props.sceneImage ?? "",
);
</script>

<template>
  <article class="beat beat-photo-moment">
    <header class="story-section-head">
      <h3 class="story-section-title">{{ beat.title }}</h3>
      <p class="story-section-subtitle">
        {{
          beat.ambient_detail ||
          "A full-frame pause in the story before the page settles back into text."
        }}
      </p>
    </header>

    <figure v-if="visualAsset" class="photo-bleed">
      <img :src="visualAsset" :alt="beat.title" loading="lazy" />
    </figure>

    <section class="editorial-copy editorial-copy-photo">
      <p
        v-for="(paragraph, index) in paragraphs"
        :key="`${beat.id}-photo-paragraph-${index + 1}`"
      >
        {{ paragraph }}
      </p>
    </section>
  </article>
</template>
