<script setup lang="ts">
import type { Warning } from '../types'

withDefaults(
  defineProps<{
    warnings: Warning[]
    title?: string
    headerIcon?: string
  }>(),
  {
    title: 'AI 缺乏可能性预警分析',
    headerIcon: 'fa-solid fa-triangle-exclamation',
  },
)
</script>

<template>
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
    <div class="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
      <i :class="headerIcon"></i>
      <h3>{{ title }}</h3>
    </div>

    <p v-if="warnings.length === 0" class="text-xs text-slate-500 bg-mint-50/60 border border-mint-100 rounded-xl p-3">
      <i class="fa-solid fa-circle-check text-mint-600 mr-1"></i>
      该周期内各项营养素摄入整体良好，未发现持续性缺乏风险，继续保持！
    </p>

    <div v-else class="space-y-2.5 text-xs">
      <div
        v-for="w in warnings"
        :key="w.nutrient + w.title"
        class="p-3 rounded-xl border space-y-1"
        :class="
          w.level === 'high'
            ? 'bg-rose-50 border-rose-100'
            : 'bg-amber-50 border-amber-100'
        "
      >
        <div
          class="font-bold flex justify-between"
          :class="w.level === 'high' ? 'text-rose-800' : 'text-amber-800'"
        >
          <span>
            <i :class="w.level === 'high' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-bolt'" class="mr-1"></i>
            {{ w.title }}
          </span>
          <span
            class="text-[10px] font-normal px-1.5 py-0.5 rounded shrink-0"
            :class="
              w.level === 'high'
                ? 'bg-rose-200/50 text-rose-700'
                : 'bg-amber-200/50 text-amber-700'
            "
          >
            {{ w.level === 'high' ? '高风险' : '中风险' }}
          </span>
        </div>
        <p class="text-slate-600 text-[11px] leading-relaxed">{{ w.analysis }}</p>
        <div
          v-if="w.advice"
          class="pt-1 text-[11px] font-medium"
          :class="w.level === 'high' ? 'text-rose-700' : 'text-amber-700'"
        >
          👉 改善建议：{{ w.advice }}
        </div>
      </div>
    </div>
  </div>
</template>
