import { prisma } from './prisma';

export async function getActiveDelegatorIds(delegateId: string): Promise<string[]> {
  const now = new Date();
  const delegations = await prisma.delegation.findMany({
    where: {
      delegateId,
      status: 'active',
      startDate: { lte: now },
      endDate: { gte: now },
    },
    select: { delegatingUserId: true },
  });
  return delegations.map((d) => d.delegatingUserId);
}

export async function findPendingWorkflowStep(memoId: string, actorUserId: string) {
  const direct = await prisma.workflowStep.findFirst({
    where: { memoId, userId: actorUserId, status: 'pending' },
    include: { memo: true },
  });
  if (direct) return { step: direct, actingAsDelegate: false };

  const delegatorIds = await getActiveDelegatorIds(actorUserId);
  if (delegatorIds.length === 0) return null;

  const delegated = await prisma.workflowStep.findFirst({
    where: { memoId, userId: { in: delegatorIds }, status: 'pending' },
    include: { memo: true },
  });
  if (!delegated) return null;

  return { step: delegated, actingAsDelegate: true };
}

export async function canUserActOnMemo(memoId: string, actorUserId: string): Promise<boolean> {
  const result = await findPendingWorkflowStep(memoId, actorUserId);
  return result !== null;
}
