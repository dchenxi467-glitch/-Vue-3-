<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0 ~ 1+ 的完成比率 */
    ratio: number
    /** 达标后变绿，未达标 amber */
    reached?: boolean
  }>(),
  { reached: false },
)

const width = computed(() => Math.min(100, props.ratio * 100))
const barClass = computed(() => (props.reached ? 'bg-mint-500' : 'bg-amber-400'))
</script>

<template>
  <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
    <div
      class="h-full transition-all duration-500 rounded-full"
      :class="barClass"
      :style="{ width: width + '%' }"
    ></div>
  </div>
</template>
