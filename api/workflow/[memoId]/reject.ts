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

  if (!comment) return res.status(400).json({ error: 'Comment is required for rejection' });

  const step = await prisma.workflowStep.findFirst({
    where: { memoId, userId: ctx.userId, status: 'pending' },
    include: { memo: true },
  });

  if (!step) return res.status(404).json({ error: 'No pending workflow step found' });
  if (step.memo.organizationId !== ctx.organizationId) return res.status(403).json({ error: 'Forbidden' });

  const memo = step.memo;

  await prisma.approval.create({
    data: { memoId, workflowStepId: step.id, userId: ctx.userId, action: 'reject', comment },
  });

  await prisma.workflowStep.update({
    where: { id: step.id },
    data: { status: 'completed', action: 'reject', comment, completedAt: new Date() },
  });

  await prisma.memo.update({
    where: { id: memoId },
    data: { status: 'rejected', completedAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: memo.authorId,
      type: 'memo_rejected',
      message: `Memo ${memo.memoNumber} was rejected: ${comment}`,
      memoNumber: memo.memoNumber,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      event: 'memo_rejected',
      entityType: 'memo',
      entityId: memoId,
      description: `Memo ${memo.memoNumber} rejected`,
    },
  });

  return res.json({ message: 'Memo rejected' });
});
