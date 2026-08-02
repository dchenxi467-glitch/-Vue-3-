import { findFoodByName, registerCustomFood } from '../data/foods'
import type { AiRecognizeResult, MealIngredient } from '../types'

/**
 * AI 食物识别服务抽象层
 * 当前为 Mock 实现；接入真实大模型时：
 *   1. 实现 AiService 接口（如 OpenAiService）
 *   2. 在 .env 设置 VITE_AI_PROVIDER=openai 与 VITE_AI_API_KEY
 *   3. 在 createAiService 工厂中按 provider 返回对应实现
 */
export interface AiService {
  /** 识别上传的图片，返回食材列表 + 估算克重区间 */
  recognizeImage(image: File | string): Promise<AiRecognizeResult>
  /** 结合文字补充描述，对当前识别结果做动态修正（修正值为点值） */
  refine(text: string, current: AiRecognizeResult | null): Promise<AiRecognizeResult>
}

/* ------------------------------- Mock 实现 ------------------------------- */

const MOCK_DELAY = 800

/** 预设识别结果轮换：克重为区间，体现 AI 估算的不确定性 */
const MOCK_PRESETS: AiRecognizeResult[] = [
  {
    title: '菠菜牛肉面',
    ingredients: [
      { foodId: 'spinach', gramsMin: 120, gramsMax: 150 },
      { foodId: 'beef', gramsMin: 80, gramsMax: 100 },
      { foodId: 'noodles', gramsMin: 140, gramsMax: 180 },
    ],
    isMixedDish: false,
    note: 'AI 识别为：菠菜牛肉面（克重为估算区间，可文字修正）',
  },
  {
    title: '麻辣烫',
    ingredients: [
      { foodId: 'spinach', gramsMin: 80, gramsMax: 120 },
      { foodId: 'tofu', gramsMin: 100, gramsMax: 150 },
      { foodId: 'beef', gramsMin: 50, gramsMax: 80 },
      { foodId: 'noodles', gramsMin: 100, gramsMax: 150 },
    ],
    isMixedDish: true,
    note: 'AI 识别为：麻辣烫（混合菜肴，估算偏差可能较大）',
  },
  {
    title: '鸡胸肉沙拉',
    ingredients: [
      { foodId: 'chicken_breast', gramsMin: 100, gramsMax: 130 },
      { foodId: 'broccoli', gramsMin: 80, gramsMax: 120 },
      { foodId: 'mixed_nuts', gramsMin: 15, gramsMax: 25 },
    ],
    isMixedDish: false,
    note: 'AI 识别为：鸡胸肉沙拉（克重为估算区间，可文字修正）',
  },
]

let presetCursor = 0

const CN_NUM: Record<string, number> = {
  零: 0, 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
}

function parseAmount(raw: string): number {
  if (/^\d+(?:\.\d+)?$/.test(raw)) return parseFloat(raw)
  if (raw in CN_NUM) return CN_NUM[raw]
  if (raw.length === 2 && raw[0] === '十' && raw[1] in CN_NUM) return 10 + CN_NUM[raw[1]]
  return NaN
}

const NUM = '(\\d+(?:\\.\\d+)?|[零一二两三四五六七八九十]{1,2})'
const UNIT = '(克|g|G|颗|个|只|杯|碗|块)'
const NAME = '([一-龥A-Za-z]{2,6}?)'

/** 把"颗/杯/碗"等单位换算成克 */
function toGrams(amount: number, unit: string, pieceGrams?: number): number {
  switch (unit) {
    case '克':
    case 'g':
    case 'G':
      return amount
    case '颗':
    case '个':
    case '只':
    case '块':
      return amount * (pieceGrams ?? 100)
    case '杯':
      return amount * 240
    case '碗':
      return amount * 300
    default:
      return amount
  }
}

interface ParsedItem {
  name: string
  amount: number
  unit: string
}

function parseCorrectionText(text: string): ParsedItem[] {
  const items: ParsedItem[] = []
  const seen = new Set<string>()

  // 模式 1："菠菜50g"、"菠菜只有50克"
  const p1 = new RegExp(`${NAME}\\s*(?:只有|大约|约|大概|是|放了|加了)?\\s*${NUM}\\s*${UNIT}`, 'g')
  // 模式 2："1颗鸡蛋"、"两块煎豆腐"
  const p2 = new RegExp(`${NUM}\\s*${UNIT}\\s*${NAME}`, 'g')

  for (const re of [p1, p2]) {
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const nameFirst = re === p1
      const name = nameFirst ? m[1] : m[3]
      const amount = parseAmount(nameFirst ? m[2] : m[1])
      const unit = nameFirst ? m[3] : m[2]
      // 过滤常见动词误判（如"吃了""还有"被当作食物名）
      if (['吃了', '还有', '另外', '刚才', '里面', '其实'].includes(name)) continue
      if (isNaN(amount) || seen.has(name)) continue
      seen.add(name)
      items.push({ name, amount, unit })
    }
  }
  return items
}

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

class MockAiService implements AiService {
  async recognizeImage(_image: File | string): Promise<AiRecognizeResult> {
    const preset = MOCK_PRESETS[presetCursor % MOCK_PRESETS.length]
    presetCursor++
    return delay(structuredClone(preset), MOCK_DELAY)
  }

  async refine(text: string, current: AiRecognizeResult | null): Promise<AiRecognizeResult> {
    const parsed = parseCorrectionText(text)
    const base: AiRecognizeResult = current
      ? structuredClone(current)
      : { title: '自定义餐食', ingredients: [] }

    const unmatched: string[] = []
    for (const item of parsed) {
      const food = findFoodByName(item.name)
      const target = food ?? registerCustomFood(item.name)
      if (!food) unmatched.push(item.name)
      const grams = Math.round(toGrams(item.amount, item.unit, target.pieceGrams))

      const existing = base.ingredients.find((i) => i.foodId === target.id)
      if (existing) {
        // 用户修正为确定克重：区间收敛为点值
        existing.gramsMin = grams
        existing.gramsMax = grams
      } else {
        base.ingredients.push({ foodId: target.id, gramsMin: grams, gramsMax: grams })
      }
    }

    base.note =
      parsed.length > 0
        ? `已结合文字修正更新 ${parsed.length} 项食材` +
          (unmatched.length ? `；「${unmatched.join('、')}」暂按自定义食材记录（营养素待补全）` : '')
        : '未识别出具体食材克重，已原样保留描述'
    return delay(base, MOCK_DELAY)
  }
}

/* --------------------------------- 工厂 --------------------------------- */

function createAiService(): AiService {
  const provider = import.meta.env.VITE_AI_PROVIDER
  // if (provider === 'openai') return new OpenAiService(import.meta.env.VITE_AI_API_KEY)
  void provider
  return new MockAiService()
}

export const aiService: AiService = createAiService()

/* ------------------------------ 多图合并工具 ------------------------------ */

/** 把一次新的识别结果合并进当前餐（相同食材克重区间累加） */
export function mergeResults(
  current: AiRecognizeResult,
  addition: AiRecognizeResult,
): AiRecognizeResult {
  const merged = structuredClone(current)
  for (const ing of addition.ingredients) {
    const existing = merged.ingredients.find((i: MealIngredient) => i.foodId === ing.foodId)
    if (existing) {
      existing.gramsMin += ing.gramsMin
      existing.gramsMax += ing.gramsMax
    } else {
      merged.ingredients.push({ ...ing })
    }
  }
  if (!merged.title.includes(addition.title)) {
    merged.title = `${merged.title} + ${addition.title}`
  }
  merged.isMixedDish = merged.isMixedDish || addition.isMixedDish
  merged.note = `已合并 ${addition.title} 的识别结果`
  return merged
}
