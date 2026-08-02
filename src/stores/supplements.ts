import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { loadData, debouncedSave } from '../services/storage'
import { generateSeedSupplements } from '../data/seeds'
import { isSameDay } from '../services/nutritionEngine'
import type { NutrientKey, SupplementRecord } from '../types'

interface SupplementsState {
  list: SupplementRecord[]
  /** 晒太阳打卡：日期(yyyy-mm-dd) → 裸露四肢分钟数 */
  sunLog: Record<string, number>
}

function todayKey(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const useSupplementsStore = defineStore('supplements', () => {
  const loaded = loadData<SupplementsState>('supplements', {
    list: generateSeedSupplements(),
    sunLog: {},
  })
  const list = ref<SupplementRecord[]>(loaded.list)
  const sunLog = ref<Record<string, number>>(loaded.sunLog ?? {})

  const save = debouncedSave<SupplementsState>('supplements')
  watch(
    [list, sunLog],
    () => save({ list: list.value, sunLog: sunLog.value }),
    { deep: true },
  )

  /** 今日已打卡补充剂（时间正序） */
  const todaySupplements = computed(() =>
    list.value
      .filter((s) => isSameDay(s.timestamp, Date.now()))
      .sort((a, b) => a.timestamp - b.timestamp),
  )

  /** 今日晒太阳分钟数 */
  const todaySunMinutes = computed(() => sunLog.value[todayKey()] ?? 0)

  function addSupplement(input: {
    name: string
    doses: number
    perDose: Partial<Record<NutrientKey, number>>
  }) {
    list.value.push({
      id: `supp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      name: input.name,
      doses: input.doses,
      perDose: input.perDose,
    })
  }

  function removeSupplement(id: string) {
    list.value = list.value.filter((s) => s.id !== id)
  }

  function setSunMinutes(minutes: number) {
    const key = todayKey()
    if (minutes <= 0) {
      delete sunLog.value[key]
    } else {
      sunLog.value[key] = Math.round(minutes)
    }
  }

  return {
    list,
    todaySupplements,
    todaySunMinutes,
    addSupplement,
    removeSupplement,
    setSunMinutes,
  }
})
