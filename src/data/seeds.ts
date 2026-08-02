import type { MealKind, MealRecord, SupplementRecord } from '../types'

/**
 * 首启种子数据：生成最近 10 天的模拟餐食 + 今日补充剂打卡
 * 目的——让长期分析页开箱即有内容，且营养结构有真实的强弱分布
 * （VC/蛋白质类充足，镁/VE 偏弱，可触发预警演示）
 * v2：餐次改为顺序正餐 (kind='meal') 与加餐 (kind='snack')，克重为点值区间
 */

interface SeedTemplate {
  kind: MealKind
  hour: number
  title: string
  items: Array<[string, number]> // [foodId, grams]
}

const DAY_TEMPLATES: SeedTemplate[][] = [
  // 模板 A：燕麦日
  [
    { kind: 'meal', hour: 8, title: '燕麦牛奶 + 水煮蛋', items: [['oats', 50], ['milk', 250], ['egg', 55]] },
    { kind: 'meal', hour: 12, title: '鸡胸肉西兰花盖饭', items: [['chicken_breast', 120], ['broccoli', 150], ['rice', 250]] },
    { kind: 'meal', hour: 19, title: '瘦猪肉炒菠菜 + 米饭', items: [['pork', 100], ['spinach', 150], ['rice', 200]] },
  ],
  // 模板 B：牛肉日
  [
    { kind: 'meal', hour: 8, title: '全麦面包夹煎蛋 + 美式', items: [['egg', 55], ['coffee', 200], ['apple', 200]] },
    { kind: 'meal', hour: 12, title: '菠菜牛肉面', items: [['spinach', 150], ['beef', 100], ['noodles', 200]] },
    { kind: 'meal', hour: 19, title: '香煎三文鱼 + 时蔬', items: [['salmon', 120], ['broccoli', 120], ['rice', 180]] },
  ],
  // 模板 C：素日 + 水果加餐
  [
    { kind: 'meal', hour: 8, title: '牛奶燕麦 + 香蕉', items: [['milk', 250], ['oats', 40], ['banana', 120]] },
    { kind: 'meal', hour: 12, title: '麻婆豆腐盖饭', items: [['tofu', 200], ['rice', 250], ['pork', 50]] },
    { kind: 'snack', hour: 15, title: '猕猴桃 + 杏仁', items: [['kiwi', 80], ['almonds', 20]] },
    { kind: 'meal', hour: 19, title: '虾仁西兰花 + 米饭', items: [['shrimp', 100], ['broccoli', 150], ['rice', 200]] },
  ],
  // 模板 D：猪肝日（补铁/VA/VB12/叶酸）
  [
    { kind: 'meal', hour: 8, title: '水煮蛋 + 牛奶', items: [['egg', 55], ['milk', 250]] },
    { kind: 'meal', hour: 12, title: '爆炒猪肝 + 米饭', items: [['pork_liver', 60], ['rice', 250], ['spinach', 100]] },
    { kind: 'meal', hour: 19, title: '鸡胸沙拉 + 混合坚果', items: [['chicken_breast', 100], ['broccoli', 100], ['mixed_nuts', 25]] },
  ],
]

/** 每个周期插入一次橙子加餐，拉高 VC 波动 */
const SNACK: SeedTemplate = { kind: 'snack', hour: 16, title: '一个橙子', items: [['orange', 150]] }

function toRecord(id: string, day0: number, t: SeedTemplate): MealRecord {
  return {
    id,
    timestamp: day0 + t.hour * 3600000,
    kind: t.kind,
    title: t.title,
    ingredients: t.items.map(([foodId, grams]) => ({
      foodId,
      gramsMin: grams,
      gramsMax: grams,
    })),
    source: 'seed',
  }
}

export function generateSeedMeals(now = Date.now()): MealRecord[] {
  const meals: MealRecord[] = []
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const today0 = today.getTime()

  // 过去 9 天
  for (let d = 9; d >= 1; d--) {
    const day0 = today0 - d * 86400000
    const templates = DAY_TEMPLATES[(9 - d) % DAY_TEMPLATES.length]
    templates.forEach((t, i) => meals.push(toRecord(`seed-${d}-${i}`, day0, t)))
    if (d % 3 === 0) meals.push(toRecord(`seed-${d}-snack`, day0, SNACK))
  }

  // 今天（与原型一致的两餐）
  meals.push(
    toRecord('seed-today-1', today0, {
      kind: 'meal',
      hour: 8.5,
      title: '水煮蛋 + 美式咖啡',
      items: [['egg', 55], ['coffee', 200]],
    }),
    toRecord('seed-today-2', today0, {
      kind: 'meal',
      hour: 12.5,
      title: '菠菜牛肉面',
      items: [['spinach', 150], ['beef', 100], ['noodles', 150]],
    }),
  )

  return meals
}

/** 今日补充剂打卡种子（演示隔离展示与 UL 预警） */
export function generateSeedSupplements(now = Date.now()): SupplementRecord[] {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const t0 = today.getTime()
  return [
    {
      id: 'seed-supp-1',
      timestamp: t0 + 9 * 3600000,
      name: '复合维生素片',
      doses: 1,
      perDose: { va: 500, vc: 60, vd: 5, ve: 10, vb1: 1.5, vb12: 2.4, folate: 400, ca: 100, mg: 50, fe: 5, zn: 5 },
    },
    {
      id: 'seed-supp-2',
      timestamp: t0 + 13 * 3600000,
      name: '钙片 500mg',
      doses: 1,
      perDose: { ca: 500, vd: 1.25 },
    },
  ]
}
