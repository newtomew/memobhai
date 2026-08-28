import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { apiHandler } from '../../_lib/handler';

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
    where: { id, organizationId: ctx.organizationId },
  });

  if (!memo) return res.status(404).json({ error: 'Memo not found' });
  if (memo.status !== 'draft') return res.status(400).json({ error: 'Only draft memos can be submitted' });
  if (memo.authorId !== ctx.userId) return res.status(403).json({ error: 'Only the author can submit' });

  // Validate all workflow users belong to the same organization
  const validUsers = await prisma.user.findMany({
    where: { id: { in: workflowUserIds }, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (validUsers.length !== workflowUserIds.length) {
    return res.status(400).json({ error: 'One or more workflow users do not belong to this organization' });
  }

  // Create workflow steps
  await prisma.workflowStep.createMany({
    data: workflowUserIds.map((userId: string, index: number) => ({
      memoId: id,
      position: index,
      userId,
      status: 'pending',
    })),
  });

  // Update memo status
  const updated = await prisma.memo.update({
    where: { id },
    data: {
      status: 'pending_review',
      submittedAt: new Date(),
    },
  });

  // Create notifications for first workflow user
  if (workflowUserIds[0]) {
    await prisma.notification.create({
      data: {
        userId: workflowUserIds[0],
        type: 'memo_assigned',
        message: `Memo ${memo.memoNumber} requires your review`,
        memoNumber: memo.memoNumber,
      },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      event: 'memo_submitted',
      entityType: 'memo',
      entityId: id,
      description: `Memo ${memo.memoNumber} submitted for approval`,
    },
  });

  return res.json({ memo: updated });
});
