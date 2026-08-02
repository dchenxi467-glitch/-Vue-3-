<script setup lang="ts">
import { ref } from 'vue'
import { foodName } from '../data/foods'
import { formatGrams, mealLabel } from '../services/nutritionEngine'
import { aiService } from '../services/aiService'
import type { MealIngredient, MealKind, MealRecord } from '../types'

const props = defineProps<{
  meals: MealRecord[]
}>()

const emit = defineEmits<{
  remove: [id: string]
  update: [
    id: string,
    patch: Partial<Pick<MealRecord, 'title' | 'ingredients' | 'kind'>>,
  ]
}>()

const editingId = ref<string | null>(null)
const draft = ref<MealIngredient[]>([])
const draftTitle = ref('')
const draftKind = ref<MealKind>('meal')
const reRecognizing = ref(false)

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function label(meal: MealRecord): string {
  return mealLabel(meal, props.meals)
}

function summary(meal: MealRecord): string {
  return meal.ingredients.map((i) => `${foodName(i.foodId)} ${formatGrams(i)}`).join('、')
}

function startEdit(meal: MealRecord) {
  editingId.value = meal.id
  draft.value = meal.ingredients.map((i) => ({ ...i }))
  draftTitle.value = meal.title
  draftKind.value = meal.kind
}

function removeDraftItem(idx: number) {
  draft.value.splice(idx, 1)
}

function saveEdit(id: string) {
  const cleaned = draft.value.filter((i) => i.gramsMax > 0)
  emit('update', id, {
    title: draftTitle.value.trim() || '未命名餐食',
    ingredients: cleaned,
    kind: draftKind.value,
  })
  editingId.value = null
}

/** 重新上传图片识别：替换该餐的食材列表（需求 10：任意餐次可完全重编） */
async function reRecognize(id: string) {
  if (reRecognizing.value) return
  reRecognizing.value = true
  try {
    const recognized = await aiService.recognizeImage(`mock://re-${id}`)
    draft.value = recognized.ingredients
    draftTitle.value = recognized.title
  } finally {
    reRecognizing.value = false
  }
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
        <div
          class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white"
          :class="meal.kind === 'snack' ? 'bg-amber-400' : 'bg-mint-500'"
        ></div>

        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0">
            <span class="text-[10px] font-semibold text-slate-400 uppercase">
              {{ formatTime(meal.timestamp) }} · {{ label(meal) }}
              <span v-if="meal.images && meal.images > 1" class="text-mint-500">
                · {{ meal.images }} 图合并
              </span>
            </span>

            <!-- 查看模式 -->
            <template v-if="editingId !== meal.id">
              <h4 class="text-xs font-bold text-slate-800 mt-0.5">{{ meal.title }}</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">{{ summary(meal) }}</p>
            </template>

            <!-- 编辑模式：标题 / 餐次 / 食材区间克重 -->
            <div v-else class="mt-1.5 space-y-2">
              <input
                v-model="draftTitle"
                type="text"
                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-mint-500"
                placeholder="餐食名称"
              />

              <div class="flex items-center gap-2 text-[11px]">
                <span class="text-slate-400">餐次：</span>
                <button
                  @click="draftKind = 'meal'"
                  :class="draftKind === 'meal' ? 'bg-mint-500 text-white' : 'bg-slate-100 text-slate-500'"
                  class="px-2 py-0.5 rounded-md transition-colors"
                >
                  正餐
                </button>
                <button
                  @click="draftKind = 'snack'"
                  :class="draftKind === 'snack' ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500'"
                  class="px-2 py-0.5 rounded-md transition-colors"
                >
                  加餐
                </button>
                <button
                  @click="reRecognize(meal.id)"
                  :disabled="reRecognizing"
                  class="ml-auto text-mint-600 hover:text-mint-700 disabled:opacity-50"
                  title="重新上传图片识别，替换当前食材"
                >
                  <i class="fa-solid fa-camera" :class="{ 'fa-beat': reRecognizing }"></i>
                  {{ reRecognizing ? '识别中…' : '重新识别' }}
                </button>
              </div>

              <div
                v-for="(item, idx) in draft"
                :key="item.foodId"
                class="flex items-center gap-1 text-[11px]"
              >
                <span class="text-slate-600 shrink-0">{{ foodName(item.foodId) }}</span>
                <input
                  v-model.number="item.gramsMin"
                  type="number"
                  min="0"
                  class="w-14 bg-slate-50 border border-slate-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-mint-500"
                />
                <span class="text-slate-400">~</span>
                <input
                  v-model.number="item.gramsMax"
                  type="number"
                  min="0"
                  class="w-14 bg-slate-50 border border-slate-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-mint-500"
                />
                <span class="text-slate-400">g</span>
                <button
                  @click="removeDraftItem(idx)"
                  class="text-slate-300 hover:text-rose-400 ml-auto"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div class="flex gap-2">
                <button
                  @click="saveEdit(meal.id)"
                  class="text-[11px] bg-mint-500 text-white px-2.5 py-1 rounded-lg font-medium"
                >
                  保存修正
                </button>
                <button
                  @click="editingId = null"
                  class="text-[11px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg"
                >
                  取消
                </button>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-1 shrink-0">
            <button
              v-if="editingId !== meal.id"
              @click="startEdit(meal)"
              class="text-slate-300 hover:text-mint-500 text-xs p-1"
              title="编辑该餐"
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
