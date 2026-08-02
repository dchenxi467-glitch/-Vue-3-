import type { SupplementDef } from '../types'

/**
 * 常见膳食补充剂预设库（单粒/单片营养素含量）
 * 数值取市面主流产品典型规格，仅供参考
 */
export const SUPPLEMENT_PRESETS: SupplementDef[] = [
  {
    id: 'multivitamin', name: '复合维生素片', doseUnit: '粒',
    perDose: { va: 500, vc: 60, vd: 5, ve: 10, vb1: 1.5, vb12: 2.4, folate: 400, ca: 100, mg: 50, fe: 5, zn: 5 },
  },
  {
    id: 'calcium_500', name: '钙片 500mg', doseUnit: '片',
    perDose: { ca: 500, vd: 1.25 },
  },
  {
    id: 'vc_effervescent', name: 'VC 泡腾片 1000mg', doseUnit: '片',
    perDose: { vc: 1000 },
  },
  {
    id: 'vd_drops', name: '维生素 D 滴剂 400IU', doseUnit: '粒',
    perDose: { vd: 10 },
  },
  {
    id: 'magnesium_250', name: '镁片 250mg', doseUnit: '片',
    perDose: { mg: 250 },
  },
  {
    id: 'iron_10', name: '铁补充剂 10mg', doseUnit: '粒',
    perDose: { fe: 10, vc: 30 },
  },
  {
    id: 'folate_400', name: '叶酸片 400μg', doseUnit: '片',
    perDose: { folate: 400 },
  },
  {
    id: 'prenatal', name: '孕妇复合维生素', doseUnit: '粒',
    perDose: { folate: 400, fe: 10, ca: 200, vd: 5, vb12: 2, zn: 5 },
  },
  {
    id: 'zinc_10', name: '锌片 10mg', doseUnit: '片',
    perDose: { zn: 10 },
  },
  {
    id: 'omega3', name: '鱼油胶囊', doseUnit: '粒',
    perDose: { ve: 1 },
  },
]
