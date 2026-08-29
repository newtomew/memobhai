import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { approveJoinRequest, rejectJoinRequest } from '../_lib/joinRequests';

export default apiHandler(
  withAuth(async (ctx, req, res) => {
    if (req.method === 'GET') {
      const where: Record<string, unknown> = { status: 'pending' };

      if (ctx.isPlatformAdmin) {
        // Platform admins see all pending manager + new org requests, plus all employee requests
      } else if (ctx.role === 'admin' && ctx.status === 'active') {
        where.organizationId = ctx.organizationId;
        where.requestedRole = 'user';
      } else {
        return res.status(403).json({ error: 'Not authorized to view join requests' });
      }

      const requests = await prisma.joinRequest.findMany({
        where: ctx.isPlatformAdmin
          ? {
              status: 'pending',
              OR: [{ requestType: 'new_org' }, { requestedRole: 'admin' }],
            }
          : { status: 'pending', organizationId: ctx.organizationId, requestedRole: 'user' },
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const filtered = ctx.isPlatformAdmin
        ? requests
        : requests.filter((r) => r.requestedRole === 'user');

      return res.json({ requests: filtered });
    }

    if (req.method === 'POST') {
      const { action, requestId, reason } = req.body as {
        action?: string;
        requestId?: string;
        reason?: string;
      };

      if (!requestId || !action) {
        return res.status(400).json({ error: 'requestId and action are required' });
      }

      if (action === 'approve') {
        await approveJoinRequest(requestId, ctx.userId, ctx.email, ctx.role);
        return res.json({ success: true, message: 'Join request approved' });
      }

      if (action === 'reject') {
        await rejectJoinRequest(requestId, ctx.userId, ctx.email, ctx.role, reason);
        return res.json({ success: true, message: 'Join request rejected' });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }),
);
