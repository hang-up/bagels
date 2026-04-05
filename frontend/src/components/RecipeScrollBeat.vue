<script setup lang="ts">
import { computed } from "vue";
import type { StoryBeat } from "../types/demo";

const props = defineProps<{
  beat: StoryBeat;
  sceneImage?: string;
}>();

const splitParagraphs = (text?: string) =>
  (text ?? "")
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

const storyParagraphs = computed(() => splitParagraphs(props.beat.content));
const leadParagraph = computed(() => storyParagraphs.value[0] ?? "");
const trailingParagraphs = computed(() => storyParagraphs.value.slice(1));

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const dishName = computed(() => {
  if (props.beat.ingredients?.length) return props.beat.ingredients[0];

  const emDashMatch = props.beat.content.match(/(?:^|[.!?]\s+)([A-Z][A-Za-z'-]+)\s+[—-]\s+/);
  if (emDashMatch?.[1]) return emDashMatch[1];

  return "";
});

const dishGloss = computed(() => {
  if (!dishName.value) return "";
  const match = props.beat.content.match(
    new RegExp(`${escapeRegExp(dishName.value)}\\s+[—-]\\s+([^.]*)`),
  );
  return match?.[1]?.trim() ?? "";
});

const companionDish = computed(() => {
  const companionMatch = props.beat.content.match(/\b(Tuyo)\b/i);
  if (!companionMatch?.[1]) return "";
  return companionMatch[1];
});

const highlightedLead = computed(() => {
  if (!dishName.value || !leadParagraph.value.includes(dishName.value)) {
    return {
      before: leadParagraph.value,
      match: "",
      after: "",
      found: false,
    };
  }

  const index = leadParagraph.value.indexOf(dishName.value);
  return {
    before: leadParagraph.value.slice(0, index),
    match: dishName.value,
    after: leadParagraph.value.slice(index + dishName.value.length),
    found: true,
  };
});

const recipeIngredients = computed(() => {
  if (dishName.value.toLowerCase() === "sinangag") {
    return [
      "2 cups cold cooked rice",
      "4 cloves garlic, minced",
      "2 tablespoons neutral oil",
      "1 teaspoon sea salt",
      "2 scallions, thinly sliced",
      "Fresh cracked black pepper",
    ];
  }

  if (props.beat.ingredients?.length) return props.beat.ingredients.slice(0, 6);

  return [
    "Cooked rice",
    "Garlic",
    "Oil",
    "Salt",
  ];
});

const visualAsset = computed(
  () => props.beat.asset_url ?? props.beat.image_url ?? props.sceneImage ?? "",
);

const visualPromptPreview = computed(() => {
  const text = props.beat.visual_prompt?.trim();
  if (!text) return "Generated food-memory visual will appear here.";
  if (text.length <= 210) return text;
  return `${text.slice(0, 210)}…`;
});
</script>

<template>
  <article class="beat beat-recipe-scroll">
    <header class="story-section-head recipe-head">
      <h3 class="story-section-title">{{ beat.title }}</h3>
      <p class="story-section-subtitle recipe-subtitle">
        {{ beat.ambient_detail || "An editorial memory of food, care, and ritual." }}
      </p>
    </header>

    <section class="editorial-copy recipe-story">
      <p v-if="leadParagraph">
        <template v-if="highlightedLead.found">
          {{ highlightedLead.before }}

          <span class="dish-hover">
            <button class="dish-trigger" type="button">
              {{ highlightedLead.match }}
            </button>

            <span class="dish-card" role="note">
              <span class="dish-card-media">
                <img
                  v-if="visualAsset"
                  :src="visualAsset"
                  :alt="`${dishName || beat.title} context card visual`"
                  loading="lazy"
                />
                <span v-else class="recipe-visual-prompt">{{ visualPromptPreview }}</span>
              </span>

              <span class="dish-card-body">
                <span class="recipe-kicker">Dish Note</span>
                <span class="dish-card-title">{{ dishName || beat.title }}</span>
                <span class="dish-card-copy">
                  {{
                    dishGloss || beat.ambient_detail || "A remembered dish carried by smell and habit."
                  }}
                </span>
                <span v-if="companionDish" class="dish-card-copy dish-card-copy-muted">
                  Often eaten with {{ companionDish.toLowerCase() }} when there was some.
                </span>

                <span v-if="recipeIngredients.length" class="dish-card-grid">
                  <span class="dish-card-section">
                    <span class="dish-card-label">Ingredients</span>
                    <span class="dish-card-list">
                      <span
                        v-for="(ingredient, index) in recipeIngredients"
                        :key="`${beat.id}-ingredient-${index}`"
                        class="dish-card-pill"
                      >
                        {{ ingredient }}
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </span>

          {{ highlightedLead.after }}
        </template>

        <template v-else>{{ leadParagraph }}</template>
      </p>

      <p
        v-for="(paragraph, index) in trailingParagraphs"
        :key="`${beat.id}-story-${index + 1}`"
      >
        {{ paragraph }}
      </p>
    </section>
  </article>
</template>
