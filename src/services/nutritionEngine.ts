import { NUTRIENTS, NUTRIENT_KEYS } from '../data/nutrients'
import { getFood } from '../data/foods'
import type {
  MealRecord,
  NutrientKey,
  NutrientTarget,
  Standard,
  UserProfile,
} from '../types'

/** 运动强度对易流失营养素的调整系数 */
const ACTIVITY_FACTOR: Record<UserProfile['activity'], number> = {
  low: 1,
  medium: 1.15,
  high: 1.3,
}

/**
 * 根据用户画像 + 评估标准，计算每种营养素的目标值
 * 逻辑：基础 RNI → 年龄分段 → 运动系数 → 饮食偏好调整 → 进阶标准替换
 */
export function calcTargets(
  profile: UserProfile,
  standard: Standard,
): Record<NutrientKey, NutrientTarget> {
  const result = {} as Record<NutrientKey, NutrientTarget>
  const factor = ACTIVITY_FACTOR[profile.activity]
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

    // 2. 运动系数：作用于易随汗液/代谢流失的营养素
    if (def.exerciseBoost) {
      target *= factor
    }
    // 高强度运动额外增加铁需求
    if (key === 'fe' && profile.activity === 'high') {
      target *= 1.1
    }

    // 3. 饮食偏好调整
    let pinned = false
    if (profile.diet === 'vegan') {
      // 纯素：非血红素铁吸收率低，需求上调；锌同理；VB12 几乎无法从植物获取，置顶监控
      if (key === 'fe') target *= 1.8
      if (key === 'zn') target *= 1.5
      if (key === 'vb12' || key === 'fe' || key === 'zn') pinned = true
    }
    if (profile.diet === 'keto') {
      // 生酮/低碳：电解质流失加快，镁置顶
      if (key === 'mg') pinned = true
    }

    // 4. 进阶标准：用文献推荐值替换（已在饮食偏好调整后，取二者较大值更稳妥）
    if (standard === 'advanced') {
      target = Math.max(target, def.advanced)
    }

    result[key] = { target: round1(target), ul: def.ul, pinned }
  }

  return result
}

/**
 * 按关注目标对营养素排序：置顶关注 + 偏好 pinned 的排前面
 */
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

/** 汇总一组餐食的营养素摄入量 */
export function sumIntake(meals: MealRecord[]): Record<NutrientKey, number> {
  const totals = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0])) as Record<
    NutrientKey,
    number
  >
  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const food = getFood(ing.foodId)
      if (!food) continue
      for (const key of NUTRIENT_KEYS) {
        const per100 = food.per100g[key]
        if (per100) totals[key] += (per100 * ing.grams) / 100
      }
    }
  }
  for (const key of NUTRIENT_KEYS) totals[key] = round1(totals[key])
  return totals
}

/** 综合健康完成度：Σ min(1, 摄入/目标) / n × 100 */
export function dayScore(
  intake: Record<NutrientKey, number>,
  targets: Record<NutrientKey, NutrientTarget>,
): number {
  let total = 0
  for (const key of NUTRIENT_KEYS) {
    total += Math.min(1, intake[key] / targets[key].target)
  }
  return Math.round((total / NUTRIENT_KEYS.length) * 100)
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
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
