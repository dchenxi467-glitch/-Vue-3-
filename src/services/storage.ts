/**
 * localStorage 持久化辅助
 * 信封格式：{ version, savedAt, data }
 * v1 → v2：餐次早中晚→顺序正餐/加餐、克重点值→区间、画像 activity→occupation
 */

import type { MealRecord, Occupation, UserProfile } from '../types'

const PREFIX = 'quelesha'
const CURRENT_VERSION = 2

interface Envelope<T> {
  version: number
  savedAt: number
  data: T
}

function keyOf(domain: string, version = CURRENT_VERSION): string {
  return `${PREFIX}:${domain}:v${version}`
}

export function loadData<T>(domain: string, fallback: T): T {
  try {
    // 1. 读取当前版本
    const raw = localStorage.getItem(keyOf(domain))
    if (raw) {
      const envelope = JSON.parse(raw) as Envelope<T>
      if (typeof envelope === 'object' && envelope !== null && 'data' in envelope) {
        return envelope.data
      }
    }
    // 2. 尝试旧版本 key 并迁移
    for (let v = CURRENT_VERSION - 1; v >= 1; v--) {
      const legacyRaw = localStorage.getItem(keyOf(domain, v))
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as Envelope<unknown>
        const migrated = migrateData(domain, legacy.data, legacy.version ?? v) as T
        saveData(domain, migrated)
        return migrated
      }
    }
    return fallback
  } catch {
    return fallback
  }
}

export function saveData<T>(domain: string, data: T): void {
  try {
    const envelope: Envelope<T> = {
      version: CURRENT_VERSION,
      savedAt: Date.now(),
      data,
    }
    localStorage.setItem(keyOf(domain), JSON.stringify(envelope))
  } catch {
    // 存储满/隐私模式下静默失败，不影响运行时功能
  }
}

/** 逐级版本迁移 */
function migrateData(domain: string, data: unknown, fromVersion: number): unknown {
  let d = data
  if (fromVersion <= 1) {
    if (domain === 'meals') d = migrateMealsV1(d)
    if (domain === 'profile') d = migrateProfileV1(d)
  }
  return d
}

/* ------------------------- v1 → v2 迁移实现 ------------------------- */

interface LegacyIngredient {
  foodId: string
  grams?: number
  gramsMin?: number
  gramsMax?: number
}

interface LegacyMeal {
  id: string
  timestamp: number
  type?: string // 早餐/午餐/晚餐/加餐
  kind?: string
  title: string
  ingredients?: LegacyIngredient[]
  source?: string
}

function migrateMealsV1(data: unknown): MealRecord[] {
  if (!Array.isArray(data)) return []
  return (data as LegacyMeal[]).map((m) => ({
    id: m.id,
    timestamp: m.timestamp,
    kind: (m.type === '加餐' || m.kind === 'snack' ? 'snack' : 'meal') as MealRecord['kind'],
    title: m.title,
    ingredients: (m.ingredients ?? []).map((i) => ({
      foodId: i.foodId,
      gramsMin: i.grams ?? i.gramsMin ?? 0,
      gramsMax: i.grams ?? i.gramsMax ?? 0,
    })),
    source: (m.source ?? 'manual') as MealRecord['source'],
  }))
}

interface LegacyProfile {
  gender?: UserProfile['gender']
  age?: number
  weight?: number
  activity?: 'low' | 'medium' | 'high'
  diet?: UserProfile['diet']
  goals?: UserProfile['goals']
}

function migrateProfileV1(data: unknown): UserProfile {
  const p = (typeof data === 'object' && data !== null ? data : {}) as LegacyProfile
  const occupationMap: Record<string, Occupation> = {
    low: 'sedentary',
    medium: 'fitness',
    high: 'athlete',
  }
  return {
    gender: p.gender ?? 'female',
    age: p.age ?? 28,
    weight: p.weight ?? 55,
    occupation: occupationMap[p.activity ?? ''] ?? 'sedentary',
    special: 'none',
    diet: p.diet ?? 'omnivore',
    goals: Array.isArray(p.goals) ? p.goals : ['sleep', 'fatigue'],
  }
}

/** 防抖写回 */
export function debouncedSave<T>(domain: string, delay = 300): (data: T) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (data: T) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => saveData(domain, data), delay)
  }
}
