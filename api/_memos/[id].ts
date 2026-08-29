import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { snapshotMemoVersion } from '../_lib/memoVersions';
import { canUserActOnMemo } from '../_lib/delegations';
import { memoWhereById } from '../_lib/memoAccess';

const EDITABLE_STATUSES = ['draft', 'changes_requested'];

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const memo = await prisma.memo.findFirst({
      where: memoWhereById(id, ctx),
      include: {
        author: { select: { id: true, name: true, email: true, designation: true } },
        department: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true, slug: true, contactEmail: true, logo: true } },
        attachments: { select: { id: true, fileName: true, fileSize: true, mimeType: true } },
        workflowSteps: {
          include: { user: { select: { id: true, name: true, email: true, designation: true } } },
          orderBy: { position: 'asc' },
        },
        approvals: {
          include: { user: { select: { id: true, name: true, designation: true } } },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!memo) return res.status(404).json({ error: 'Memo not found' });
    if (memo.isBlocked && ctx.role !== 'admin' && !ctx.isPlatformAdmin) {
      return res.status(403).json({ error: 'This memo has been blocked' });
    }

    const canActOnWorkflow = await canUserActOnMemo(id, ctx.userId);
    return res.json({ memo: { ...memo, canActOnWorkflow } });
  }

  if (req.method === 'PUT') {
    const { subject, body, priority } = req.body;

    const memo = await prisma.memo.findFirst({
      where: memoWhereById(id, ctx),
    });

    if (!memo) return res.status(404).json({ error: 'Memo not found' });
    if (!EDITABLE_STATUSES.includes(memo.status)) {
      return res.status(400).json({ error: 'Only draft or changes-requested memos can be edited' });
    }
    if (memo.authorId !== ctx.userId) return res.status(403).json({ error: 'Only the author can edit' });
    if (memo.isBlocked) return res.status(403).json({ error: 'This memo has been blocked' });

    if (subject !== undefined || body !== undefined) {
      await snapshotMemoVersion(memo.id, memo.subject, memo.body);
    }

    const updated = await prisma.memo.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(body !== undefined && { body }),
        ...(priority !== undefined && { priority }),
      },
    });

    return res.json({ memo: updated });
  }

  if (req.method === 'DELETE') {
    const memo = await prisma.memo.findFirst({
      where: memoWhereById(id, ctx),
    });
    if (!memo) return res.status(404).json({ error: 'Memo not found' });
    if (memo.status !== 'draft') return res.status(400).json({ error: 'Only draft memos can be deleted' });
    if (memo.authorId !== ctx.userId && ctx.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this memo' });
    }

    await prisma.memo.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        event: 'memo_deleted',
        entityType: 'memo',
        entityId: id,
        description: `Deleted draft memo ${memo.memoNumber}`,
      },
    });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
