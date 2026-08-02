<script setup lang="ts">
import type { NutrientHeat } from '../services/analytics'

defineProps<{
  items: NutrientHeat[]
  periodLabel: string
}>()

const statusMeta = {
  good: {
    card: 'bg-emerald-50/50 border-emerald-100',
    badge: 'bg-emerald-200/60 text-emerald-800',
    label: '充足',
  },
  warning: {
    card: 'bg-amber-50/50 border-amber-100',
    badge: 'bg-amber-200/60 text-amber-800',
    label: '偶有偏低',
  },
  danger: {
    card: 'bg-rose-50/50 border-rose-100',
    badge: 'bg-rose-200/60 text-rose-800',
    label: '持续偏低',
  },
} as const
</script>

<template>
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
    <h3 class="font-bold text-slate-800 text-sm">
      营养素充足度热力卡片（{{ periodLabel }}）
    </h3>

    <div class="grid grid-cols-2 gap-2.5">
      <div
        v-for="item in items"
        :key="item.key"
        class="p-3 rounded-xl border flex flex-col justify-between"
        :class="statusMeta[item.status].card"
      >
        <div class="flex justify-between items-start">
          <span class="text-xs font-bold text-slate-700">{{ item.name }}</span>
          <span
            class="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
            :class="statusMeta[item.status].badge"
          >
            {{ statusMeta[item.status].label }}
          </span>
        </div>
        <div class="mt-2">
          <span class="text-lg font-extrabold text-slate-800">{{ item.avg }}%</span>
          <span class="text-[10px] text-slate-400 ml-1">达标率</span>
        </div>
      </div>
    </div>
  </div>
</template>
