<script setup lang="ts">
import { NUTRIENTS, NUTRIENT_KEYS } from '../data/nutrients'
import type {
  Goal,
  NutrientKey,
  NutrientTarget,
  Occupation,
  SpecialCondition,
  UserProfile,
} from '../types'

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

const OCCUPATION_OPTIONS: Array<{ key: Occupation; label: string }> = [
  { key: 'sedentary', label: '久坐上班族' },
  { key: 'fitness', label: '运动爱好者' },
  { key: 'athlete', label: '运动员' },
  { key: 'manual', label: '重体力劳动（工地等）' },
  { key: 'delivery', label: '户外奔波（外卖/快递）' },
]

const SPECIAL_OPTIONS: Array<{ key: SpecialCondition; label: string }> = [
  { key: 'none', label: '无 / 一般人群' },
  { key: 'pregnancy_t1', label: '孕早期（1-12周）' },
  { key: 'pregnancy_t2', label: '孕中期（13-27周）' },
  { key: 'pregnancy_t3', label: '孕晚期（28周+）' },
  { key: 'lactation', label: '哺乳期' },
  { key: 'chronic', label: '慢性病（遵医嘱）' },
]

const SPECIAL_HINT: Partial<Record<SpecialCondition, string>> = {
  pregnancy_t1: '已上调叶酸、铁目标，重点关注叶酸补充',
  pregnancy_t2: '已上调叶酸、铁、钙目标',
  pregnancy_t3: '已上调叶酸、铁（29mg）、钙目标',
  lactation: '已上调钙、铁、叶酸、VC 目标',
  chronic: '慢性病目标值不自动调整，请遵医嘱手动锁定下方目标值',
}

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
        <label class="block text-slate-500 mb-1">职业 / 日常状态</label>
        <select
          :value="profile.occupation"
          @change="emit('updateProfile', { occupation: ($event.target as HTMLSelectElement).value as Occupation })"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
        >
          <option v-for="opt in OCCUPATION_OPTIONS" :key="opt.key" :value="opt.key">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div>
      <label class="block text-slate-500 text-xs mb-1">特殊人群标签</label>
      <select
        :value="profile.special"
        @change="emit('updateProfile', { special: ($event.target as HTMLSelectElement).value as SpecialCondition })"
        class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium"
      >
        <option v-for="opt in SPECIAL_OPTIONS" :key="opt.key" :value="opt.key">
          {{ opt.label }}
        </option>
      </select>
      <p
        v-if="SPECIAL_HINT[profile.special]"
        class="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mt-1.5"
      >
        <i class="fa-solid fa-circle-info mr-1"></i>{{ SPECIAL_HINT[profile.special] }}
      </p>
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
