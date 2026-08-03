import { NUTRIENTS, NUTRIENT_KEYS } from '../data/nutrients'
import { addIntakes, mid, sumIntake, sumSupplements } from './nutritionEngine'
import type {
  DayRates,
  MealRecord,
  NutrientKey,
  NutrientTarget,
  SupplementRecord,
  Warning,
} from '../types'

export type HeatStatus = 'good' | 'warning' | 'danger'

export interface NutrientHeat {
  key: NutrientKey
  name: string
  avg: number
  status: HeatStatus
}

function dateKey(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * 按天分组计算达标率（食物 + 补充剂总摄入，取区间中值 / 目标）
 * 长期监测看"身体实际获得"，因此含补充剂
 */
export function dailyRates(
  meals: MealRecord[],
  supplements: SupplementRecord[],
  targets: Record<NutrientKey, NutrientTarget>,
): DayRates[] {
  const mealDays = new Map<string, MealRecord[]>()
  const suppDays = new Map<string, SupplementRecord[]>()
  for (const meal of meals) {
    const key = dateKey(meal.timestamp)
    mealDays.set(key, [...(mealDays.get(key) ?? []), meal])
  }
  for (const s of supplements) {
    const key = dateKey(s.timestamp)
    suppDays.set(key, [...(suppDays.get(key) ?? []), s])
  }

  const allKeys = new Set([...mealDays.keys(), ...suppDays.keys()])
  return [...allKeys]
    .sort()
    .map((date) => {
      const intake = addIntakes(
        sumIntake(mealDays.get(date) ?? []),
        sumSupplements(suppDays.get(date) ?? []),
      )
      const rates = {} as Record<NutrientKey, number>
      for (const k of NUTRIENT_KEYS) rates[k] = mid(intake[k]) / targets[k].target
      return { date, rates }
    })
}

/** 取最近 N 天（含无记录日）的达标率序列 */
export function ratesInPeriod(
  meals: MealRecord[],
  supplements: SupplementRecord[],
  targets: Record<NutrientKey, NutrientTarget>,
  days: number,
): DayRates[] {
  const map = new Map(dailyRates(meals, supplements, targets).map((d) => [d.date, d]))
  const zeroRates = () => {
    const r = {} as Record<NutrientKey, number>
    for (const k of NUTRIENT_KEYS) r[k] = 0
    return r
  }
  const result: DayRates[] = []
  for (let i = days - 1; i >= 0; i--) {
    const key = dateKey(Date.now() - i * 86400000)
    result.push(map.get(key) ?? { date: key, rates: zeroRates() })
  }
  return result
}

/** 热力状态：均值 ≥80% 绿灯；50-80% 黄灯；<50% 红灯 */
export function heatStatus(rates: number[]): { avg: number; status: HeatStatus } {
  if (rates.length === 0) return { avg: 0, status: 'danger' }
  const avgRatio = rates.reduce((s, r) => s + Math.min(r, 1.5), 0) / rates.length
  const avg = Math.round(avgRatio * 100)
  if (avg >= 80) return { avg, status: 'good' }
  if (avg >= 50) return { avg, status: 'warning' }
  return { avg, status: 'danger' }
}

export function buildHeatmap(
  meals: MealRecord[],
  supplements: SupplementRecord[],
  targets: Record<NutrientKey, NutrientTarget>,
  days: number,
): NutrientHeat[] {
  const period = ratesInPeriod(meals, supplements, targets, days)
  return NUTRIENT_KEYS.map((key) => {
    const { avg, status } = heatStatus(period.map((d) => d.rates[key]))
    return { key, name: NUTRIENTS[key].name, avg, status }
  })
}

/** 改善建议食物映射 */
const ADVICE: Partial<Record<NutrientKey, string>> = {
  mg: '晚餐增加南瓜籽、黑巧克力或深绿色叶菜（菠菜、羽衣甘蓝）',
  fe: '增加红肉、猪肝等血红素铁来源，搭配 VC 同餐促进吸收',
  ca: '增加奶制品、豆腐、芝麻等富钙食物',
  zn: '增加贝类海鲜、红肉或南瓜籽',
  vc: '增加鲜枣、猕猴桃、橙子或西兰花',
  vd: '增加三文鱼、蛋黄，适当日晒；必要时评估补充剂',
  va: '增加动物肝脏（每周一次）或橙黄色蔬果（胡萝卜、芒果）',
  ve: '增加杏仁、葵花籽等坚果种子',
  vb1: '增加全谷物（燕麦、糙米）与瘦猪肉',
  vb12: '增加蛋奶、鱼虾；纯素食者建议评估 VB12 补充剂',
  folate: '增加深绿色叶菜（菠菜、芦笋）、豆类与动物肝脏；备孕/孕期建议叶酸补充剂',
}

/** 长期缺乏风险描述映射 */
const RISK_NOTE: Partial<Record<NutrientKey, string>> = {
  mg: '长期缺镁容易引起神经疲劳、睡眠质量下降以及肌肉抽搐',
  fe: '长期缺铁可能导致面色苍白、疲劳乏力与注意力下降',
  ca: '长期钙摄入不足影响骨密度与骨骼健康，建议关注骨骼健康',
  zn: '缺锌可能影响免疫恢复与皮肤修复',
  vc: 'VC 长期不足影响抗氧化能力与胶原蛋白合成',
  vd: 'VD 长期不足影响钙吸收、骨骼与免疫功能',
  vb12: 'VB12 长期不足可能导致巨幼细胞贫血与神经系统问题',
  folate: '叶酸长期不足影响造血与同型半胱氨酸代谢，备孕/孕期尤为关键',
}

/**
 * 长期缺乏预警（需求 8：达标天数占比算法）
 * 判定基准为【基础标准】targets：
 * 高风险——超过 50% 的记录天数低于基础推荐量
 * 中风险——30%~50% 的记录天数未达标（摄入波动大）
 */
export function buildWarnings(
  meals: MealRecord[],
  supplements: SupplementRecord[],
  basicTargets: Record<NutrientKey, NutrientTarget>,
  days: number,
): Warning[] {
  const period = ratesInPeriod(meals, supplements, basicTargets, days)
  const recorded = period.filter((d) => NUTRIENT_KEYS.some((k) => d.rates[k] > 0))
  if (recorded.length < 3) return []

  const warnings: Warning[] = []
  for (const key of NUTRIENT_KEYS) {
    const rates = recorded.map((d) => d.rates[key])
    const lowDays = rates.filter((r) => r < 1).length
    const ratio = lowDays / rates.length
    const avg = rates.reduce((s, r) => s + r, 0) / rates.length
    const name = NUTRIENTS[key].name

    if (ratio > 0.5) {
      warnings.push({
        nutrient: key,
        level: 'high',
        title: `缺乏风险：${name} ${lowDays}/${rates.length} 天未达基础推荐量`,
        analysis: `过去 ${days} 天内，您有 ${lowDays} 天的${name}摄入低于基础标准（平均达标率 ${Math.round(avg * 100)}%）。${RISK_NOTE[key] ?? '长期摄入不足可能影响健康。'}`,
        advice: ADVICE[key],
      })
    } else if (ratio >= 0.3) {
      warnings.push({
        nutrient: key,
        level: 'medium',
        title: `潜在偏低：${name} 摄入波动大（${lowDays}/${rates.length} 天未达标）`,
        analysis: `${name}平均达标率 ${Math.round(avg * 100)}%，但 ${lowDays} 天未达基础推荐量。${RISK_NOTE[key] ?? ''}`,
        advice: ADVICE[key],
      })
    }
  }
  return warnings.sort((a, b) => (a.level === b.level ? 0 : a.level === 'high' ? -1 : 1))
}

/**
 * UL 越界善意预警（需求 4：单日或多日平均超 UL）
 * 每个营养素最多产出一个预警，按优先级：
 * 1. 周期平均摄入 > UL → 红色（长期超量）
 * 2. 任一记录日单日摄入 > UL → 红色（单日超量）
 * 3. 周期平均摄入 ≥ 80% UL → 黄色（接近上限）
 */
export function buildUlWarnings(
  meals: MealRecord[],
  supplements: SupplementRecord[],
  targets: Record<NutrientKey, NutrientTarget>,
  days: number,
): Warning[] {
  const period = ratesInPeriod(meals, supplements, targets, days)
  const recorded = period.filter((d) => NUTRIENT_KEYS.some((k) => d.rates[k] > 0))
  if (recorded.length === 0) return []

  const warnings: Warning[] = []
  for (const key of NUTRIENT_KEYS) {
    const def = NUTRIENTS[key]
    const ul = targets[key].ul
    // rates × target ≈ 实际摄入（中值）；用达标率换算回摄入量比例
    const avgIntakeRatio =
      recorded.reduce((s, d) => s + d.rates[key], 0) / recorded.length
    const avgIntake = avgIntakeRatio * targets[key].target
    const ulRatio = avgIntake / ul

    if (ulRatio > 1) {
      warnings.push({
        nutrient: key,
        level: 'high',
        title: `超量提醒：${def.name} 平均摄入已超最高耐受量`,
        analysis: `过去 ${days} 天您的${def.name}平均摄入量约 ${Math.round(avgIntake)}${def.unit}，已超过 UL 上限 ${ul}${def.unit}。长期超量可能带来健康负担，建议适度减少补充剂剂量。`,
      })
      continue
    }

    // 单日维度：任一记录日该营养素摄入超 UL
    const worstDay = recorded.reduce((a, b) => (b.rates[key] > a.rates[key] ? b : a))
    const worstIntake = worstDay.rates[key] * targets[key].target
    if (worstDay.rates[key] > 0 && worstIntake > ul) {
      warnings.push({
        nutrient: key,
        level: 'high',
        title: `超量提醒：${def.name} ${worstDay.date} 单日摄入超最高耐受量`,
        analysis: `${worstDay.date} 您的${def.name}单日摄入量约 ${Math.round(worstIntake)}${def.unit}，已超过 UL 上限 ${ul}${def.unit}。偶发单日超量通常无需过度担心，但若主要来自补充剂，建议适度减少剂量。`,
      })
      continue
    }

    if (ulRatio >= 0.8) {
      warnings.push({
        nutrient: key,
        level: 'medium',
        title: `接近上限：${def.name} 平均摄入达 UL 的 ${Math.round(ulRatio * 100)}%`,
        analysis: `过去 ${days} 天您的${def.name}平均摄入量约 ${Math.round(avgIntake)}${def.unit}（UL 上限 ${ul}${def.unit}）。若主要来自补充剂，建议维持当前剂量不再追加。`,
      })
    }
  }
  return warnings.sort((a, b) => (a.level === b.level ? 0 : a.level === 'high' ? -1 : 1))
}
