<script setup lang="ts">
import type { Standard } from '../types'

defineProps<{
  score: number
  matchedCount: number
  totalCount: number
  standard: Standard
  /** 已达标的营养素名（前几个） */
  okTags: string[]
  /** 未达标：名称 + 缺口百分比 */
  missingTags: Array<{ name: string; gapPct: number }>
}>()
</script>

<template>
  <div
    class="bg-gradient-to-br from-mint-500 to-teal-600 text-white rounded-2xl p-4 shadow-lg shadow-mint-500/10 relative overflow-hidden"
  >
    <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
    <div class="flex justify-between items-start mb-3">
      <div>
        <span class="text-xs bg-white/20 px-2 py-0.5 rounded-full text-mint-50">
          今日分析基准：{{ standard === 'basic' ? '中国 2023 DRIs' : '前沿文献进阶推荐' }}
        </span>
        <h2 class="text-2xl font-extrabold mt-1">健康完成度 {{ score }}%</h2>
      </div>
      <div class="text-right">
        <span class="text-xs opacity-80">已达标项</span>
        <p class="text-lg font-bold">{{ matchedCount }} / {{ totalCount }}</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-1.5 pt-1 border-t border-white/15 text-xs">
      <span
        v-for="name in okTags"
        :key="name"
        class="bg-emerald-400/30 text-white px-2 py-0.5 rounded-md flex items-center gap-1"
      >
        <i class="fa-solid fa-check text-[10px]"></i> {{ name }} 达标
      </span>
      <span
        v-for="tag in missingTags"
        :key="tag.name"
        class="bg-amber-300/30 text-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1"
      >
        <i class="fa-solid fa-triangle-exclamation text-[10px]"></i> {{ tag.name }} 缺{{ tag.gapPct }}%
      </span>
    </div>
  </div>
</template>
