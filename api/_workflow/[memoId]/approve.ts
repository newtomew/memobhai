import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { apiHandler } from '../../_lib/handler';
import { findPendingWorkflowStep } from '../../_lib/delegations';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { memoId } = req.query as { memoId: string };
  const { comment } = req.body;

  const found = await findPendingWorkflowStep(memoId, ctx.userId);
  if (!found) return res.status(404).json({ error: 'No pending workflow step found for you on this memo' });

  const { step, actingAsDelegate } = found;
  const memo = step.memo;
  if (memo.organizationId !== ctx.organizationId) return res.status(403).json({ error: 'Forbidden' });

  await prisma.approval.create({
    data: {
      memoId,
      workflowStepId: step.id,
      userId: ctx.userId,
      action: 'approve',
      comment: comment || null,
    },
  });

  await prisma.workflowStep.update({
    where: { id: step.id },
    data: { status: 'completed', action: 'approve', comment, completedAt: new Date() },
  });

  if (comment?.trim()) {
    await prisma.comment.create({
      data: {
        memoId,
        authorId: ctx.userId,
        text: actingAsDelegate ? `[Delegated approval] ${comment}` : comment,
        type: 'approval',
      },
    });
  }

  const nextStep = await prisma.workflowStep.findFirst({
    where: { memoId, position: step.position + 1, status: 'pending' },
  });

  if (nextStep) {
    await prisma.memo.update({ where: { id: memoId }, data: { status: 'pending_review' } });
    await prisma.notification.create({
      data: {
        userId: nextStep.userId,
        type: 'memo_assigned',
        message: `Memo ${memo.memoNumber} requires your review`,
        memoNumber: memo.memoNumber,
        memoId,
      },
    });
  } else {
    await prisma.memo.update({
      where: { id: memoId },
      data: { status: 'approved', completedAt: new Date() },
    });
    await prisma.notification.create({
      data: {
        userId: memo.authorId,
        type: 'memo_approved',
        message: `Memo ${memo.memoNumber} has been approved`,
        memoNumber: memo.memoNumber,
        memoId,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      event: 'memo_approved',
      entityType: 'memo',
      entityId: memoId,
      description: actingAsDelegate
        ? `Memo ${memo.memoNumber} approved on behalf of ${step.userId} (delegation)`
        : `Memo ${memo.memoNumber} approved at step ${step.position}`,
    },
  });

  return res.json({ message: 'Memo approved' });
});
