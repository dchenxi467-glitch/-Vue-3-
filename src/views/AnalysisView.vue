<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildHeatmap, buildWarnings } from '../services/analytics'
import { useMealsStore } from '../stores/meals'
import { useTargets } from '../composables/useTargets'
import HeatmapGrid from '../components/HeatmapGrid.vue'
import WarningCard from '../components/WarningCard.vue'

const mealsStore = useMealsStore()
const targets = useTargets()

const period = ref<'7d' | '30d'>('7d')
const days = computed(() => (period.value === '7d' ? 7 : 30))

const heatmap = computed(() => buildHeatmap(mealsStore.meals, targets.value, days.value))
const warnings = computed(() => buildWarnings(mealsStore.meals, targets.value, days.value))
const periodLabel = computed(() => (period.value === '7d' ? '7天平均' : '30天平均'))
</script>

<template>
  <div class="space-y-4">
    <!-- 时间周期切换 -->
    <div class="flex bg-slate-200/60 p-1 rounded-xl text-xs font-medium">
      <button
        @click="period = '7d'"
        :class="period === '7d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'"
        class="flex-1 py-1.5 rounded-lg text-center transition-all"
      >
        近 7 天趋势
      </button>
      <button
        @click="period = '30d'"
        :class="period === '30d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'"
        class="flex-1 py-1.5 rounded-lg text-center transition-all"
      >
        近 30 天监测
      </button>
    </div>

    <HeatmapGrid :items="heatmap" :period-label="periodLabel" />

    <WarningCard :warnings="warnings" />
  </div>
</template>
