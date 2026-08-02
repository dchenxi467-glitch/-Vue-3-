<script setup lang="ts">
import { computed } from 'vue'
import { NUTRIENTS, NUTRIENT_KEYS } from '../data/nutrients'
import { dayScore, mid, sortByRelevance, sumIntake } from '../services/nutritionEngine'
import { useMealsStore } from '../stores/meals'
import { useProfileStore } from '../stores/profile'
import { useSettingsStore } from '../stores/settings'
import { useTargets } from '../composables/useTargets'
import ScoreCard from '../components/ScoreCard.vue'
import AiInputCard from '../components/AiInputCard.vue'
import NutrientSourceCard from '../components/NutrientSourceCard.vue'
import MealTimeline from '../components/MealTimeline.vue'
import type { AiRecognizeResult, MealKind, MealRecord } from '../types'

const mealsStore = useMealsStore()
const profileStore = useProfileStore()
const settingsStore = useSettingsStore()
const targets = useTargets()

/** 评分与达标判定基于纯食物摄入（拒绝补充剂造成的虚假达标） */
const foodIntake = computed(() => sumIntake(mealsStore.todayMeals))
const score = computed(() => dayScore(foodIntake.value, targets.value))

const sortedKeys = computed(() =>
  sortByRelevance(NUTRIENT_KEYS, profileStore.profile, targets.value),
)

const matchedCount = computed(
  () =>
    NUTRIENT_KEYS.filter((k) => mid(foodIntake.value[k]) >= targets.value[k].target)
      .length,
)

/** 达标/缺口标签（各取前 2-3 个，用于评分卡片） */
const okTags = computed(() =>
  sortedKeys.value
    .filter((k) => mid(foodIntake.value[k]) >= targets.value[k].target)
    .slice(0, 3)
    .map((k) => NUTRIENTS[k].name),
)
const missingTags = computed(() =>
  sortedKeys.value
    .filter((k) => mid(foodIntake.value[k]) < targets.value[k].target)
    .sort(
      (a, b) =>
        mid(foodIntake.value[a]) / targets.value[a].target -
        mid(foodIntake.value[b]) / targets.value[b].target,
    )
    .slice(0, 2)
    .map((k) => ({
      name: NUTRIENTS[k].name,
      gapPct: Math.round((1 - mid(foodIntake.value[k]) / targets.value[k].target) * 100),
    })),
)

function onAddMeal(result: AiRecognizeResult, kind: MealKind) {
  mealsStore.addMeal({
    kind,
    title: result.title,
    ingredients: result.ingredients,
    source: 'ai',
    images: 1,
  })
}

function onUpdateMeal(
  id: string,
  patch: Partial<Pick<MealRecord, 'title' | 'ingredients' | 'kind'>>,
) {
  mealsStore.updateMeal(id, patch)
}
</script>

<template>
  <div class="space-y-4">
    <ScoreCard
      :score="score"
      :matched-count="matchedCount"
      :total-count="NUTRIENT_KEYS.length"
      :standard="settingsStore.standard"
      :ok-tags="okTags"
      :missing-tags="missingTags"
    />

    <AiInputCard @add-meal="onAddMeal" />

    <!-- 营养来源结构分析（双轨隔离呈现 + 补充剂/日晒打卡） -->
    <NutrientSourceCard />

    <MealTimeline
      :meals="mealsStore.todayMeals"
      @remove="mealsStore.removeMeal"
      @update="onUpdateMeal"
    />
  </div>
</template>
