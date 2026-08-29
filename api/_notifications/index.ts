import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { syncUserNotifications } from '../_lib/syncNotifications';
import { apiHandler } from '../_lib/handler';

function mapNotification(n: {
  id: string;
  type: string;
  message: string;
  memoNumber: string | null;
  memoId: string | null;
  isRead: boolean;
  createdAt: Date;
}) {
  const sinceLoginTypes = ['since_login_new_memo', 'since_login_approved', 'since_login_rejected'];
  const category = sinceLoginTypes.includes(n.type)
    ? 'since_login'
    : n.type === 'overdue_approval'
      ? 'overdue'
      : 'activity';

  return {
    id: n.id,
    type: n.type,
    message: n.message,
    memoNumber: n.memoNumber,
    memoId: n.memoId,
    isRead: n.isRead,
    read: n.isRead,
    category,
    createdAt: n.createdAt,
  };
}

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const shouldSync = req.query.sync === '1' || req.query.sync === 'true';

    if (shouldSync) {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { lastLoginAt: true, createdAt: true },
      });
      const since = user?.lastLoginAt ?? user?.createdAt ?? new Date(0);
      await syncUserNotifications(ctx.userId, ctx.role, ctx.organizationId, since);
    }

    const [notifications, user] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { lastLoginAt: true },
      }),
    ]);

    const mapped = notifications.map(mapNotification);
    const unread = mapped.filter((n) => !n.isRead).length;
    const sinceLogin = mapped.filter((n) => n.category === 'since_login' && !n.isRead);
    const overdue = mapped.filter((n) => n.category === 'overdue' && !n.isRead);

    return res.json({
      notifications: mapped,
      unread,
      lastLoginAt: user?.lastLoginAt,
      summary: {
        sinceLogin: sinceLogin.length,
        overdue: overdue.length,
        total: unread,
      },
    });
  }

  if (req.method === 'POST') {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId: ctx.userId, isRead: false },
      data: { isRead: true },
    });
    return res.json({ message: 'All notifications marked as read' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
