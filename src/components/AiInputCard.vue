<script setup lang="ts">
import { ref } from 'vue'
import { aiService } from '../services/aiService'
import { foodName } from '../data/foods'
import type { AiRecognizeResult } from '../types'

const emit = defineEmits<{
  addMeal: [result: AiRecognizeResult]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const recognizing = ref(false)
const refining = ref(false)
const result = ref<AiRecognizeResult | null>(null)
const correctionText = ref('')
const feedback = ref('')

function triggerUpload() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  // 无论是否选到文件都走 Mock 识别流程（未选择时用占位符）
  await recognize(file ?? 'mock://placeholder')
  ;(e.target as HTMLInputElement).value = ''
}

async function recognize(image: File | string) {
  recognizing.value = true
  feedback.value = ''
  try {
    result.value = await aiService.recognizeImage(image)
  } finally {
    recognizing.value = false
  }
}

async function applyCorrection() {
  const text = correctionText.value.trim()
  if (!text || refining.value) return
  refining.value = true
  try {
    result.value = await aiService.refine(text, result.value)
    feedback.value = result.value.note ?? '已结合文字修正，更新估算数据成功！'
    correctionText.value = ''
  } finally {
    refining.value = false
  }
}

function clearResult() {
  result.value = null
  feedback.value = ''
}

function confirmAdd() {
  if (!result.value) return
  emit('addMeal', result.value)
  feedback.value = '已加入今日饮食轨迹！'
  result.value = null
  setTimeout(() => (feedback.value = ''), 3000)
}
</script>

<template>
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
        <i class="fa-solid fa-camera text-mint-500"></i> AI 食物识别与动态修正
      </h3>
      <span class="text-[11px] text-slate-400">支持上传图片 + 文字修正</span>
    </div>

    <!-- 上传区域 -->
    <div
      class="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 hover:border-mint-500 transition-colors relative"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />

      <div v-if="recognizing" class="py-3">
        <i class="fa-solid fa-circle-notch fa-spin text-mint-500 text-xl mb-1"></i>
        <p class="text-xs text-slate-500 font-medium mt-1">AI 识别中，请稍候…</p>
      </div>

      <div v-else-if="!result" class="py-2 cursor-pointer" @click="triggerUpload">
        <i class="fa-solid fa-cloud-arrow-up text-slate-400 text-2xl mb-1"></i>
        <p class="text-xs text-slate-500 font-medium">点击上传饮食图片，或拍摄便当</p>
        <p class="text-[10px] text-slate-400 mt-0.5">自动识别蔬菜、肉类并估算微量元素</p>
      </div>

      <div v-else class="relative">
        <div class="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 text-left">
          <div class="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 text-2xl font-bold shrink-0">
            🥗
          </div>
          <div class="flex-1 text-xs min-w-0">
            <div class="flex justify-between items-start">
              <span class="font-bold text-slate-700">AI 判定：{{ result.title }}</span>
              <button @click="clearResult" class="text-slate-400 hover:text-slate-600 shrink-0">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p class="text-slate-500 mt-0.5 truncate">
              {{ result.ingredients.map(i => `${foodName(i.foodId)} ${i.grams}g`).join('、') }}
            </p>
            <p class="text-mint-600 font-semibold mt-1 text-[11px]">{{ result.note }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 文字补充修正输入框 -->
    <div class="flex gap-2">
      <input
        v-model="correctionText"
        type="text"
        placeholder="补充描述，例如：'菠菜只有50g，另外吃了1颗鸡蛋'"
        class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-mint-500 transition-colors"
        @keyup.enter="applyCorrection"
      />
      <button
        @click="applyCorrection"
        :disabled="refining"
        class="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
      >
        <i class="fa-solid fa-arrows-rotate text-[10px]" :class="{ 'fa-spin': refining }"></i>
        {{ refining ? '修正中' : '实时修正' }}
      </button>
    </div>

    <!-- 确认加入按钮 -->
    <button
      v-if="result"
      @click="confirmAdd"
      class="w-full bg-mint-500 hover:bg-mint-600 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
    >
      <i class="fa-solid fa-plus"></i> 加入今日饮食轨迹
    </button>

    <p
      v-if="feedback"
      class="text-[11px] text-mint-600 bg-mint-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
    >
      <i class="fa-solid fa-circle-check"></i> {{ feedback }}
    </p>
  </div>
</template>
