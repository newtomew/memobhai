import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withPlatformAdmin } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';

export default apiHandler(
  withPlatformAdmin(async (ctx, req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { targetType, targetId, action } = req.body as {
      targetType?: string;
      targetId?: string;
      action?: string;
    };

    if (!targetType || !targetId || action !== 'ban' && action !== 'unban') {
      return res.status(400).json({ error: 'targetType, targetId, and action (ban/unban) required' });
    }

    const status = action === 'ban' ? 'banned' : 'active';

    if (targetType === 'organization') {
      await prisma.organization.update({ where: { id: targetId }, data: { status } });
      await prisma.auditLog.create({
        data: {
          organizationId: targetId,
          userId: ctx.userId,
          event: action === 'ban' ? 'org_banned' : 'org_unbanned',
          entityType: 'organization',
          entityId: targetId,
          description: `Platform admin ${action}ned organization`,
        },
      });
      return res.json({ success: true });
    }

    if (targetType === 'user') {
      const user = await prisma.user.findUnique({ where: { id: targetId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      await prisma.user.update({ where: { id: targetId }, data: { status } });
      await prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: ctx.userId,
          event: action === 'ban' ? 'user_banned' : 'user_unbanned',
          entityType: 'user',
          entityId: targetId,
          description: `Platform admin ${action}ned user ${user.email}`,
        },
      });
      return res.json({ success: true });
    }

    if (targetType === 'memo') {
      const memo = await prisma.memo.findUnique({ where: { id: targetId } });
      if (!memo) return res.status(404).json({ error: 'Memo not found' });

      await prisma.memo.update({
        where: { id: targetId },
        data: { isBlocked: action === 'ban' },
      });
      await prisma.auditLog.create({
        data: {
          organizationId: memo.organizationId,
          userId: ctx.userId,
          event: action === 'ban' ? 'memo_blocked' : 'memo_unblocked',
          entityType: 'memo',
          entityId: targetId,
          description: `Platform admin ${action === 'ban' ? 'blocked' : 'unblocked'} memo ${memo.memoNumber}`,
        },
      });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid targetType' });
  }),
);
