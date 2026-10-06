import type { Revisioned } from './persistence';

/** 保养项结果：正常 / 异常 / 建议 */
export type CheckResult = 'normal' | 'abnormal' | 'advice';

export const CHECK_RESULT_LABEL: Record<CheckResult, string> = {
  normal: '正常',
  abnormal: '异常',
  advice: '建议',
};

/** 保养项名称字典（半月 / 季度 / 年度周期各自的必检项） */
export const CHECK_ITEM_LIBRARY: string[] = [
  '制动器动作试验',
  '层门锁紧装置',
  '限速器动作',
  '缓冲器检查',
  '钢丝绳磨损',
  '导靴与导轨间隙',
  '平层准确度',
  '超载保护装置',
  '应急照明与警铃',
  '机房温度与通风',
];

/** 保养项 */
export interface CheckItem extends Revisioned {
  id: string;
  /** 所属计划 */
  planId: string;
  /** 序号 */
  seq: number;
  /** 项目名 */
  itemName: string;
  /** 结果，未填写为 null */
  result: CheckResult | null;
  /** 结果填写人（未填写为 null）；交接后已填项沿用原填写人，接替人改过原结果才改归接替人 */
  filledBy: string | null;
  /** 实测值描述 */
  value: string;
  /** 备注 */
  remark: string;
  createdAt: string;
}

/** 保养项编辑草稿 */
export interface CheckItemDraft {
  itemName: string;
  result: CheckResult | null;
  value: string;
  remark: string;
}

/** 保养项视图：补充计划与电梯上下文 */
export interface CheckItemView extends CheckItem {
  elevatorId: string;
  elevatorName: string;
  cycleType: string;
  planDate: string;
}

/** 依据周期类型给出必检项清单 */
export function itemsForCycle(cycle: 'halfMonth' | 'quarter' | 'year'): string[] {
  if (cycle === 'halfMonth') return CHECK_ITEM_LIBRARY.slice(0, 5);
  if (cycle === 'quarter') return CHECK_ITEM_LIBRARY.slice(0, 8);
  return CHECK_ITEM_LIBRARY;
}

/** 异常项判定 */
export function isAbnormal(result: CheckResult | null): boolean {
  return result === 'abnormal' || result === 'advice';
}

/**
 * 保养项归属判定（执行人交接口径）：
 * - 结果被清空 → 归属清空（回到未填状态）
 * - 新填结果（null → 有值）→ 归当前执行人
 * - 接替人修改了原结果（有值 → 不同值）→ 改归当前执行人
 * - 结果未变（仅改实测值 / 备注或原样保存）→ 沿用原填写人，避免把没做过的检查记到接替人名下
 */
export function resolveFilledBy(
  existing: Pick<CheckItem, 'result' | 'filledBy'>,
  nextResult: CheckResult | null,
  currentExecutor: string,
): string | null {
  if (nextResult === null) return null;
  if (existing.result === null) return currentExecutor;
  if (existing.result !== nextResult) return currentExecutor;
  return existing.filledBy ?? currentExecutor;
}

/** 实测值缺省值建议（按项目名给出参考格式） */
export function valuePlaceholderOf(itemName: string): string {
  if (itemName.includes('间隙')) return '如：2.5mm';
  if (itemName.includes('平层')) return '如：±3mm';
  if (itemName.includes('温度')) return '如：32℃';
  if (itemName.includes('动作')) return '如：动作正常 / 动作迟缓';
  return '如：合格 / 实测值';
}
