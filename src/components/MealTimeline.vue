<script setup lang="ts">
import { ref } from 'vue'
import { foodName } from '../data/foods'
import type { MealIngredient, MealRecord } from '../types'

defineProps<{
  meals: MealRecord[]
}>()

const emit = defineEmits<{
  remove: [id: string]
  update: [id: string, ingredients: MealIngredient[]]
}>()

const editingId = ref<string | null>(null)
const draft = ref<MealIngredient[]>([])

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function summary(meal: MealRecord): string {
  return meal.ingredients.map((i) => `${foodName(i.foodId)} ${i.grams}g`).join('、')
}

function startEdit(meal: MealRecord) {
  editingId.value = meal.id
  draft.value = meal.ingredients.map((i) => ({ ...i }))
}

function removeDraftItem(idx: number) {
  draft.value.splice(idx, 1)
}

function saveEdit(id: string) {
  const cleaned = draft.value.filter((i) => i.grams > 0)
  emit('update', id, cleaned)
  editingId.value = null
}
</script>

<template>
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
    <h3 class="font-bold text-slate-800 text-sm">今日饮食轨迹</h3>

    <p v-if="meals.length === 0" class="text-xs text-slate-400 py-2 text-center">
      今天还没有记录，用上方 AI 识别添加第一餐吧
    </p>

    <div v-else class="space-y-3 relative border-l-2 border-slate-100 ml-2 pl-4">
      <div v-for="meal in meals" :key="meal.id" class="relative">
        <div class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-mint-500 ring-4 ring-white"></div>

        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0">
            <span class="text-[10px] font-semibold text-slate-400 uppercase">
              {{ formatTime(meal.timestamp) }} · {{ meal.type }}
            </span>
            <h4 class="text-xs font-bold text-slate-800 mt-0.5">{{ meal.title }}</h4>

            <!-- 查看模式 -->
            <p v-if="editingId !== meal.id" class="text-[11px] text-slate-500 mt-0.5">
              {{ summary(meal) }}
            </p>

            <!-- 编辑模式：手动修正克重 / 删除食材 -->
            <div v-else class="mt-1.5 space-y-1.5">
              <div
                v-for="(item, idx) in draft"
                :key="item.foodId"
                class="flex items-center gap-1.5 text-[11px]"
              >
                <span class="text-slate-600 shrink-0">{{ foodName(item.foodId) }}</span>
                <input
                  v-model.number="item.grams"
                  type="number"
                  min="0"
                  class="w-16 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-mint-500"
                />
                <span class="text-slate-400">g</span>
                <button
                  @click="removeDraftItem(idx)"
                  class="text-slate-300 hover:text-rose-400 ml-auto"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
              <button
                @click="saveEdit(meal.id)"
                class="text-[11px] bg-mint-500 text-white px-2.5 py-1 rounded-lg font-medium"
              >
                保存修正
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-1 shrink-0">
            <button
              v-if="editingId !== meal.id"
              @click="startEdit(meal)"
              class="text-slate-300 hover:text-mint-500 text-xs p-1"
              title="编辑食材克重"
            >
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button
              @click="emit('remove', meal.id)"
              class="text-slate-300 hover:text-rose-400 text-xs p-1"
              title="删除该餐"
            >
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
