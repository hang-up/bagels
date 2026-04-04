<script setup lang="ts">
import { computed } from "vue";
import type { StoryBeat } from "../types/demo";

const props = defineProps<{
  beat: StoryBeat;
}>();

const splitParagraphs = (text?: string) =>
  (text ?? "")
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

const splitSentences = (text?: string) =>
  (text ?? "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

const storyParagraphs = computed(() => splitParagraphs(props.beat.content));
const sourceParagraphs = computed(() => splitParagraphs(props.beat.content_origin));

const pantryNotes = computed(() => {
  if (props.beat.ingredients?.length) return props.beat.ingredients.slice(0, 6);

  return splitSentences(props.beat.content)
    .slice(0, 5)
    .map((sentence) => sentence.replace(/[.!?]$/, ""));
});

const ritualSteps = computed(() => {
  if (props.beat.rituals?.length) return props.beat.rituals.slice(0, 5);

  const keywords = [
    "fry",
    "stir",
    "serve",
    "wrap",
    "tie",
    "cook",
    "eat",
    "smell",
  ];

  const matched = splitSentences(props.beat.content).filter((sentence) =>
    keywords.some((keyword) => sentence.toLowerCase().includes(keyword)),
  );

  return (matched.length ? matched : splitSentences(props.beat.content)).slice(0, 4);
});

const visualAsset = computed(() => props.beat.asset_url ?? props.beat.image_url ?? "");

const visualPromptPreview = computed(() => {
  const text = props.beat.visual_prompt?.trim();
  if (!text) return "Generated food-memory visual will appear here.";
  if (text.length <= 210) return text;
  return `${text.slice(0, 210)}…`;
});
</script>

<template>
  <article class="beat beat-recipe-scroll">
    <header class="recipe-head">
      <span class="chip">recipe-scroll</span>
      <h3>{{ beat.title }}</h3>
      <p class="recipe-subtitle">
        {{ beat.ambient_detail || "An editorial memory of food, care, and ritual." }}
      </p>
    </header>

    <section class="recipe-scroll-layout">
      <div class="recipe-story">
        <p v-for="(paragraph, index) in storyParagraphs" :key="`${beat.id}-story-${index}`">
          {{ paragraph }}
        </p>
      </div>

      <aside class="recipe-sidebar">
        <section class="recipe-card">
          <h4>Pantry Notes</h4>
          <ul>
            <li v-for="(note, index) in pantryNotes" :key="`${beat.id}-note-${index}`">
              {{ note }}
            </li>
          </ul>
        </section>

        <section class="recipe-card">
          <h4>Ritual Steps</h4>
          <ol>
            <li v-for="(step, index) in ritualSteps" :key="`${beat.id}-step-${index}`">
              {{ step }}
            </li>
          </ol>
        </section>
      </aside>
    </section>

    <section class="recipe-visual">
      <img
        v-if="visualAsset"
        :src="visualAsset"
        :alt="`Generated visual for ${beat.title}`"
        loading="lazy"
      />
      <p v-else class="recipe-visual-prompt">{{ visualPromptPreview }}</p>
    </section>

    <section v-if="sourceParagraphs.length" class="recipe-origin">
      <h4>Original Voice</h4>
      <p v-for="(paragraph, index) in sourceParagraphs" :key="`${beat.id}-origin-${index}`">
        {{ paragraph }}
      </p>
    </section>
  </article>
</template>
