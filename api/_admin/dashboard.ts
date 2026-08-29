import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const orgId = ctx.organizationId;

  const [
    totalUsers, totalMemos, pendingMemos, approvedMemos, rejectedMemos, departments,
    urgentMemos, byDepartment, byCategory, completedMemos, byStatus,
  ] = await Promise.all([
    prisma.user.count({ where: { organizationId: orgId } }),
    prisma.memo.count({ where: { organizationId: orgId } }),
    prisma.memo.count({ where: { organizationId: orgId, status: { in: ['submitted', 'pending_review', 'pending_approval'] } } }),
    prisma.memo.count({ where: { organizationId: orgId, status: 'approved' } }),
    prisma.memo.count({ where: { organizationId: orgId, status: 'rejected' } }),
    prisma.department.count({ where: { organizationId: orgId } }),
    prisma.memo.count({ where: { organizationId: orgId, priority: 'urgent', status: { notIn: ['approved', 'rejected', 'cancelled'] } } }),
    prisma.memo.groupBy({ by: ['departmentId'], where: { organizationId: orgId }, _count: { id: true } }),
    prisma.memo.groupBy({ by: ['categoryId'], where: { organizationId: orgId }, _count: { id: true } }),
    prisma.memo.findMany({
      where: { organizationId: orgId, status: 'approved', completedAt: { not: null }, submittedAt: { not: null } },
      select: { submittedAt: true, completedAt: true },
      take: 200,
    }),
    prisma.memo.groupBy({ by: ['status'], where: { organizationId: orgId }, _count: { id: true } }),
  ]);

  const deptIds = byDepartment.map((d) => d.departmentId).filter(Boolean) as string[];
  const catIds = byCategory.map((c) => c.categoryId).filter(Boolean) as string[];
  const deptNames = await prisma.department.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true } });
  const catNames = await prisma.memoCategory.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true } });

  const memosByDepartment = byDepartment.map((d) => ({
    department: deptNames.find((x) => x.id === d.departmentId)?.name || 'Unknown',
    count: d._count.id,
  }));

  const memosByCategory = byCategory.map((c) => ({
    category: catNames.find((x) => x.id === c.categoryId)?.name || 'Uncategorized',
    count: c._count.id,
  }));

  const statusBreakdown = byStatus
    .map((s) => ({ status: s.status, count: s._count.id }))
    .sort((a, b) => b.count - a.count);

  let avgCompletionHours: number | null = null;
  if (completedMemos.length > 0) {
    const totalHours = completedMemos.reduce((sum, m) => {
      const ms = new Date(m.completedAt!).getTime() - new Date(m.submittedAt!).getTime();
      return sum + ms / 3600000;
    }, 0);
    avgCompletionHours = Math.round((totalHours / completedMemos.length) * 10) / 10;
  }

  return res.json({
    stats: {
      totalUsers,
      totalMemos,
      pendingMemos,
      approvedMemos,
      rejectedMemos,
      departments,
      urgentMemos,
      avgCompletionHours,
      memosByDepartment,
      memosByCategory,
      statusBreakdown,
      rejectionRate: totalMemos > 0 ? Math.round((rejectedMemos / totalMemos) * 100) : 0,
    },
  });
});
