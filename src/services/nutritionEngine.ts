import { NUTRIENTS, NUTRIENT_KEYS } from '../data/nutrients'
import { getFood } from '../data/foods'
import type {
  IntakeMap,
  IntakeRange,
  MealRecord,
  NutrientKey,
  NutrientTarget,
  Occupation,
  SpecialCondition,
  Standard,
  SupplementRecord,
  UserProfile,
} from '../types'

/** 职业/日常状态对易流失营养素（B族/VC/镁/锌等）的调整系数 */
const OCCUPATION_FACTOR: Record<Occupation, number> = {
  sedentary: 1, // 久坐办公
  fitness: 1.15, // 运动爱好者
  athlete: 1.3, // 运动员
  manual: 1.25, // 重体力劳动
  delivery: 1.15, // 户外奔波（外卖/快递等）
}

/**
 * 特殊人群关键营养素需求覆盖（DRIs 2023 孕期/哺乳期分段，近似值）
 * 仅作营养参考，特殊人群请遵医嘱
 */
const SPECIAL_OVERIDES: Partial<
  Record<SpecialCondition, Partial<Record<NutrientKey, number>>>
> = {
  pregnancy_t1: { folate: 600, fe: 20, ca: 800, vd: 15 },
  pregnancy_t2: { folate: 600, fe: 24, ca: 1000, vd: 15 },
  pregnancy_t3: { folate: 600, fe: 29, ca: 1000, vd: 15 },
  lactation: { folate: 550, fe: 24, ca: 1000, vc: 150, vd: 15 },
  // chronic（慢性病）不做自动调整，目标值需遵医嘱
}

/** 进阶标准适度化系数：前沿文献推荐值按 80% 取值，兼顾安全与优化 */
export const ADVANCED_MODERATION = 0.8

/**
 * 根据用户画像 + 评估标准，计算每种营养素的目标值
 * 逻辑：基础 RNI → 年龄分段 → 职业系数 → 饮食偏好调整 → 特殊人群覆盖 → 进阶标准(80%适度)
 */
export function calcTargets(
  profile: UserProfile,
  standard: Standard,
): Record<NutrientKey, NutrientTarget> {
  const result = {} as Record<NutrientKey, NutrientTarget>
  const factor = OCCUPATION_FACTOR[profile.occupation]
  const isSenior = profile.age >= 50

  for (const key of NUTRIENT_KEYS) {
    const def = NUTRIENTS[key]

    // 1. 基础 RNI：按性别取值，50 岁+ 应用 senior 覆盖
    let target = profile.gender === 'male' ? def.rni.male : def.rni.female
    if (isSenior && def.senior) {
      const seniorVal =
        profile.gender === 'male' ? def.senior.male : def.senior.female
      if (seniorVal !== undefined) target = seniorVal
    }

    // 2. 职业体力系数：作用于易随汗液/代谢流失的营养素
    if (def.exerciseBoost) {
      target *= factor
    }
    // 运动员/重体力劳动额外增加铁需求
    if (key === 'fe' && (profile.occupation === 'athlete' || profile.occupation === 'manual')) {
      target *= 1.1
    }

    // 3. 饮食偏好调整
    let pinned = false
    if (profile.diet === 'vegan') {
      if (key === 'fe') target *= 1.8
      if (key === 'zn') target *= 1.5
      if (key === 'vb12' || key === 'fe' || key === 'zn') pinned = true
    }
    if (profile.diet === 'keto') {
      if (key === 'mg') pinned = true
    }

    // 4. 特殊人群覆盖（孕期/哺乳期关键营养素上调，取较大值）
    const specialOverride = SPECIAL_OVERIDES[profile.special]?.[key]
    if (specialOverride !== undefined) {
      target = Math.max(target, specialOverride)
      pinned = true
    }

    // 5. 进阶标准：文献推荐值按 80% 适度化后替换（取较大值）
    if (standard === 'advanced') {
      target = Math.max(target, def.advanced * ADVANCED_MODERATION)
    }

    result[key] = { target: round1(target), ul: def.ul, pinned }
  }

  return result
}

/** 按关注目标对营养素排序：置顶关注 + 偏好 pinned 的排前面 */
export function sortByRelevance(
  keys: NutrientKey[],
  profile: UserProfile,
  targets: Record<NutrientKey, NutrientTarget>,
): NutrientKey[] {
  const goalSet = new Set(profile.goals)
  return [...keys].sort((a, b) => {
    const score = (k: NutrientKey) =>
      (targets[k].pinned ? 2 : 0) +
      (NUTRIENTS[k].goalTags.some((g) => goalSet.has(g)) ? 1 : 0)
    return score(b) - score(a)
  })
}

function zeroIntake(): IntakeMap {
  return Object.fromEntries(
    NUTRIENT_KEYS.map((k) => [k, { min: 0, max: 0 }]),
  ) as IntakeMap
}

/** 汇总一组餐食的营养素摄入量（区间：克重 min/max 分别累加） */
export function sumIntake(meals: MealRecord[]): IntakeMap {
  const totals = zeroIntake()
  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const food = getFood(ing.foodId)
      if (!food) continue
      for (const key of NUTRIENT_KEYS) {
        const per100 = food.per100g[key]
        if (per100) {
          totals[key].min += (per100 * ing.gramsMin) / 100
          totals[key].max += (per100 * ing.gramsMax) / 100
        }
      }
    }
  }
  return roundIntake(totals)
}

/** 汇总补充剂摄入（点值，min=max） */
export function sumSupplements(supps: SupplementRecord[]): IntakeMap {
  const totals = zeroIntake()
  for (const s of supps) {
    for (const [key, perDose] of Object.entries(s.perDose)) {
      const k = key as NutrientKey
      if (totals[k] && typeof perDose === 'number') {
        totals[k].min += perDose * s.doses
        totals[k].max += perDose * s.doses
      }
    }
  }
  return roundIntake(totals)
}

/** 晒太阳折算 VD 皮肤合成量（20 分钟 ≈ 400~600 IU ≈ 10~15 μg） */
export function sunVD(minutes: number): IntakeRange {
  if (!minutes || minutes <= 0) return { min: 0, max: 0 }
  return {
    min: round1((minutes / 20) * 10),
    max: round1((minutes / 20) * 15),
  }
}

/** 合并多个摄入区间（食物 + 补充剂 + 日照） */
export function addIntakes(...maps: IntakeMap[]): IntakeMap {
  const totals = zeroIntake()
  for (const map of maps) {
    for (const key of NUTRIENT_KEYS) {
      totals[key].min += map[key].min
      totals[key].max += map[key].max
    }
  }
  return roundIntake(totals)
}

/** 区间中值（评分与达标判定用） */
export function mid(range: IntakeRange): number {
  return (range.min + range.max) / 2
}

/** 综合健康完成度：基于纯食物摄入，Σ min(1, 摄入/目标) / n × 100 */
export function dayScore(
  foodIntake: IntakeMap,
  targets: Record<NutrientKey, NutrientTarget>,
): number {
  let total = 0
  for (const key of NUTRIENT_KEYS) {
    total += Math.min(1, mid(foodIntake[key]) / targets[key].target)
  }
  return Math.round((total / NUTRIENT_KEYS.length) * 100)
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function roundIntake(map: IntakeMap): IntakeMap {
  for (const key of NUTRIENT_KEYS) {
    map[key].min = round1(map[key].min)
    map[key].max = round1(map[key].max)
  }
  return map
}

/** 同一天判定（本地时区） */
export function isSameDay(ts: number, ref: number): boolean {
  const a = new Date(ts)
  const b = new Date(ref)
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** 当日餐次显示名：第 N 餐（按时间排序的正餐序号）/ 加餐 */
export function mealLabel(meal: MealRecord, dayMeals: MealRecord[]): string {
  if (meal.kind === 'snack') return '加餐'
  const seq = dayMeals
    .filter((m) => m.kind === 'meal')
    .sort((a, b) => a.timestamp - b.timestamp)
    .findIndex((m) => m.id === meal.id)
  const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
  return `第${CN[seq] ?? seq + 1}餐`
}

/** 格式化食材克重：区间或点值 */
export function formatGrams(ing: { gramsMin: number; gramsMax: number }): string {
  return ing.gramsMin === ing.gramsMax
    ? `${ing.gramsMin}g`
    : `${ing.gramsMin}~${ing.gramsMax}g`
}
