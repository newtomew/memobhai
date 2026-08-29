import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { assertCanCreateMemo, incrementMemoCount } from '../_lib/plans';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { type = 'inbox', priority, status, sort = 'newest' } = req.query as {
      type?: string;
      priority?: string;
      status?: string;
      sort?: string;
    };
    const orgId = ctx.organizationId;
    const userId = ctx.userId;

    let memos;

    if (type === 'sent') {
      memos = await prisma.memo.findMany({
        where: {
          organizationId: orgId,
          authorId: userId,
          ...(priority && { priority }),
          ...(status && { status }),
        },
        include: {
          department: { select: { name: true } },
          workflowSteps: { select: { id: true, status: true, userId: true, user: { select: { name: true } } } },
        },
        orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      });
    } else {
      memos = await prisma.memo.findMany({
        where: {
          organizationId: orgId,
          workflowSteps: { some: { userId, status: 'pending' } },
          status: status ? status : { in: ['submitted', 'pending_review', 'pending_approval'] },
          ...(priority && { priority }),
        },
        include: {
          author: { select: { name: true, email: true } },
          department: { select: { name: true } },
        },
        orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      });
    }

    return res.json({ memos });
  }

  if (req.method === 'POST') {
    const { subject, body, categoryId, priority, departmentId } = req.body;

    if (!subject || !body || !departmentId) {
      return res.status(400).json({ error: 'Subject, body, and departmentId are required' });
    }

    const limitCheck = await assertCanCreateMemo(ctx.organizationId);
    if (!limitCheck.ok) return res.status(403).json({ error: limitCheck.error, code: 'PLAN_LIMIT' });

    // Generate memo number: ORG-YYYY-NNN
    const year = new Date().getFullYear();
    const count = await prisma.memo.count({
      where: { organizationId: ctx.organizationId },
    });
    const memoNumber = `${ctx.organizationId.slice(0, 3).toUpperCase()}-${year}-${String(count + 1).padStart(3, '0')}`;

    const memo = await prisma.memo.create({
      data: {
        organizationId: ctx.organizationId,
        departmentId,
        authorId: ctx.userId,
        categoryId: categoryId || null,
        memoNumber,
        subject,
        body,
        priority: priority || 'normal',
        status: 'draft',
      },
    });

    await incrementMemoCount(ctx.organizationId);

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        event: 'memo_created',
        entityType: 'memo',
        entityId: memo.id,
        description: `Memo ${memoNumber} created`,
      },
    });

    return res.json({ memo });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
