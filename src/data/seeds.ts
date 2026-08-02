import type { MealRecord, MealType } from '../types'

/**
 * 首启种子数据：生成最近 10 天的模拟餐食
 * 目的——让长期分析页开箱即有内容，且营养结构有真实的强弱分布
 * （VC/蛋白质类充足，镁/VE 偏弱，可触发预警演示）
 */

interface SeedTemplate {
  type: MealType
  hour: number
  title: string
  items: Array<[string, number]> // [foodId, grams]
}

const DAY_TEMPLATES: SeedTemplate[][] = [
  // 模板 A：燕麦日
  [
    { type: '早餐', hour: 8, title: '燕麦牛奶 + 水煮蛋', items: [['oats', 50], ['milk', 250], ['egg', 55]] },
    { type: '午餐', hour: 12, title: '鸡胸肉西兰花盖饭', items: [['chicken_breast', 120], ['broccoli', 150], ['rice', 250]] },
    { type: '晚餐', hour: 19, title: '瘦猪肉炒菠菜 + 米饭', items: [['pork', 100], ['spinach', 150], ['rice', 200]] },
  ],
  // 模板 B：牛肉日
  [
    { type: '早餐', hour: 8, title: '全麦面包夹煎蛋 + 美式', items: [['egg', 55], ['coffee', 200], ['apple', 200]] },
    { type: '午餐', hour: 12, title: '菠菜牛肉面', items: [['spinach', 150], ['beef', 100], ['noodles', 200]] },
    { type: '晚餐', hour: 19, title: '香煎三文鱼 + 时蔬', items: [['salmon', 120], ['broccoli', 120], ['rice', 180]] },
  ],
  // 模板 C：素日 + 水果加餐
  [
    { type: '早餐', hour: 8, title: '牛奶燕麦 + 香蕉', items: [['milk', 250], ['oats', 40], ['banana', 120]] },
    { type: '午餐', hour: 12, title: '麻婆豆腐盖饭', items: [['tofu', 200], ['rice', 250], ['pork', 50]] },
    { type: '加餐', hour: 15, title: '猕猴桃 + 杏仁', items: [['kiwi', 80], ['almonds', 20]] },
    { type: '晚餐', hour: 19, title: '虾仁西兰花 + 米饭', items: [['shrimp', 100], ['broccoli', 150], ['rice', 200]] },
  ],
  // 模板 D：猪肝日（补铁/VA/VB12）
  [
    { type: '早餐', hour: 8, title: '水煮蛋 + 牛奶', items: [['egg', 55], ['milk', 250]] },
    { type: '午餐', hour: 12, title: '爆炒猪肝 + 米饭', items: [['pork_liver', 60], ['rice', 250], ['spinach', 100]] },
    { type: '晚餐', hour: 19, title: '鸡胸沙拉 + 混合坚果', items: [['chicken_breast', 100], ['broccoli', 100], ['mixed_nuts', 25]] },
  ],
]

/** 每个周期插入一次橙子加餐，拉高 VC 波动 */
const SNACK: SeedTemplate = { type: '加餐', hour: 16, title: '一个橙子', items: [['orange', 150]] }

export function generateSeedMeals(now = Date.now()): MealRecord[] {
  const meals: MealRecord[] = []
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const today0 = today.getTime()

  // 过去 9 天
  for (let d = 9; d >= 1; d--) {
    const day0 = today0 - d * 86400000
    const templates = DAY_TEMPLATES[(9 - d) % DAY_TEMPLATES.length]
    for (const t of templates) {
      meals.push({
        id: `seed-${d}-${t.type}`,
        timestamp: day0 + t.hour * 3600000,
        type: t.type,
        title: t.title,
        ingredients: t.items.map(([foodId, grams]) => ({ foodId, grams })),
        source: 'seed',
      })
    }
    if (d % 3 === 0) {
      meals.push({
        id: `seed-${d}-snack`,
        timestamp: day0 + SNACK.hour * 3600000,
        type: SNACK.type,
        title: SNACK.title,
        ingredients: SNACK.items.map(([foodId, grams]) => ({ foodId, grams })),
        source: 'seed',
      })
    }
  }

  // 今天（与原型一致的两餐）
  meals.push(
    {
      id: 'seed-today-breakfast',
      timestamp: today0 + 8.5 * 3600000,
      type: '早餐',
      title: '水煮蛋 + 美式咖啡',
      ingredients: [
        { foodId: 'egg', grams: 55 },
        { foodId: 'coffee', grams: 200 },
      ],
      source: 'seed',
    },
    {
      id: 'seed-today-lunch',
      timestamp: today0 + 12.5 * 3600000,
      type: '午餐',
      title: '菠菜牛肉面',
      ingredients: [
        { foodId: 'spinach', grams: 150 },
        { foodId: 'beef', grams: 100 },
        { foodId: 'noodles', grams: 150 },
      ],
      source: 'seed',
    },
  )

  return meals
}
