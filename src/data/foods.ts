import type { FoodItem } from '../types'

/**
 * 内置食物成分库（每 100g 营养素含量）
 * 数值参考《中国食物成分表》标准版，取常见可食部近似值
 */
export const FOODS: FoodItem[] = [
  {
    id: 'spinach', name: '菠菜', aliases: ['青菜', '菠菱'],
    per100g: { vc: 32, va: 487, ve: 1.74, ca: 66, mg: 58, fe: 2.9, zn: 0.85, vb1: 0.04 },
  },
  {
    id: 'beef', name: '牛肉', aliases: ['肥牛', '牛排', '牛柳'],
    per100g: { fe: 2.8, zn: 6.3, vb12: 2.6, vb1: 0.06, mg: 21, ca: 6 },
  },
  {
    id: 'noodles', name: '面条', aliases: ['面', '拉面', '挂面'],
    per100g: { vb1: 0.05, ca: 12, mg: 20, fe: 0.8, zn: 0.5 },
  },
  {
    id: 'egg', name: '鸡蛋', aliases: ['蛋', '水煮蛋', '煎蛋', '鸡蛋羹'], pieceGrams: 55,
    per100g: { va: 234, vd: 1.75, ve: 1.84, vb12: 1.1, vb1: 0.09, fe: 2.0, zn: 1.1, ca: 56 },
  },
  {
    id: 'milk', name: '牛奶', aliases: ['奶', '鲜牛奶', '纯牛奶'],
    per100g: { ca: 104, vd: 0.5, vb12: 0.4, mg: 11, zn: 0.42, va: 24, vb1: 0.03 },
  },
  {
    id: 'chicken_breast', name: '鸡胸肉', aliases: ['鸡肉', '鸡胸'],
    per100g: { vb1: 0.07, mg: 29, fe: 0.6, zn: 0.9, ca: 3 },
  },
  {
    id: 'salmon', name: '三文鱼', aliases: ['鲑鱼'],
    per100g: { vd: 11, vb12: 4.9, mg: 27, zn: 0.64, ve: 1.1 },
  },
  {
    id: 'pork_liver', name: '猪肝', aliases: ['肝', '猪肝片'],
    per100g: { va: 4972, fe: 22.6, vb12: 26, zn: 5.78, vc: 20, vb1: 0.21 },
  },
  {
    id: 'pumpkin_seeds', name: '南瓜籽', aliases: ['南瓜子'],
    per100g: { mg: 592, zn: 7.8, fe: 8.8, ve: 2.2 },
  },
  {
    id: 'dark_chocolate', name: '黑巧克力', aliases: ['黑巧', '巧克力'],
    per100g: { mg: 228, fe: 11.9, zn: 3.3 },
  },
  {
    id: 'broccoli', name: '西兰花', aliases: ['花椰菜', '绿菜花'],
    per100g: { vc: 89, va: 31, ca: 47, mg: 21, fe: 0.7, zn: 0.4 },
  },
  {
    id: 'orange', name: '橙子', aliases: ['橙', '鲜橙'], pieceGrams: 150,
    per100g: { vc: 53, ca: 40, vb1: 0.09 },
  },
  {
    id: 'kiwi', name: '猕猴桃', aliases: ['奇异果'], pieceGrams: 80,
    per100g: { vc: 92, ve: 1.5, mg: 17 },
  },
  {
    id: 'tofu', name: '豆腐', aliases: ['北豆腐', '嫩豆腐', '煎豆腐'],
    per100g: { ca: 138, mg: 30, fe: 1.9, zn: 0.8 },
  },
  {
    id: 'rice', name: '米饭', aliases: ['饭', '大米饭'],
    per100g: { vb1: 0.02, mg: 12, fe: 0.2, zn: 0.6 },
  },
  {
    id: 'oats', name: '燕麦', aliases: ['燕麦片'],
    per100g: { mg: 177, fe: 4.7, zn: 4, vb1: 0.76 },
  },
  {
    id: 'almonds', name: '杏仁', aliases: ['巴旦木'],
    per100g: { mg: 270, ve: 25.6, ca: 269, fe: 3.7, zn: 3.1 },
  },
  {
    id: 'apple', name: '苹果', aliases: [], pieceGrams: 200,
    per100g: { vc: 4 },
  },
  {
    id: 'banana', name: '香蕉', aliases: [], pieceGrams: 120,
    per100g: { mg: 27, vb1: 0.03, vc: 8 },
  },
  {
    id: 'shrimp', name: '虾', aliases: ['虾仁', '大虾', '基围虾'],
    per100g: { vb12: 1.5, zn: 1.3, mg: 39, ca: 62, vd: 0.2 },
  },
  {
    id: 'coffee', name: '美式咖啡', aliases: ['咖啡', '美式', '黑咖啡'],
    per100g: { mg: 3 },
  },
  {
    id: 'pork', name: '瘦猪肉', aliases: ['猪肉', '里脊'],
    per100g: { vb1: 0.54, fe: 1.6, zn: 2.99, mg: 25, ca: 6, vb12: 0.7 },
  },
  {
    id: 'mixed_nuts', name: '混合坚果', aliases: ['坚果', '每日坚果'],
    per100g: { mg: 250, ve: 8, zn: 3, fe: 2.5, ca: 100 },
  },
]

/** 用户通过文字修正产生的自定义食材（营养素按 0 计，仅记录克重） */
const customFoods = new Map<string, FoodItem>()

export function getFood(id: string): FoodItem | undefined {
  return FOODS.find((f) => f.id === id) ?? customFoods.get(id)
}

/** 按名称/别名模糊匹配食物库 */
export function findFoodByName(name: string): FoodItem | undefined {
  const n = name.trim()
  if (!n) return undefined
  return FOODS.find((f) => f.name === n || f.name.includes(n) || n.includes(f.name))
    ?? FOODS.find((f) => f.aliases.some((a) => a === n || a.includes(n) || n.includes(a)))
}

/** 注册一个库外食材（按 0 营养素计入） */
export function registerCustomFood(name: string): FoodItem {
  const id = `custom:${name}`
  const existing = customFoods.get(id)
  if (existing) return existing
  const food: FoodItem = { id, name, aliases: [], per100g: {} }
  customFoods.set(id, food)
  return food
}

/** 展示用食材名称 */
export function foodName(id: string): string {
  return getFood(id)?.name ?? id
}
