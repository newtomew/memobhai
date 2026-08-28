import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const notifications = await prisma.notification.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return res.json({ notifications });
});
