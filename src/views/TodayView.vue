<script setup lang="ts">
import { computed } from 'vue'
import { NUTRIENTS, NUTRIENT_KEYS } from '../data/nutrients'
import { dayScore, sortByRelevance, sumIntake } from '../services/nutritionEngine'
import { useMealsStore } from '../stores/meals'
import { useProfileStore } from '../stores/profile'
import { useSettingsStore } from '../stores/settings'
import { useTargets } from '../composables/useTargets'
import ScoreCard from '../components/ScoreCard.vue'
import AiInputCard from '../components/AiInputCard.vue'
import MealTimeline from '../components/MealTimeline.vue'
import ProgressBar from '../components/ProgressBar.vue'
import type { AiRecognizeResult, MealIngredient, MealType } from '../types'

const mealsStore = useMealsStore()
const profileStore = useProfileStore()
const settingsStore = useSettingsStore()
const targets = useTargets()

const intake = computed(() => sumIntake(mealsStore.todayMeals))
const score = computed(() => dayScore(intake.value, targets.value))

const sortedKeys = computed(() =>
  sortByRelevance(NUTRIENT_KEYS, profileStore.profile, targets.value),
)

const matchedCount = computed(
  () => NUTRIENT_KEYS.filter((k) => intake.value[k] >= targets.value[k].target).length,
)

/** 达标/缺口标签（各取前 2-3 个，用于评分卡片） */
const okTags = computed(() =>
  sortedKeys.value
    .filter((k) => intake.value[k] >= targets.value[k].target)
    .slice(0, 3)
    .map((k) => NUTRIENTS[k].name),
)
const missingTags = computed(() =>
  sortedKeys.value
    .filter((k) => intake.value[k] < targets.value[k].target)
    .sort((a, b) => intake.value[a] / targets.value[a].target - intake.value[b] / targets.value[b].target)
    .slice(0, 2)
    .map((k) => ({
      name: NUTRIENTS[k].name,
      gapPct: Math.round((1 - intake.value[k] / targets.value[k].target) * 100),
    })),
)

function mealTypeNow(): MealType {
  const h = new Date().getHours()
  if (h < 10) return '早餐'
  if (h < 14) return '午餐'
  if (h < 20) return '晚餐'
  return '加餐'
}

function onAddMeal(result: AiRecognizeResult) {
  mealsStore.addMeal({
    type: mealTypeNow(),
    title: result.title,
    ingredients: result.ingredients,
    source: 'ai',
  })
}

function onUpdateMeal(id: string, ingredients: MealIngredient[]) {
  mealsStore.updateMeal(id, { ingredients })
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

    <!-- 关键营养素实时进度列表 -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
      <div class="flex justify-between items-center">
        <h3 class="font-bold text-slate-800 text-sm">今日核心微量元素摄入</h3>
        <span class="text-xs text-slate-400">
          对比：{{ settingsStore.standard === 'basic' ? '基础DRIs' : '进阶推荐' }}
        </span>
      </div>

      <div class="space-y-3">
        <div v-for="key in sortedKeys" :key="key" class="space-y-1">
          <div class="flex justify-between text-xs">
            <span class="font-medium text-slate-700 flex items-center gap-1">
              {{ NUTRIENTS[key].name }}
              <span class="text-[10px] text-slate-400">({{ NUTRIENTS[key].unit }})</span>
              <i
                v-if="targets[key].pinned"
                class="fa-solid fa-star text-amber-400 text-[9px]"
                title="你的饮食偏好重点关注项"
              ></i>
            </span>
            <span class="text-slate-500">
              <b
                :class="
                  intake[key] >= targets[key].target ? 'text-mint-600' : 'text-slate-800'
                "
                >{{ intake[key] }}</b
              >
              / {{ targets[key].target }}
              <i
                v-if="intake[key] > targets[key].ul"
                class="fa-solid fa-circle-exclamation text-rose-500 text-[10px] ml-0.5"
                :title="`超过耐受上限 ${targets[key].ul}${NUTRIENTS[key].unit}`"
              ></i>
            </span>
          </div>
          <ProgressBar
            :ratio="intake[key] / targets[key].target"
            :reached="intake[key] >= targets[key].target"
          />
        </div>
      </div>
    </div>

    <MealTimeline
      :meals="mealsStore.todayMeals"
      @remove="mealsStore.removeMeal"
      @update="onUpdateMeal"
    />
  </div>
</template>
