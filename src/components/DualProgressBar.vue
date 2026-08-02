<script setup lang="ts">
import { computed } from 'vue'
import { mid } from '../services/nutritionEngine'
import type { IntakeRange } from '../types'

/**
 * 双轨/分段进度条（营养来源隔离呈现核心组件）
 * 绿段=天然食物，橙段=日照合成(仅VD)，紫段=膳食补充剂，红段=超 UL 部分
 * 100% 目标位置绘制半透明标尺虚线
 */
const props = withDefaults(
  defineProps<{
    food: IntakeRange
    supplement?: number
    sun?: IntakeRange
    target: number
    ul: number
    /** 纯食物模式：只渲染绿色食物轨 */
    foodOnly?: boolean
  }>(),
  { supplement: 0, sun: undefined, foodOnly: false },
)

const foodMid = computed(() => mid(props.food))
const sunMid = computed(() => (props.sun ? mid(props.sun) : 0))
const supp = computed(() => (props.foodOnly ? 0 : props.supplement))
const sun = computed(() => (props.foodOnly ? 0 : sunMid.value))

const total = computed(() => foodMid.value + sun.value + supp.value)

/** 刻度：保证目标线、总量都可见；UL 在视野内时也可见 */
const scale = computed(() => {
  const base = Math.max(total.value, props.target) * 1.15
  return Math.max(base, Math.min(props.ul, base * 1.0))
})

const pct = (v: number) => Math.min(100, (v / scale.value) * 100)

const foodW = computed(() => pct(foodMid.value))
const sunW = computed(() => pct(foodMid.value + sun.value) - foodW.value)
/** 补充剂在 UL 内的部分与超 UL 部分分开渲染 */
const suppStart = computed(() => foodMid.value + sun.value)
const suppNormalW = computed(() => {
  const normalEnd = Math.min(total.value, props.ul)
  return Math.max(0, pct(normalEnd) - pct(suppStart.value))
})
const overUlW = computed(() =>
  total.value > props.ul ? pct(total.value) - pct(props.ul) : 0,
)

const targetLineLeft = computed(() => pct(props.target))
const ulLineLeft = computed(() => pct(props.ul))
const showUlLine = computed(() => props.ul <= scale.value)
</script>

<template>
  <div class="w-full">
    <div class="relative w-full bg-slate-100 h-2.5 rounded-full">
      <!-- 天然食物轨（绿） -->
      <div
        class="absolute left-0 top-0 h-full bg-mint-500 rounded-l-full transition-all duration-500"
        :style="{ width: foodW + '%' }"
      ></div>
      <!-- 日照合成轨（橙，仅 VD） -->
      <div
        v-if="sun > 0"
        class="absolute top-0 h-full bg-amber-400 transition-all duration-500"
        :style="{ left: foodW + '%', width: sunW + '%' }"
      ></div>
      <!-- 补充剂轨（紫） -->
      <div
        v-if="suppNormalW > 0"
        class="absolute top-0 h-full bg-violet-500 transition-all duration-500"
        :class="{ 'rounded-r-full': overUlW === 0 }"
        :style="{ left: pct(suppStart) + '%', width: suppNormalW + '%' }"
      ></div>
      <!-- 超 UL 部分（红） -->
      <div
        v-if="overUlW > 0"
        class="absolute top-0 h-full bg-red-500 rounded-r-full transition-all duration-500"
        :style="{ left: ulLineLeft + '%', width: overUlW + '%' }"
      ></div>
      <!-- 100% 目标标尺虚线 -->
      <div
        class="absolute top-[-3px] bottom-[-3px] w-px border-l border-dashed border-slate-500/60"
        :style="{ left: targetLineLeft + '%' }"
        title="100% 目标线"
      ></div>
      <!-- UL 标尺线 -->
      <div
        v-if="showUlLine"
        class="absolute top-[-3px] bottom-[-3px] w-px bg-red-400/70"
        :style="{ left: ulLineLeft + '%' }"
        title="UL 最高耐受线"
      ></div>
    </div>
  </div>
</template>
