import { NUTRIENTS, NUTRIENT_KEYS } from '../data/nutrients'
import { sumIntake } from './nutritionEngine'
import type {
  DayRates,
  MealRecord,
  NutrientKey,
  NutrientTarget,
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

/** 按天分组计算每种营养素的达标率（0~1+） */
export function dailyRates(
  meals: MealRecord[],
  targets: Record<NutrientKey, NutrientTarget>,
): DayRates[] {
  const byDay = new Map<string, MealRecord[]>()
  for (const meal of meals) {
    const key = dateKey(meal.timestamp)
    const list = byDay.get(key) ?? []
    list.push(meal)
    byDay.set(key, list)
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, dayMeals]) => {
      const intake = sumIntake(dayMeals)
      const rates = {} as Record<NutrientKey, number>
      for (const k of NUTRIENT_KEYS) rates[k] = intake[k] / targets[k].target
      return { date, rates }
    })
}

/** 取最近 N 天（含无记录的今天）的达标率序列 */
export function ratesInPeriod(
  meals: MealRecord[],
  targets: Record<NutrientKey, NutrientTarget>,
  days: number,
): DayRates[] {
  const all = dailyRates(meals, targets)
  const map = new Map(all.map((d) => [d.date, d]))
  const result: DayRates[] = []
  const zeroRates = () => {
    const r = {} as Record<NutrientKey, number>
    for (const k of NUTRIENT_KEYS) r[k] = 0
    return r
  }
  for (let i = days - 1; i >= 0; i--) {
    const ts = Date.now() - i * 86400000
    const key = dateKey(ts)
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
  targets: Record<NutrientKey, NutrientTarget>,
  days: number,
): NutrientHeat[] {
  const period = ratesInPeriod(meals, targets, days)
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
}

/** 长期缺乏风险描述映射 */
const RISK_NOTE: Partial<Record<NutrientKey, string>> = {
  mg: '长期缺镁容易引起神经疲劳、睡眠质量下降以及肌肉抽搐',
  fe: '长期缺铁可能导致面色苍白、疲劳乏力与注意力下降',
  ca: '长期钙摄入不足影响骨密度与骨骼健康',
  zn: '缺锌可能影响免疫恢复与皮肤修复',
  vc: 'VC 长期不足影响抗氧化能力与胶原蛋白合成',
  vd: 'VD 长期不足影响钙吸收、骨骼与免疫功能',
  vb12: 'VB12 长期不足可能导致巨幼细胞贫血与神经系统问题',
}

/**
 * 预警规则：
 * 高风险——达标率 <60% 的天数占比 ≥70%（且周期内有记录天数 ≥3）
 * 中风险——均值 60%~80% 且达标天数占比 <50%
 */
export function buildWarnings(
  meals: MealRecord[],
  targets: Record<NutrientKey, NutrientTarget>,
  days: number,
): Warning[] {
  const period = ratesInPeriod(meals, targets, days)
  const recorded = period.filter((d) =>
    NUTRIENT_KEYS.some((k) => d.rates[k] > 0),
  )
  if (recorded.length < 3) return []

  const warnings: Warning[] = []
  for (const key of NUTRIENT_KEYS) {
    const rates = recorded.map((d) => d.rates[key])
    const avg = rates.reduce((s, r) => s + r, 0) / rates.length
    const lowDays = rates.filter((r) => r < 0.6).length
    const okDays = rates.filter((r) => r >= 1).length
    const name = NUTRIENTS[key].name

    if (lowDays / rates.length >= 0.7) {
      warnings.push({
        nutrient: key,
        level: 'high',
        title: `缺乏风险：${name} 连续 ${lowDays} 天未达标`,
        analysis: `过去 ${days} 天内，你的${name}平均摄入量仅为推荐值的 ${Math.round(avg * 100)}%。${RISK_NOTE[key] ?? '长期摄入不足可能影响健康。'}`,
        advice: ADVICE[key],
      })
    } else if (avg >= 0.6 && avg < 0.8 && okDays / rates.length < 0.5) {
      warnings.push({
        nutrient: key,
        level: 'medium',
        title: `潜在偏低：${name} 摄入波动大`,
        analysis: `${name}仅在部分日期达标（${okDays}/${rates.length} 天），平均达标率 ${Math.round(avg * 100)}%。${RISK_NOTE[key] ?? ''}`,
        advice: ADVICE[key],
      })
    }
  }
  // 高风险优先，其次按平均达标率从低到高（已体现在生成顺序，这里只排级别）
  return warnings.sort((a, b) => (a.level === b.level ? 0 : a.level === 'high' ? -1 : 1))
}
