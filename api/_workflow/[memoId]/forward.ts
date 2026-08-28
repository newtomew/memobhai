import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { apiHandler } from '../../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { memoId } = req.query as { memoId: string };

  const step = await prisma.workflowStep.findFirst({
    where: { memoId, userId: ctx.userId, status: 'pending' },
    include: { memo: true },
  });

  if (!step) return res.status(404).json({ error: 'No pending workflow step found' });
  if (step.memo.organizationId !== ctx.organizationId) return res.status(403).json({ error: 'Forbidden' });

  const memo = step.memo;

  await prisma.approval.create({
    data: { memoId, workflowStepId: step.id, userId: ctx.userId, action: 'forward' },
  });

  await prisma.workflowStep.update({
    where: { id: step.id },
    data: { status: 'completed', action: 'forward', completedAt: new Date() },
  });

  const nextStep = await prisma.workflowStep.findFirst({
    where: { memoId, position: step.position + 1, status: 'pending' },
  });

  if (nextStep) {
    await prisma.memo.update({ where: { id: memoId }, data: { status: 'pending_review' } });
    await prisma.notification.create({
      data: {
        userId: nextStep.userId,
        type: 'memo_assigned',
        message: `Memo ${memo.memoNumber} forwarded to you`,
        memoNumber: memo.memoNumber,
      },
    });
  } else {
    await prisma.memo.update({ where: { id: memoId }, data: { status: 'approved', completedAt: new Date() } });
  }

  return res.json({ message: 'Memo forwarded' });
});
