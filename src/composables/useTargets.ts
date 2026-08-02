import { computed } from 'vue'
import { useProfileStore } from '../stores/profile'
import { useSettingsStore } from '../stores/settings'
import { calcTargets } from '../services/nutritionEngine'
import type { NutrientKey, NutrientTarget } from '../types'

/**
 * 当前生效的营养素目标值：
 * 画像 + 评估标准 → calcTargets，再叠加用户手动锁定的 override
 */
export function useTargets() {
  const profileStore = useProfileStore()
  const settingsStore = useSettingsStore()

  return computed<Record<NutrientKey, NutrientTarget>>(() => {
    const base = calcTargets(profileStore.profile, settingsStore.standard)
    for (const [key, value] of Object.entries(settingsStore.overrides)) {
      const k = key as NutrientKey
      if (base[k] && typeof value === 'number') {
        base[k] = { ...base[k], target: value }
      }
    }
    return base
  })
}
