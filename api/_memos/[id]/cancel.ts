import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { apiHandler } from '../../_lib/handler';
import { memoWhereById } from '../../_lib/memoAccess';

const CANCELLABLE = ['draft', 'submitted', 'pending_review', 'pending_approval', 'changes_requested'];

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query as { id: string };

  const memo = await prisma.memo.findFirst({
    where: memoWhereById(id, ctx),
  });

  if (!memo) return res.status(404).json({ error: 'Memo not found' });
  if (!CANCELLABLE.includes(memo.status)) {
    return res.status(400).json({ error: 'This memo cannot be cancelled' });
  }
  if (memo.authorId !== ctx.userId && ctx.role !== 'admin' && !ctx.isPlatformAdmin) {
    return res.status(403).json({ error: 'Not authorized to cancel this memo' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.workflowStep.updateMany({
      where: { memoId: id, status: 'pending' },
      data: { status: 'cancelled', completedAt: new Date() },
    });
    await tx.memo.update({
      where: { id },
      data: { status: 'cancelled', completedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        organizationId: memo.organizationId,
        userId: ctx.userId,
        event: 'memo_cancelled',
        entityType: 'memo',
        entityId: id,
        description: `Memo ${memo.memoNumber} cancelled`,
      },
    });
  });

  return res.json({ message: 'Memo cancelled' });
});
