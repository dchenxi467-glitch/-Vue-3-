/**
 * localStorage 持久化辅助
 * 信封格式：{ version, savedAt, data }，支持未来版本迁移
 */

const PREFIX = 'quelesha'
const CURRENT_VERSION = 1

interface Envelope<T> {
  version: number
  savedAt: number
  data: T
}

function keyOf(domain: string): string {
  return `${PREFIX}:${domain}:v${CURRENT_VERSION}`
}

export function loadData<T>(domain: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(keyOf(domain))
    if (!raw) return fallback
    const envelope = JSON.parse(raw) as Envelope<T>
    if (typeof envelope !== 'object' || envelope === null || !('data' in envelope)) {
      return fallback
    }
    if (envelope.version < CURRENT_VERSION) {
      return migrate(domain, envelope).data
    }
    return envelope.data
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

/** 版本迁移占位：未来 v1 → v2 时在此逐级升级 */
function migrate<T>(_domain: string, envelope: Envelope<T>): Envelope<T> {
  return { ...envelope, version: CURRENT_VERSION }
}

/** 防抖写回 */
export function debouncedSave<T>(domain: string, delay = 300): (data: T) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (data: T) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => saveData(domain, data), delay)
  }
}
