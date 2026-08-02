# 缺了啥? —— 个人营养素微量元素工作台

一个专注于通过每日饮食记录，分析**维生素与矿物质摄入量是否达标**的个人健康工具。

薄荷绿极简风格 · 移动端 App 式单页应用 · 数据全部保存在本地浏览器，隐私零上传。

## ✨ 核心功能

- **📸 AI 食物识别与动态修正**：上传饮食图片自动识别食材并估算克重；支持文字补充修正（如"菠菜只有50g，另外吃了1颗鸡蛋"），实时重算营养素
- **📊 双重评估标准一键切换**：
  - **基础标准**：《中国居民膳食营养素参考摄入量 (2023版)》RNI 推荐量
  - **进阶标准**：前沿文献针对优化健康/高效能的推荐区间（更高 VC、VD、镁目标）
- **🧬 画像驱动的个性化推荐**：根据性别、年龄、体重、运动强度、饮食偏好（杂食/纯素/生酮）动态计算 10 种营养素每日目标值，支持手动锁定自定义目标
- **📈 单日看板**：健康完成度评分、达标/缺口标签、逐项进度条、超 UL 耐受上限警示、饮食时间轴（可编辑克重/删除）
- **🚨 长周期预警（7天/30天）**：营养素充足度热力卡片（🟢充足 / 🟡偶有偏低 / 🔴持续偏低）+ 智能缺乏风险预警与改善建议

## 🛠 技术栈

| 领域 | 选型 |
|---|---|
| 框架 | Vue 3 (`<script setup>` + Composition API) |
| 构建 | Vite 8 |
| 语言 | TypeScript ~5.9（⚠️ 勿升 TS 7，与 vue-tsc 不兼容） |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite` 插件，CSS-first `@theme`） |
| 状态管理 | Pinia 4（profile / meals / settings 三个 store） |
| 持久化 | localStorage（信封格式 `{version, savedAt, data}`，支持版本迁移） |
| 图标 | FontAwesome 6.4（CDN） |

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建（输出到 dist/）
npm run build

# 本地预览构建产物
npm run preview
```

## 📁 项目结构

```
src/
├── types/index.ts           # 全局数据模型（UserProfile/NutrientDef/FoodItem/MealRecord…）
├── data/
│   ├── nutrients.ts         # 10 种营养素定义（DRIs 2023 RNI/UL + 进阶目标值）
│   ├── foods.ts             # 23 种内置食物成分库（每 100g 含量 + 别名匹配）
│   └── seeds.ts             # 首启种子数据（最近 10 天模拟餐食）
├── services/                # 纯逻辑层，无 UI 依赖
│   ├── nutritionEngine.ts   # RNI 计算引擎 + 摄入汇总 + 健康评分
│   ├── analytics.ts         # 7/30 天达标率、热力状态、预警规则
│   ├── aiService.ts         # AI 识别服务抽象（Mock 实现 + 工厂，可切换真实 API）
│   └── storage.ts           # localStorage 版本化持久化
├── stores/                  # Pinia：profile / meals / settings
├── composables/useTargets.ts# 合成最终目标值（含用户手动锁定）
├── components/              # 7 个展示组件（评分卡/AI输入/时间轴/热力图/预警卡…）
├── views/                   # 3 个主 Tab 视图（今日状态/长期分析/画像与标准）
└── App.vue                  # 外壳：顶栏标准切换 + 底部 Tab 导航
```

## 🤖 接入真实 AI 大模型

当前 AI 食物识别为 Mock 实现。接入真实多模态大模型（GPT-4o / Claude / DeepSeek 等）：

1. 实现 `src/services/aiService.ts` 中的 `AiService` 接口（两个方法：`recognizeImage` / `refine`）
2. 复制 `.env.example` 为 `.env`，填入 `VITE_AI_PROVIDER` 与 `VITE_AI_API_KEY`
3. 在 `createAiService()` 工厂中按 provider 返回你的实现

`.env` 已被 `.gitignore` 排除，API Key 不会进入仓库。

## 📊 营养数据说明

- 基础标准数值依据《中国居民膳食营养素参考摄入量 (2023版)》（18-49 岁成人段，含 50+ 分段覆盖）
- 食物成分数值参考《中国食物成分表》标准版取近似值
- 追踪 10 种营养素：VA / VC / VD / VE / VB1 / VB12 / 钙 / 镁 / 铁 / 锌
- ⚠️ 本应用数据仅供参考，不构成医疗建议。特殊疾病、孕期哺乳期人群请遵医嘱

## 📄 License

[MIT](LICENSE)
