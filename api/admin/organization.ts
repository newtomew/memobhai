import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { apiHandler } from '../../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (ctx.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    include: {
      departments: true,
      _count: { select: { users: true, memos: true } },
    },
  });

  if (!org) return res.status(404).json({ error: 'Organization not found' });

  return res.json({ organization: org });
});
