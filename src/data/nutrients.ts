import type { NutrientDef, NutrientKey } from '../types'

/**
 * 营养素定义表
 * 基础标准：《中国居民膳食营养素参考摄入量 (2023版)》 RNI/AI（18-49 岁成人）
 * 进阶标准：前沿文献针对优化健康/高效能的推荐区间取值
 */
export const NUTRIENTS: Record<NutrientKey, NutrientDef> = {
  va: {
    key: 'va', name: '维生素 A', unit: 'μg',
    rni: { male: 800, female: 700 },
    ul: 3000, advanced: 900, exerciseBoost: false,
    goalTags: ['skin', 'immune'],
  },
  vc: {
    key: 'vc', name: '维生素 C', unit: 'mg',
    rni: { male: 100, female: 100 },
    ul: 2000, advanced: 250, exerciseBoost: true,
    goalTags: ['skin', 'immune'],
  },
  vd: {
    key: 'vd', name: '维生素 D', unit: 'μg',
    rni: { male: 10, female: 10 },
    senior: { male: 15, female: 15 },
    ul: 50, advanced: 25, exerciseBoost: false,
    goalTags: ['bone', 'immune', 'sleep'],
  },
  ve: {
    key: 've', name: '维生素 E', unit: 'mg',
    rni: { male: 14, female: 14 },
    ul: 700, advanced: 20, exerciseBoost: false,
    goalTags: ['skin'],
  },
  vb1: {
    key: 'vb1', name: '维生素 B1', unit: 'mg',
    rni: { male: 1.4, female: 1.2 },
    ul: 50, advanced: 2.0, exerciseBoost: true,
    goalTags: ['fatigue'],
  },
  vb12: {
    key: 'vb12', name: '维生素 B12', unit: 'μg',
    rni: { male: 2.4, female: 2.4 },
    ul: 100, advanced: 4, exerciseBoost: false,
    goalTags: ['fatigue'],
  },
  folate: {
    key: 'folate', name: '叶酸 (B9)', unit: 'μg',
    rni: { male: 400, female: 400 },
    ul: 1000, advanced: 600, exerciseBoost: false,
    goalTags: ['immune'],
  },
  ca: {
    key: 'ca', name: '钙 (Ca)', unit: 'mg',
    rni: { male: 800, female: 800 },
    senior: { male: 1000, female: 1000 },
    ul: 2000, advanced: 1000, exerciseBoost: false,
    goalTags: ['bone'],
  },
  mg: {
    key: 'mg', name: '镁 (Mg)', unit: 'mg',
    rni: { male: 330, female: 330 },
    ul: 1000, advanced: 450, exerciseBoost: true,
    goalTags: ['sleep', 'bone'],
  },
  fe: {
    key: 'fe', name: '铁 (Fe)', unit: 'mg',
    rni: { male: 12, female: 20 },
    senior: { female: 12 },
    ul: 42, advanced: 22, exerciseBoost: true,
    goalTags: ['fatigue'],
  },
  zn: {
    key: 'zn', name: '锌 (Zn)', unit: 'mg',
    rni: { male: 12.5, female: 7.5 },
    ul: 40, advanced: 15, exerciseBoost: true,
    goalTags: ['immune', 'skin'],
  },
}

export const NUTRIENT_KEYS = Object.keys(NUTRIENTS) as NutrientKey[]
