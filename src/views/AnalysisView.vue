<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildHeatmap, buildUlWarnings, buildWarnings } from '../services/analytics'
import { calcTargets } from '../services/nutritionEngine'
import { useMealsStore } from '../stores/meals'
import { useProfileStore } from '../stores/profile'
import { useSupplementsStore } from '../stores/supplements'
import { useTargets } from '../composables/useTargets'
import HeatmapGrid from '../components/HeatmapGrid.vue'
import WarningCard from '../components/WarningCard.vue'

const mealsStore = useMealsStore()
const supplementsStore = useSupplementsStore()
const profileStore = useProfileStore()
const targets = useTargets()

const period = ref<'7d' | '30d'>('7d')
const days = computed(() => (period.value === '7d' ? 7 : 30))

/** 长期热力：食物+补充剂总摄入，按当前标准 */
const heatmap = computed(() =>
  buildHeatmap(mealsStore.meals, supplementsStore.list, targets.value, days.value),
)

/** 缺乏预警：判定基准固定为【基础标准】（需求 8：超 50% 天数低于基础推荐量） */
const basicTargets = computed(() => calcTargets(profileStore.profile, 'basic'))
const deficiencyWarnings = computed(() =>
  buildWarnings(mealsStore.meals, supplementsStore.list, basicTargets.value, days.value),
)

/** UL 越界善意预警（单日/多日平均超 UL） */
const ulWarnings = computed(() =>
  buildUlWarnings(mealsStore.meals, supplementsStore.list, targets.value, days.value),
)

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

    <p class="text-[10px] text-slate-400 px-1 -my-1">
      热力统计口径：天然食物 + 膳食补充剂总摄入；缺乏预警以基础 DRIs 标准判定
    </p>

    <HeatmapGrid :items="heatmap" :period-label="periodLabel" />

    <!-- UL 越界预警（仅在存在时显示） -->
    <WarningCard
      v-if="ulWarnings.length > 0"
      :warnings="ulWarnings"
      title="UL 最高耐受量善意预警"
      header-icon="fa-solid fa-shield-halved"
    />

    <!-- 长期缺乏预警 -->
    <WarningCard :warnings="deficiencyWarnings" />
  </div>
</template>
