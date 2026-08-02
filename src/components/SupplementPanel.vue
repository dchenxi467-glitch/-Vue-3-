<script setup lang="ts">
import { computed, ref } from 'vue'
import { SUPPLEMENT_PRESETS } from '../data/supplements'
import { NUTRIENTS, NUTRIENT_KEYS } from '../data/nutrients'
import { useSupplementsStore } from '../stores/supplements'
import type { NutrientKey } from '../types'

const store = useSupplementsStore()

const expanded = ref(false)
const presetId = ref(SUPPLEMENT_PRESETS[0].id)
const doses = ref(1)

// 自定义录入
const customName = ref('')
const customNutrient = ref<NutrientKey>('vc')
const customAmount = ref<number | null>(null)

const isCustom = computed(() => presetId.value === 'custom')

function submit() {
  if (isCustom.value) {
    const name = customName.value.trim()
    const amount = customAmount.value
    if (!name || !amount || amount <= 0) return
    store.addSupplement({
      name,
      doses: 1,
      perDose: { [customNutrient.value]: amount },
    })
    customName.value = ''
    customAmount.value = null
  } else {
    const preset = SUPPLEMENT_PRESETS.find((p) => p.id === presetId.value)
    if (!preset || doses.value <= 0) return
    store.addSupplement({
      name: preset.name,
      doses: doses.value,
      perDose: preset.perDose,
    })
    doses.value = 1
  }
  expanded.value = false
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap gap-1.5 items-center">
      <!-- 已打卡补充剂胶囊 -->
      <span
        v-for="s in store.todaySupplements"
        :key="s.id"
        class="inline-flex items-center gap-1 text-[11px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-1 rounded-full"
      >
        💊 {{ s.name }} ×{{ s.doses }}
        <button
          @click="store.removeSupplement(s.id)"
          class="text-violet-300 hover:text-rose-500 ml-0.5"
          title="取消打卡"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </span>

      <!-- 录入入口 -->
      <button
        @click="expanded = !expanded"
        class="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-dashed transition-colors"
        :class="
          expanded
            ? 'border-violet-400 text-violet-600 bg-violet-50'
            : 'border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600'
        "
      >
        <i class="fa-solid fa-plus text-[9px]"></i> 录入补充剂
      </button>
    </div>

    <!-- 录入表单 -->
    <div v-if="expanded" class="bg-violet-50/60 border border-violet-100 rounded-xl p-2.5 space-y-2">
      <div class="flex gap-2 items-center text-xs">
        <select
          v-model="presetId"
          class="flex-1 bg-white border border-violet-200 rounded-lg p-1.5 text-xs"
        >
          <option v-for="p in SUPPLEMENT_PRESETS" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
          <option value="custom">自定义…</option>
        </select>

        <template v-if="!isCustom">
          <input
            v-model.number="doses"
            type="number"
            min="1"
            class="w-14 bg-white border border-violet-200 rounded-lg p-1.5 text-xs text-center"
          />
          <span class="text-slate-500 text-[11px]">粒/片</span>
        </template>
      </div>

      <div v-if="isCustom" class="flex gap-1.5 items-center text-xs flex-wrap">
        <input
          v-model="customName"
          type="text"
          placeholder="名称，如：葡萄糖酸锌"
          class="flex-1 min-w-28 bg-white border border-violet-200 rounded-lg p-1.5 text-xs"
        />
        <select
          v-model="customNutrient"
          class="bg-white border border-violet-200 rounded-lg p-1.5 text-xs"
        >
          <option v-for="key in NUTRIENT_KEYS" :key="key" :value="key">
            {{ NUTRIENTS[key].name }}
          </option>
        </select>
        <input
          v-model.number="customAmount"
          type="number"
          min="0"
          placeholder="含量"
          class="w-16 bg-white border border-violet-200 rounded-lg p-1.5 text-xs"
        />
        <span class="text-slate-400 text-[11px]">{{ NUTRIENTS[customNutrient].unit }}</span>
      </div>

      <button
        @click="submit"
        class="w-full bg-violet-500 hover:bg-violet-600 text-white py-1.5 rounded-lg text-xs font-medium transition-colors"
      >
        打卡记录
      </button>
    </div>
  </div>
</template>
