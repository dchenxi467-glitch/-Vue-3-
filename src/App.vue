<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from './stores/settings'
import TodayView from './views/TodayView.vue'
import AnalysisView from './views/AnalysisView.vue'
import ProfileView from './views/ProfileView.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

const settingsStore = useSettingsStore()
const activeTab = ref<'today' | 'analysis' | 'profile'>('today')

/** 进阶标准开启确认弹窗（需求 3：确认后方可生效） */
const showAdvancedConfirm = ref(false)

function onStandardSwitch(target: 'basic' | 'advanced') {
  if (target === 'advanced' && settingsStore.standard !== 'advanced') {
    showAdvancedConfirm.value = true
    return
  }
  settingsStore.setStandard(target)
}

function confirmAdvanced() {
  settingsStore.setStandard('advanced')
  showAdvancedConfirm.value = false
}

const TABS = [
  { key: 'today', label: '今日状态', icon: 'fa-solid fa-utensils' },
  { key: 'analysis', label: '长期分析', icon: 'fa-solid fa-chart-line' },
  { key: 'profile', label: '画像与标准', icon: 'fa-solid fa-sliders' },
] as const
</script>

<template>
  <div
    class="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col shadow-xl relative border-x border-slate-200"
  >
    <!-- 顶部导航栏 -->
    <header
      class="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-4 py-3 border-b border-slate-100 flex items-center justify-between"
    >
      <div class="flex items-center space-x-2">
        <div
          class="w-8 h-8 rounded-xl bg-mint-500 text-white flex items-center justify-center font-bold text-lg shadow-sm"
        >
          缺
        </div>
        <div>
          <h1 class="font-bold text-slate-800 text-base leading-tight">缺了啥?</h1>
          <p class="text-[10px] text-slate-400">微量元素智能工作台</p>
        </div>
      </div>

      <!-- 标准切换开关 -->
      <div class="bg-slate-100 p-1 rounded-xl flex text-xs font-medium">
        <button
          @click="onStandardSwitch('basic')"
          :class="
            settingsStore.standard === 'basic'
              ? 'bg-white text-mint-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          "
          class="px-2.5 py-1 rounded-lg transition-all duration-200"
        >
          基础 (DRIs)
        </button>
        <button
          @click="onStandardSwitch('advanced')"
          :class="
            settingsStore.standard === 'advanced'
              ? 'bg-mint-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          "
          class="px-2.5 py-1 rounded-lg transition-all duration-200 flex items-center gap-1"
        >
          <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i> 进阶
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex-1 px-4 py-4 space-y-4 mb-20 overflow-y-auto">
      <TodayView v-if="activeTab === 'today'" />
      <AnalysisView v-else-if="activeTab === 'analysis'" />
      <ProfileView v-else />
    </main>

    <!-- 底部 Tab 导航栏 -->
    <nav
      class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-2 flex justify-around z-20"
    >
      <button
        v-for="tab in TABS"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="
          activeTab === tab.key
            ? 'text-mint-600 font-bold'
            : 'text-slate-400 hover:text-slate-600'
        "
        class="flex flex-col items-center gap-0.5 text-xs transition-colors"
      >
        <i :class="tab.icon" class="text-base"></i>
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <!-- 进阶标准开启确认弹窗 -->
    <ConfirmDialog
      :show="showAdvancedConfirm"
      title="开启进阶评估标准"
      message="进阶标准基于前沿高阶健康研究，推荐摄入量高于基础 DRIs（已按 80% 适度化取值），适合追求优化健康状态的人群。是否确认开启？"
      confirm-text="确认开启"
      cancel-text="暂不开启"
      @confirm="confirmAdvanced"
      @cancel="showAdvancedConfirm = false"
    />
  </div>
</template>
