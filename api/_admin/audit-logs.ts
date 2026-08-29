import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdmin } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';

export default apiHandler(
  withAdmin(async (ctx, req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.json({ logs });
  }),
);
