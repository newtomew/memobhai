import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { apiHandler } from '../../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { memoId } = req.query as { memoId: string };
  const { comment } = req.body;

  // Find the current pending step for this user
  const step = await prisma.workflowStep.findFirst({
    where: { memoId, userId: ctx.userId, status: 'pending' },
    include: { memo: true },
  });

  if (!step) return res.status(404).json({ error: 'No pending workflow step found for you on this memo' });

  const memo = step.memo;
  if (memo.organizationId !== ctx.organizationId) return res.status(403).json({ error: 'Forbidden' });

  // Create approval record
  await prisma.approval.create({
    data: {
      memoId,
      workflowStepId: step.id,
      userId: ctx.userId,
      action: 'approve',
      comment: comment || null,
    },
  });

  // Mark current step as completed
  await prisma.workflowStep.update({
    where: { id: step.id },
    data: { status: 'completed', action: 'approve', comment, completedAt: new Date() },
  });

  // Find next step
  const nextStep = await prisma.workflowStep.findFirst({
    where: { memoId, position: step.position + 1, status: 'pending' },
  });

  if (nextStep) {
    // Move to next reviewer
    await prisma.memo.update({
      where: { id: memoId },
      data: { status: 'pending_review' },
    });
    await prisma.notification.create({
      data: {
        userId: nextStep.userId,
        type: 'memo_assigned',
        message: `Memo ${memo.memoNumber} requires your review`,
        memoNumber: memo.memoNumber,
      },
    });
  } else {
    // No more steps — mark as approved
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
      description: `Memo ${memo.memoNumber} approved at step ${step.position}`,
    },
  });

  return res.json({ message: 'Memo approved' });
});
