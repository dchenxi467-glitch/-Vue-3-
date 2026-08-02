// 缺了啥? —— 全局数据模型定义

export type Gender = 'male' | 'female'
export type Activity = 'low' | 'medium' | 'high'
export type Diet = 'omnivore' | 'vegan' | 'keto'
export type Standard = 'basic' | 'advanced'

/** 追踪的营养素 key：VA/VC/VD/VE/VB1/VB12 + 钙/镁/铁/锌 */
export type NutrientKey =
  | 'va' | 'vc' | 'vd' | 've' | 'vb1' | 'vb12'
  | 'ca' | 'mg' | 'fe' | 'zn'

/** 关注目标：决定首页置顶营养素 */
export type Goal = 'sleep' | 'fatigue' | 'bone' | 'skin' | 'immune'

export interface UserProfile {
  gender: Gender
  age: number
  weight: number
  activity: Activity
  diet: Diet
  goals: Goal[]
}

export interface NutrientDef {
  key: NutrientKey
  name: string
  unit: string
  /** 基础 RNI/AI（DRIs 2023，18-49 岁成人） */
  rni: { male: number; female: number }
  /** 50 岁+ 覆盖值（可选，按性别） */
  senior?: { male?: number; female?: number }
  /** 耐受最高摄入量 UL */
  ul: number
  /** 进阶文献推荐目标 */
  advanced: number
  /** 是否受运动系数影响 */
  exerciseBoost: boolean
  /** 关注目标 → 置顶映射 */
  goalTags: Goal[]
}

export interface NutrientTarget {
  target: number
  ul: number
  /** 因饮食偏好/关注目标被置顶监控 */
  pinned: boolean
}

export interface FoodItem {
  id: string
  name: string
  /** 别名，用于文字修正时的模糊匹配 */
  aliases: string[]
  /** 按"颗/个"计量时的单件克重（如鸡蛋 55g/颗） */
  pieceGrams?: number
  /** 每 100g 营养素含量 */
  per100g: Partial<Record<NutrientKey, number>>
}

export interface MealIngredient {
  foodId: string
  grams: number
}

export type MealType = '早餐' | '午餐' | '晚餐' | '加餐'
export type MealSource = 'ai' | 'manual' | 'corrected' | 'seed'

export interface MealRecord {
  id: string
  /** 毫秒时间戳，用于按天分组 */
  timestamp: number
  type: MealType
  title: string
  ingredients: MealIngredient[]
  source: MealSource
}

/** AI 识别结果 */
export interface AiRecognizeResult {
  title: string
  ingredients: MealIngredient[]
  note?: string
}

/** 长期分析预警 */
export interface Warning {
  nutrient: NutrientKey
  level: 'high' | 'medium'
  title: string
  analysis: string
  advice?: string
}

/** 每日达标率序列项 */
export interface DayRates {
  date: string
  rates: Record<NutrientKey, number>
}
