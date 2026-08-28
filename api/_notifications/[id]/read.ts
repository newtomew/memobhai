import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { apiHandler } from '../../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query as { id: string };

  const notification = await prisma.notification.findFirst({
    where: { id, userId: ctx.userId },
  });

  if (!notification) return res.status(404).json({ error: 'Notification not found' });

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return res.json({ message: 'Notification marked as read' });
});
