<script setup lang="ts">
import { computed } from "vue";
import MemoryCardsPretext from "./MemoryCardsPretext.vue";
import RecipeScrollBeat from "./RecipeScrollBeat.vue";
import type { StoryBeat, StoryPayload } from "../types/demo";

const props = defineProps<{
  story: StoryPayload;
}>();

const beatsInOrder = computed(() => props.story.beats ?? []);

const experienceLabel = (beat: StoryBeat) => beat.experience || "unstyled";

const sceneImages: Record<string, string> = {
  "beat-003": "/scene-walk-to-school.png",
  "beat-006": "/scene-walk-back.png",
};
</script>

<template>
  <section class="storybook-renderer" aria-label="Storybook Renderer">
    <template v-for="beat in beatsInOrder" :key="beat.id">
      <MemoryCardsPretext
        v-if="beat.experience === 'memory-cards' && sceneImages[beat.id]"
        :beat="beat"
        :scene-image="sceneImages[beat.id]"
      />

      <RecipeScrollBeat
        v-else-if="beat.experience === 'recipe-scroll'"
        :beat="beat"
      />

      <article v-else class="beat">
        <span class="chip">{{ experienceLabel(beat) }}</span>
        <h3>{{ beat.title }}</h3>
        <p>{{ beat.content }}</p>
      </article>
    </template>
  </section>
</template>
