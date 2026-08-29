import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { apiHandler } from '../../_lib/handler';
import { memoWhereById } from '../../_lib/memoAccess';
import { snapshotMemoVersion } from '../../_lib/memoVersions';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query as { id: string };
  const { workflowUserIds } = req.body;

  if (!workflowUserIds || !Array.isArray(workflowUserIds) || workflowUserIds.length === 0) {
    return res.status(400).json({ error: 'At least one workflow user is required' });
  }

  const memo = await prisma.memo.findFirst({
    where: memoWhereById(id, ctx),
    select: { id: true, memoNumber: true, status: true, authorId: true, subject: true, body: true, organizationId: true },
  });

  if (!memo) return res.status(404).json({ error: 'Memo not found' });

  const isResubmit = memo.status === 'changes_requested';
  if (memo.status !== 'draft' && !isResubmit) {
    return res.status(400).json({ error: 'Only draft or changes-requested memos can be submitted' });
  }
  if (memo.authorId !== ctx.userId) {
    return res.status(403).json({ error: 'Only the author can submit' });
  }

  const orgId = memo.organizationId;
  const validUsers = await prisma.user.findMany({
    where: { id: { in: workflowUserIds }, organizationId: orgId },
    select: { id: true },
  });
  if (validUsers.length !== workflowUserIds.length) {
    return res.status(400).json({ error: 'One or more workflow users do not belong to this organization' });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (isResubmit) {
      await snapshotMemoVersion(memo.id, memo.subject, memo.body);
      await tx.workflowStep.deleteMany({ where: { memoId: id } });
    }

    await tx.workflowStep.createMany({
      data: workflowUserIds.map((userId: string, index: number) => ({
        memoId: id,
        position: index,
        userId,
        status: 'pending',
      })),
    });

    const result = await tx.memo.update({
      where: { id },
      data: {
        status: 'pending_review',
        submittedAt: new Date(),
        completedAt: null,
      },
    });

    if (workflowUserIds[0]) {
      await tx.notification.create({
        data: {
          userId: workflowUserIds[0],
          type: isResubmit ? 'memo_resubmitted' : 'memo_assigned',
          message: isResubmit
            ? `Memo ${memo.memoNumber} was resubmitted and requires your review`
            : `Memo ${memo.memoNumber} requires your review`,
          memoNumber: memo.memoNumber,
          memoId: id,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: orgId,
        userId: ctx.userId,
        event: isResubmit ? 'memo_resubmitted' : 'memo_submitted',
        entityType: 'memo',
        entityId: id,
        description: isResubmit
          ? `Memo ${memo.memoNumber} resubmitted after changes`
          : `Memo ${memo.memoNumber} submitted for approval`,
      },
    });

    return result;
  });

  return res.json({ memo: updated });
});
