<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6"
      @click.self="emit('cancel')"
    >
      <div class="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-3 animate-[fadeIn_0.15s_ease-out]">
        <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
          <i class="fa-solid fa-wand-magic-sparkles text-mint-500"></i> {{ title }}
        </h3>
        <p class="text-xs text-slate-600 leading-relaxed">{{ message }}</p>
        <div class="flex gap-2 pt-1">
          <button
            @click="emit('cancel')"
            class="flex-1 py-2 rounded-xl text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {{ cancelText ?? '取消' }}
          </button>
          <button
            @click="emit('confirm')"
            class="flex-1 py-2 rounded-xl text-xs font-bold bg-mint-500 text-white hover:bg-mint-600 transition-colors"
          >
            {{ confirmText ?? '确认开启' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
