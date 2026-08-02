<script setup lang="ts">
import { NUTRIENTS, NUTRIENT_KEYS } from '../data/nutrients'
import type { Goal, NutrientKey, NutrientTarget, UserProfile } from '../types'

const props = defineProps<{
  profile: UserProfile
  targets: Record<NutrientKey, NutrientTarget>
  overrides: Partial<Record<NutrientKey, number>>
}>()

const emit = defineEmits<{
  updateProfile: [patch: Partial<UserProfile>]
  setOverride: [key: NutrientKey, value: number | null]
}>()

const GOAL_OPTIONS: Array<{ key: Goal; label: string }> = [
  { key: 'sleep', label: '改善睡眠' },
  { key: 'fatigue', label: '缓解疲劳' },
  { key: 'bone', label: '骨骼健康' },
  { key: 'skin', label: '皮肤抗衰' },
  { key: 'immune', label: '免疫提升' },
]

function toggleGoal(goal: Goal) {
  const goals = props.profile.goals.includes(goal)
    ? props.profile.goals.filter((g) => g !== goal)
    : [...props.profile.goals, goal]
  emit('updateProfile', { goals })
}

function onOverrideInput(key: NutrientKey, e: Event) {
  const raw = (e.target as HTMLInputElement).value
  emit('setOverride', key, raw === '' ? null : Number(raw))
}

function numVal(v: number | string): number {
  return typeof v === 'number' ? v : Number(v)
}
</script>

<template>
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
      <i class="fa-solid fa-user-gear text-mint-500"></i> 个人生物学画像
    </h3>

    <div class="grid grid-cols-2 gap-3 text-xs">
      <div>
        <label class="block text-slate-500 mb-1">性别</label>
        <select
          :value="profile.gender"
          @change="emit('updateProfile', { gender: ($event.target as HTMLSelectElement).value as UserProfile['gender'] })"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
        >
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
      </div>
      <div>
        <label class="block text-slate-500 mb-1">年龄</label>
        <input
          :value="profile.age"
          @input="emit('updateProfile', { age: numVal(($event.target as HTMLInputElement).value) })"
          type="number"
          min="1"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
        />
      </div>
      <div>
        <label class="block text-slate-500 mb-1">体重 (kg)</label>
        <input
          :value="profile.weight"
          @input="emit('updateProfile', { weight: numVal(($event.target as HTMLInputElement).value) })"
          type="number"
          min="1"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
        />
      </div>
      <div>
        <label class="block text-slate-500 mb-1">运动强度</label>
        <select
          :value="profile.activity"
          @change="emit('updateProfile', { activity: ($event.target as HTMLSelectElement).value as UserProfile['activity'] })"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
        >
          <option value="low">久坐/轻度</option>
          <option value="medium">中度运动</option>
          <option value="high">高强度健身</option>
        </select>
      </div>
    </div>

    <div>
      <label class="block text-slate-500 text-xs mb-1">饮食偏好（影响预警因子）</label>
      <select
        :value="profile.diet"
        @change="emit('updateProfile', { diet: ($event.target as HTMLSelectElement).value as UserProfile['diet'] })"
        class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium"
      >
        <option value="omnivore">均衡杂食</option>
        <option value="vegan">纯素食（高亮 VB12/铁/锌）</option>
        <option value="keto">低碳生酮（高亮电解质镁）</option>
      </select>
    </div>

    <div>
      <label class="block text-slate-500 text-xs mb-1.5">重点关注目标（决定首页置顶营养素）</label>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="opt in GOAL_OPTIONS"
          :key="opt.key"
          @click="toggleGoal(opt.key)"
          class="text-xs px-2.5 py-1.5 rounded-xl border transition-colors"
          :class="
            profile.goals.includes(opt.key)
              ? 'bg-mint-500 border-mint-500 text-white font-medium'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-mint-500'
          "
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- 自定义每日目标值锁定 -->
    <div class="border-t border-slate-100 pt-3">
      <label class="block text-slate-500 text-xs mb-1">
        自定义每日目标值
        <span class="text-[10px] text-slate-400">（留空 = 按画像自动计算；填写后锁定）</span>
      </label>
      <div class="grid grid-cols-2 gap-x-3 gap-y-2">
        <div v-for="key in NUTRIENT_KEYS" :key="key" class="flex items-center gap-1.5 text-[11px]">
          <span class="text-slate-600 w-16 shrink-0 truncate">{{ NUTRIENTS[key].name }}</span>
          <input
            :value="overrides[key] ?? ''"
            :placeholder="String(targets[key].target)"
            @input="onOverrideInput(key, $event)"
            type="number"
            min="0"
            class="w-16 bg-slate-50 border rounded-lg px-1.5 py-1 focus:outline-none focus:border-mint-500"
            :class="overrides[key] ? 'border-mint-500 font-bold text-mint-700' : 'border-slate-200'"
          />
          <span class="text-slate-400">{{ NUTRIENTS[key].unit }}</span>
          <i
            v-if="overrides[key]"
            class="fa-solid fa-lock text-mint-500 text-[9px]"
            title="已锁定"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>
