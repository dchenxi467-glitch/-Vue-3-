import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { loadData, debouncedSave } from '../services/storage'
import type { UserProfile } from '../types'

const DEFAULT_PROFILE: UserProfile = {
  gender: 'female',
  age: 28,
  weight: 55,
  activity: 'medium',
  diet: 'omnivore',
  goals: ['sleep', 'fatigue'],
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile>(loadData('profile', DEFAULT_PROFILE))

  const save = debouncedSave<UserProfile>('profile')
  watch(profile, (p) => save(p), { deep: true })

  function update(patch: Partial<UserProfile>) {
    Object.assign(profile.value, patch)
  }

  return { profile, update }
})
