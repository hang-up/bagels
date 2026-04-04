<script setup lang="ts">
import { computed } from "vue";
import MemoryCardsPretext from "./MemoryCardsPretext.vue";
import PhotoMomentBeat from "./PhotoMomentBeat.vue";
import RecipeScrollBeat from "./RecipeScrollBeat.vue";
import type { StoryPayload } from "../types/demo";

const props = defineProps<{
  story: StoryPayload;
}>();

const beatsInOrder = computed(() => props.story.beats ?? []);

const splitParagraphs = (text?: string) =>
  (text ?? "")
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

const beatImages: Record<string, string> = {
  "beat-002": "/recipe-scroll-demo.png",
  "beat-003": "/scene-walk-back.png",
  "beat-005": "/rural-philippine-school-at-dawn.png",
  "beat-006": "/hands.gif",
};
</script>

<template>
  <section class="storybook-renderer" aria-label="Storybook Renderer">
    <template v-for="beat in beatsInOrder" :key="beat.id">
      <MemoryCardsPretext
        v-if="beat.experience === 'memory-cards' && beatImages[beat.id]"
        :beat="beat"
        :scene-image="beatImages[beat.id]"
      />

      <RecipeScrollBeat
        v-else-if="beat.experience === 'recipe-scroll'"
        :beat="beat"
        :scene-image="beatImages[beat.id]"
      />

      <PhotoMomentBeat
        v-else-if="beat.experience === 'photo-moment'"
        :beat="beat"
        :scene-image="beatImages[beat.id]"
      />

      <article v-else class="beat beat-editorial">
        <header class="story-section-head">
          <h3 class="story-section-title">{{ beat.title }}</h3>
          <p v-if="beat.ambient_detail" class="story-section-subtitle">
            {{ beat.ambient_detail }}
          </p>
        </header>

        <section class="editorial-copy">
          <p
            v-for="(paragraph, index) in splitParagraphs(beat.content)"
            :key="`${beat.id}-paragraph-${index + 1}`"
          >
            {{ paragraph }}
          </p>
        </section>
      </article>
    </template>
  </section>
</template>
