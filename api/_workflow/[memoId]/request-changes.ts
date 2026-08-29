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

  if (!comment) return res.status(400).json({ error: 'Comment is required when requesting changes' });

  const found = await findPendingWorkflowStep(memoId, ctx.userId);
  if (!found) return res.status(404).json({ error: 'No pending workflow step found' });

  const { step, actingAsDelegate } = found;
  if (step.memo.organizationId !== ctx.organizationId) return res.status(403).json({ error: 'Forbidden' });

  const memo = step.memo;

  await prisma.approval.create({
    data: { memoId, workflowStepId: step.id, userId: ctx.userId, action: 'request_changes', comment },
  });

  await prisma.workflowStep.update({
    where: { id: step.id },
    data: { status: 'completed', action: 'request_changes', comment, completedAt: new Date() },
  });

  await prisma.memo.update({
    where: { id: memoId },
    data: { status: 'changes_requested' },
  });

  await prisma.comment.create({
    data: {
      memoId,
      authorId: ctx.userId,
      text: actingAsDelegate ? `[Delegated] Changes requested: ${comment}` : comment,
      type: 'changes_requested',
    },
  });

  await prisma.notification.create({
    data: {
      userId: memo.authorId,
      type: 'changes_requested',
      message: `Changes requested on memo ${memo.memoNumber}: ${comment}`,
      memoNumber: memo.memoNumber,
      memoId,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      event: 'changes_requested',
      entityType: 'memo',
      entityId: memoId,
      description: `Changes requested on memo ${memo.memoNumber}`,
    },
  });

  return res.json({ message: 'Changes requested' });
});
