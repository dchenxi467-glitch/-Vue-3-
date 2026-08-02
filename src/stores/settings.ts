import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { loadData, debouncedSave } from '../services/storage'
import type { NutrientKey, Standard } from '../types'

interface SettingsState {
  standard: Standard
  /** 用户手动锁定的每日目标值（覆盖 RNI 计算结果） */
  overrides: Partial<Record<NutrientKey, number>>
}

const DEFAULT_SETTINGS: SettingsState = { standard: 'basic', overrides: {} }

export const useSettingsStore = defineStore('settings', () => {
  const loaded = loadData('settings', DEFAULT_SETTINGS)
  const standard = ref<Standard>(loaded.standard)
  const overrides = ref<SettingsState['overrides']>(loaded.overrides ?? {})

  const save = debouncedSave<SettingsState>('settings')
  watch([standard, overrides], () => save({ standard: standard.value, overrides: overrides.value }), { deep: true })

  function setStandard(s: Standard) {
    standard.value = s
  }

  function setOverride(key: NutrientKey, value: number | null) {
    if (value === null || isNaN(value) || value <= 0) {
      delete overrides.value[key]
    } else {
      overrides.value[key] = value
    }
  }

  return { standard, overrides, setStandard, setOverride }
})
