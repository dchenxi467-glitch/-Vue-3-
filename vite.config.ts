import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // 相对路径：适配 GitHub Pages 项目站点子路径（/dchenxi467.github.io/）部署，
  // 资源引用改为 ./assets/... 形式，任意子路径/自定义域名均可正常工作
  base: './',
})
