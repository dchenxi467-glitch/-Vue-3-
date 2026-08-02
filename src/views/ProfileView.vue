<script setup lang="ts">
import { useProfileStore } from '../stores/profile'
import { useSettingsStore } from '../stores/settings'
import { useTargets } from '../composables/useTargets'
import ProfileForm from '../components/ProfileForm.vue'
import type { NutrientKey, UserProfile } from '../types'

const profileStore = useProfileStore()
const settingsStore = useSettingsStore()
const targets = useTargets()

function onUpdateProfile(patch: Partial<UserProfile>) {
  profileStore.update(patch)
}

function onSetOverride(key: NutrientKey, value: number | null) {
  settingsStore.setOverride(key, value)
}
</script>

<template>
  <div class="space-y-4">
    <ProfileForm
      :profile="profileStore.profile"
      :targets="targets"
      :overrides="settingsStore.overrides"
      @update-profile="onUpdateProfile"
      @set-override="onSetOverride"
    />

    <!-- 评估标准设定逻辑说明 -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2 text-xs">
      <h3 class="font-bold text-slate-800 text-sm">评估标准说明</h3>
      <div class="p-2.5 bg-slate-50 rounded-xl space-y-1 text-slate-600">
        <p class="font-bold text-slate-700">1. 基础标准：</p>
        <p>
          基于《中国居民膳食营养素参考摄入量 (2023版)》RNI
          推荐量，满足日常生活预防缺乏症的最低基准。
        </p>
      </div>
      <div class="p-2.5 bg-mint-50/60 rounded-xl space-y-1 text-slate-600 border border-mint-100">
        <p class="font-bold text-mint-800">2. 进阶标准（AI文献检索模式）：</p>
        <p>
          结合前沿长寿与高效能医学文献（如提升线粒体活力、抗氧化与精力恢复），适当上调
          Vitamin C、Magnesium 及 B 群的理想摄入区间。
        </p>
      </div>
      <p class="text-[10px] text-slate-400 leading-relaxed px-1">
        * 本应用数据仅供参考，不构成医疗建议。特殊疾病、孕期哺乳期人群请遵医嘱。
      </p>
    </div>
  </div>
</template>
