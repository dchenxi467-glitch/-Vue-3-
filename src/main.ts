import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

/** 注册 Service Worker（PWA 离线支持，仅生产环境启用且跳过 Electron 桌面端） */
if (
  'serviceWorker' in navigator &&
  import.meta.env.PROD &&
  !navigator.userAgent.includes('Electron')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL })
      .catch((err) => console.warn('[PWA] Service worker 注册失败:', err))
  })
}
