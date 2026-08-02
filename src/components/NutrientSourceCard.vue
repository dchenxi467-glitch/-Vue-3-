<script setup lang="ts">
import { computed, ref } from 'vue'
import { NUTRIENTS, NUTRIENT_KEYS } from '../data/nutrients'
import {
  dayScore,
  mid,
  round1,
  sortByRelevance,
  sumIntake,
  sumSupplements,
  sunVD,
} from '../services/nutritionEngine'
import { useMealsStore } from '../stores/meals'
import { useProfileStore } from '../stores/profile'
import { useSupplementsStore } from '../stores/supplements'
import { useTargets } from '../composables/useTargets'
import DualProgressBar from './DualProgressBar.vue'
import SupplementPanel from './SupplementPanel.vue'
import type { IntakeRange } from '../types'

const mealsStore = useMealsStore()
const supplementsStore = useSupplementsStore()
const profileStore = useProfileStore()
const targets = useTargets()

/** 全景模式（食物+补充剂）/ 纯食物模式 */
const foodOnly = ref(false)

const foodIntake = computed(() => sumIntake(mealsStore.todayMeals))
const suppIntake = computed(() => sumSupplements(supplementsStore.todaySupplements))
const sunRange = computed(() => sunVD(supplementsStore.todaySunMinutes))

const sortedKeys = computed(() =>
  sortByRelevance(NUTRIENT_KEYS, profileStore.profile, targets.value),
)

/** 单营养素的合计中值（食物+日照+补充剂） */
function totalMid(key: (typeof NUTRIENT_KEYS)[number]): number {
  return (
    mid(foodIntake.value[key]) +
    (key === 'vd' ? mid(sunRange.value) : 0) +
    mid(suppIntake.value[key])
  )
}

function fmtRange(r: IntakeRange): string {
  return r.min === r.max ? `${r.min}` : `${r.min}~${r.max}`
}

/** AI 膳食诊断：纯食物达成率 + 依赖补充剂拉平的营养素 */
const diagnosis = computed(() => {
  const foodScore = dayScore(foodIntake.value, targets.value)
  const carried = sortedKeys.value
    .filter(
      (k) =>
        mid(foodIntake.value[k]) < targets.value[k].target &&
        totalMid(k) >= targets.value[k].target,
    )
    .map((k) => NUTRIENTS[k].name)
  if (carried.length > 0) {
    return `天然食物微量元素达成率 ${foodScore}%。${carried.slice(0, 3).join('、')}依赖补充剂拉平，建议增加对应膳食来源。`
  }
  if (foodScore >= 80) {
    return `天然食物微量元素达成率 ${foodScore}%，饮食结构良好，继续保持！`
  }
  return `天然食物微量元素达成率 ${foodScore}%，部分营养素仍未达标，建议优化今日膳食结构。`
})

/** 晒太阳打卡 */
const sunInput = computed({
  get: () => supplementsStore.todaySunMinutes || '',
  set: (v: string | number) => supplementsStore.setSunMinutes(Number(v) || 0),
})
</script>

<template>
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
    <!-- 标题 + 视图切换 -->
    <div class="flex justify-between items-center">
      <h3 class="font-bold text-slate-800 text-sm">🥗 营养来源结构分析</h3>
      <div class="bg-slate-100 p-0.5 rounded-lg flex text-[11px] font-medium">
        <button
          @click="foodOnly = false"
          :class="!foodOnly ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'"
          class="px-2 py-0.5 rounded-md transition-all"
        >
          📊 全景
        </button>
        <button
          @click="foodOnly = true"
          :class="foodOnly ? 'bg-white text-mint-700 shadow-sm' : 'text-slate-500'"
          class="px-2 py-0.5 rounded-md transition-all"
        >
          🥦 纯食物
        </button>
      </div>
    </div>

    <!-- AI 膳食诊断 -->
    <p class="text-[11px] text-slate-600 bg-mint-50/70 border border-mint-100 rounded-xl px-2.5 py-2 leading-relaxed">
      💡 <b>AI 膳食诊断</b>：{{ diagnosis }}
    </p>

    <!-- 营养素双轨列表 -->
    <div class="space-y-3.5">
      <div v-for="key in sortedKeys" :key="key" class="space-y-1">
        <!-- 行 1：名称 + 来源明细 -->
        <div class="flex justify-between text-xs items-baseline">
          <span class="font-medium text-slate-700 flex items-center gap-1">
            {{ NUTRIENTS[key].name }}
            <span class="text-[10px] text-slate-400">({{ NUTRIENTS[key].unit }})</span>
            <i
              v-if="targets[key].pinned"
              class="fa-solid fa-star text-amber-400 text-[9px]"
              title="重点关注项"
            ></i>
          </span>
          <span class="text-[10px] text-slate-500 text-right">
            <span class="text-mint-700">食物 {{ fmtRange(foodIntake[key]) }}</span>
            <template v-if="key === 'vd' && mid(sunRange) > 0">
              <span class="text-amber-600"> + 日照 ~{{ round1(mid(sunRange)) }}</span>
            </template>
            <template v-if="mid(suppIntake[key]) > 0">
              <span class="text-violet-600"> + 补充剂 {{ fmtRange(suppIntake[key]) }}</span>
            </template>
          </span>
        </div>

        <!-- 行 2：目标 / UL / 总计 -->
        <div class="flex justify-between text-[10px] text-slate-400">
          <span>目标 {{ targets[key].target }} · UL {{ targets[key].ul }}</span>
          <span>
            总计
            <b
              :class="
                totalMid(key) > targets[key].ul
                  ? 'text-red-500'
                  : totalMid(key) >= targets[key].target
                    ? 'text-mint-600'
                    : 'text-slate-600'
              "
            >
              {{ round1(totalMid(key)) }} ({{ Math.round((totalMid(key) / targets[key].target) * 100) }}%)
            </b>
            <i
              v-if="totalMid(key) > targets[key].ul"
              class="fa-solid fa-circle-exclamation text-red-500 ml-0.5"
              title="超出最高耐受量"
            ></i>
            <span v-else-if="totalMid(key) >= targets[key].target" class="ml-0.5">✨</span>
          </span>
        </div>

        <!-- 行 3：双轨进度条 -->
        <DualProgressBar
          :food="foodIntake[key]"
          :supplement="mid(suppIntake[key])"
          :sun="key === 'vd' ? sunRange : undefined"
          :target="targets[key].target"
          :ul="targets[key].ul"
          :food-only="foodOnly"
        />
      </div>
    </div>

    <!-- 晒太阳打卡 -->
    <div class="border-t border-slate-100 pt-2.5 flex items-center gap-2 text-xs">
      <span class="text-slate-600">☀️ 今日晒太阳</span>
      <input
        v-model="sunInput"
        type="number"
        min="0"
        placeholder="0"
        class="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-400"
      />
      <span class="text-slate-400 text-[11px]">分钟（裸露四肢）</span>
      <span v-if="mid(sunRange) > 0" class="text-amber-600 text-[11px] ml-auto">
        ≈ 合成 VD {{ sunRange.min }}~{{ sunRange.max }}μg
      </span>
    </div>

    <!-- 补充剂打卡抽屉 -->
    <div class="border-t border-slate-100 pt-2.5">
      <p class="text-[11px] text-slate-500 mb-1.5">💊 今日已打卡补充剂（与食物隔离统计）</p>
      <SupplementPanel />
    </div>
  </div>
</template>
