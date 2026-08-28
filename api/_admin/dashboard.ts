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

  const [totalUsers, totalMemos, pendingMemos, approvedMemos, rejectedMemos, departments] = await Promise.all([
    prisma.user.count({ where: { organizationId: orgId } }),
    prisma.memo.count({ where: { organizationId: orgId } }),
    prisma.memo.count({ where: { organizationId: orgId, status: { in: ['submitted', 'pending_review', 'pending_approval'] } } }),
    prisma.memo.count({ where: { organizationId: orgId, status: 'approved' } }),
    prisma.memo.count({ where: { organizationId: orgId, status: 'rejected' } }),
    prisma.department.count({ where: { organizationId: orgId } }),
  ]);

  return res.json({
    stats: {
      totalUsers,
      totalMemos,
      pendingMemos,
      approvedMemos,
      rejectedMemos,
      departments,
    },
  });
});
