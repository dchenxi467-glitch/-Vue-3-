// 缺了啥? —— 全局数据模型定义（v2：区间克重 / 补充剂隔离 / 多维画像）

export type Gender = 'male' | 'female'
export type Diet = 'omnivore' | 'vegan' | 'keto'
export type Standard = 'basic' | 'advanced'

/** 职业/日常状态（替代 v1 的运动强度，决定易流失营养素系数） */
export type Occupation = 'sedentary' | 'fitness' | 'athlete' | 'manual' | 'delivery'

/** 特殊人群标签 */
export type SpecialCondition =
  | 'none'
  | 'pregnancy_t1'
  | 'pregnancy_t2'
  | 'pregnancy_t3'
  | 'lactation'
  | 'chronic'

/** 追踪的营养素 key：VA/VC/VD/VE/VB1/VB12/叶酸 + 钙/镁/铁/锌 */
export type NutrientKey =
  | 'va' | 'vc' | 'vd' | 've' | 'vb1' | 'vb12' | 'folate'
  | 'ca' | 'mg' | 'fe' | 'zn'

/** 关注目标：决定首页置顶营养素 */
export type Goal = 'sleep' | 'fatigue' | 'bone' | 'skin' | 'immune'

export interface UserProfile {
  gender: Gender
  age: number
  weight: number
  occupation: Occupation
  special: SpecialCondition
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
  /** 进阶文献原始推荐值（引擎按 80% 适度化后生效） */
  advanced: number
  /** 是否受职业体力强度系数影响 */
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

/** 区间克重：AI 估算存在不确定性，用 [min, max] 表示 */
export interface MealIngredient {
  foodId: string
  gramsMin: number
  gramsMax: number
}

/** 餐次类别：顺序正餐（第一餐/第二餐…）或加餐 */
export type MealKind = 'meal' | 'snack'
export type MealSource = 'ai' | 'manual' | 'corrected' | 'seed'

export interface MealRecord {
  id: string
  /** 毫秒时间戳，用于按天分组与餐次排序 */
  timestamp: number
  kind: MealKind
  title: string
  ingredients: MealIngredient[]
  source: MealSource
  /** 合并识别的图片数量（一餐多图） */
  images?: number
}

/** AI 识别结果 */
export interface AiRecognizeResult {
  title: string
  ingredients: MealIngredient[]
  /** 复杂混合菜肴（麻辣烫/盖浇饭等），需要引导用户补充配料 */
  isMixedDish?: boolean
  note?: string
}

/** 膳食补充剂打卡记录（与天然食物隔离统计） */
export interface SupplementRecord {
  id: string
  timestamp: number
  name: string
  /** 服用粒/片数 */
  doses: number
  /** 单粒营养素含量快照 */
  perDose: Partial<Record<NutrientKey, number>>
}

/** 补充剂预设（内置库） */
export interface SupplementDef {
  id: string
  name: string
  doseUnit: string
  perDose: Partial<Record<NutrientKey, number>>
}

/** 摄入量区间 */
export interface IntakeRange {
  min: number
  max: number
}
export type IntakeMap = Record<NutrientKey, IntakeRange>

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
