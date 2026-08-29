import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';

const memoSelect = {
  id: true,
  memoNumber: true,
  subject: true,
  status: true,
  priority: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
  department: { select: { name: true } },
} as const;

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const orgId = ctx.organizationId;
  const userId = ctx.userId;
  const isAdmin = ctx.role === 'admin';

  const [inboxMemos, sentMemos] = await Promise.all([
    prisma.memo.findMany({
      where: {
        organizationId: orgId,
        workflowSteps: { some: { userId, status: 'pending' } },
        status: { in: ['submitted', 'pending_review', 'pending_approval'] },
      },
      select: memoSelect,
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.memo.findMany({
      where: { organizationId: orgId, authorId: userId },
      select: memoSelect,
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const personalStats = {
    pending: inboxMemos.length,
    inProgress: sentMemos.filter((m) =>
      ['submitted', 'pending_review', 'pending_approval'].includes(m.status),
    ).length,
    completed: sentMemos.filter((m) => m.status === 'approved').length,
    rejected: sentMemos.filter((m) => m.status === 'rejected').length,
  };

  if (!isAdmin) {
    const recent = [...inboxMemos, ...sentMemos]
      .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return res.json({
      role: 'user',
      stats: personalStats,
      recentMemos: recent,
    });
  }

  const [orgStats, orgRecent] = await Promise.all([
    Promise.all([
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.memo.count({ where: { organizationId: orgId } }),
      prisma.memo.count({
        where: {
          organizationId: orgId,
          status: { in: ['submitted', 'pending_review', 'pending_approval'] },
        },
      }),
      prisma.memo.count({ where: { organizationId: orgId, status: 'approved' } }),
      prisma.memo.count({ where: { organizationId: orgId, status: 'rejected' } }),
      prisma.department.count({ where: { organizationId: orgId } }),
    ]),
    prisma.memo.findMany({
      where: { organizationId: orgId },
      select: memoSelect,
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const [totalUsers, totalMemos, pendingMemos, approvedMemos, rejectedMemos, departments] = orgStats;

  return res.json({
    role: 'admin',
    stats: {
      ...personalStats,
      totalUsers,
      totalMemos,
      pendingMemos,
      approvedMemos,
      rejectedMemos,
      departments,
    },
    recentMemos: orgRecent,
    myPending: inboxMemos.length,
  });
});
