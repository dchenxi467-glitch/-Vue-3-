import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { loadData, debouncedSave } from '../services/storage'
import { generateSeedMeals } from '../data/seeds'
import { isSameDay } from '../services/nutritionEngine'
import type { MealRecord, MealKind, MealIngredient, MealSource } from '../types'

export const useMealsStore = defineStore('meals', () => {
  // 首启无数据 → 注入最近 10 天种子餐食
  const meals = ref<MealRecord[]>(loadData('meals', generateSeedMeals()))

  const save = debouncedSave<MealRecord[]>('meals')
  watch(meals, (m) => save(m), { deep: true })

  const sortedMeals = computed(() =>
    [...meals.value].sort((a, b) => b.timestamp - a.timestamp),
  )

  /** 今日餐食（时间倒序） */
  const todayMeals = computed(() =>
    sortedMeals.value.filter((m) => isSameDay(m.timestamp, Date.now())),
  )

  function addMeal(input: {
    kind: MealKind
    title: string
    ingredients: MealIngredient[]
    source: MealSource
    images?: number
    timestamp?: number
  }): MealRecord {
    const record: MealRecord = {
      id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: input.timestamp ?? Date.now(),
      kind: input.kind,
      title: input.title,
      ingredients: input.ingredients,
      source: input.source,
      images: input.images,
    }
    meals.value.push(record)
    return record
  }

  function removeMeal(id: string) {
    meals.value = meals.value.filter((m) => m.id !== id)
  }

  function updateMeal(
    id: string,
    patch: Partial<Pick<MealRecord, 'title' | 'ingredients' | 'kind'>>,
  ) {
    const meal = meals.value.find((m) => m.id === id)
    if (meal) Object.assign(meal, patch)
  }

  return { meals, sortedMeals, todayMeals, addMeal, removeMeal, updateMeal }
})
