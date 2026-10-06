import type { MaintCycle } from './elevator';
import type { Revisioned } from './persistence';

/** 计划状态：待执行 / 执行中 / 已签署 */
export type PlanState = 'pending' | 'executing' | 'signed';

export const PLAN_STATE_LABEL: Record<PlanState, string> = {
  pending: '待执行',
  executing: '执行中',
  signed: '已签署',
};

/** 计划状态流转 */
export const PLAN_STATE_FLOW: Record<PlanState, PlanState[]> = {
  pending: ['executing'],
  executing: ['signed'],
  signed: [],
};

/** 保养计划 */
export interface Plan extends Revisioned {
  id: string;
  /** 所属电梯 */
  elevatorId: string;
  /** 周期类型 */
  cycleType: MaintCycle;
  /** 计划日期 yyyy-MM-dd */
  planDate: string;
  /** 执行人（交接后为接替人） */
  executor: string;
  /** 原执行人（发生交接前的上一任），未交接为 null */
  handoverFrom: string | null;
  /** 交接时间 yyyy-MM-dd HH:mm，未交接为 null */
  handoverAt: string | null;
  /** 状态 */
  state: PlanState;
  /** 签署时间 yyyy-MM-dd HH:mm */
  signedAt: string | null;
  createdAt: string;
}

/** 新建计划的表单草稿 */
export interface PlanDraft {
  elevatorId: string;
  cycleType: MaintCycle;
  planDate: string;
  executor: string;
}

/** 计划视图行：带电梯上下文与逾期、完成度 */
export interface PlanView extends Plan {
  elevatorName: string;
  owner: string;
  /** 该计划下保养项总数 */
  itemCount: number;
  /** 已有结果（非空）的保养项数 */
  filledCount: number;
  /** 剩余（未填写结果）的保养项数 */
  remainingCount: number;
  /** 异常项数 */
  abnormalCount: number;
  /** 是否逾期（未签署且计划日期早于今天） */
  overdue: boolean;
  /** 完成度（%） */
  progress: number;
}

/** 执行人交接结果 */
export interface HandoverResult {
  ok: boolean;
  message: string;
  /** 已填并沿用原执行人认定的项目数 */
  keptCount: number;
  /** 未填、交接后归接替人的项目数 */
  openCount: number;
}

/** 计划逾期判定 */
export function isPlanOverdue(plan: Plan, today: Date = new Date()): boolean {
  if (plan.state === 'signed') return false;
  const date = new Date(`${plan.planDate}T23:59:59`);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < today.getTime();
}

/** 计划完成度（%）：已完成保养项 / 总项 */
export function planProgress(filledCount: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  return Number(((filledCount / itemCount) * 100).toFixed(1));
}
