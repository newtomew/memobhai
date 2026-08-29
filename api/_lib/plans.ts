import { prisma } from './prisma';

export type PlanId = 'starter' | 'professional' | 'enterprise';

export const PLAN_LIMITS: Record<PlanId, {
  label: string;
  maxUsers: number | null;
  maxMemosPerMonth: number | null;
  maxWorkflowSteps: number | null;
  priceBdt: number | null;
}> = {
  starter: {
    label: 'Starter',
    maxUsers: 10,
    maxMemosPerMonth: 50,
    maxWorkflowSteps: 3,
    priceBdt: 0,
  },
  professional: {
    label: 'Professional',
    maxUsers: 100,
    maxMemosPerMonth: null,
    maxWorkflowSteps: null,
    priceBdt: 2999,
  },
  enterprise: {
    label: 'Enterprise',
    maxUsers: null,
    maxMemosPerMonth: null,
    maxWorkflowSteps: null,
    priceBdt: null,
  },
};

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function resetMemoCountIfNeeded(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { memoCountResetAt: true },
  });
  if (!org) return;
  const monthStart = startOfMonth();
  if (!org.memoCountResetAt || org.memoCountResetAt < monthStart) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { memoCountThisMonth: 0, memoCountResetAt: monthStart },
    });
  }
}

export async function getOrganizationPlanContext(organizationId: string) {
  await resetMemoCountIfNeeded(organizationId);
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      plan: true,
      planExpiresAt: true,
      memoCountThisMonth: true,
    },
  });
  if (!org) throw new Error('Organization not found');

  const planId = (org.plan || 'starter') as PlanId;
  const limits = PLAN_LIMITS[planId] ?? PLAN_LIMITS.starter;

  const activeUsers = await prisma.user.count({
    where: { organizationId, status: { in: ['active', 'pending'] } },
  });

  return {
    plan: planId,
    planExpiresAt: org.planExpiresAt,
    limits,
    usage: {
      users: activeUsers,
      memosThisMonth: org.memoCountThisMonth,
    },
  };
}

export async function assertCanCreateMemo(organizationId: string) {
  const ctx = await getOrganizationPlanContext(organizationId);
  const max = ctx.limits.maxMemosPerMonth;
  if (max != null && ctx.usage.memosThisMonth >= max) {
    return {
      ok: false as const,
      error: `Monthly memo limit reached (${max} on ${ctx.limits.label} plan). Upgrade to Professional for unlimited memos.`,
    };
  }
  return { ok: true as const, ctx };
}

export async function incrementMemoCount(organizationId: string) {
  await resetMemoCountIfNeeded(organizationId);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { memoCountThisMonth: { increment: 1 } },
  });
}

export async function assertCanAddUser(organizationId: string) {
  const ctx = await getOrganizationPlanContext(organizationId);
  const max = ctx.limits.maxUsers;
  if (max != null && ctx.usage.users >= max) {
    return {
      ok: false as const,
      error: `User limit reached (${max} on ${ctx.limits.label} plan). Upgrade to add more users.`,
    };
  }
  return { ok: true as const, ctx };
}

export function assertWorkflowStepsAllowed(planId: PlanId, stepCount: number) {
  const max = PLAN_LIMITS[planId]?.maxWorkflowSteps;
  if (max != null && stepCount > max) {
    return {
      ok: false as const,
      error: `Workflow limited to ${max} steps on ${PLAN_LIMITS[planId].label} plan. Upgrade to Professional.`,
    };
  }
  return { ok: true as const };
}
