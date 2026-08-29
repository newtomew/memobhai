import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { z } from 'zod';

const delegationSchema = z.object({
  delegateId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
});

export default apiHandler(
  withAuth(async (ctx, req, res) => {
    if (req.method === 'GET') {
      const delegations = await prisma.delegation.findMany({
        where: {
          OR: [{ delegatingUserId: ctx.userId }, { delegateId: ctx.userId }],
          status: 'active',
        },
        include: {
          delegatingUser: { select: { id: true, name: true, email: true } },
          delegate: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ delegations });
    }

    if (req.method === 'POST') {
      const data = delegationSchema.parse(req.body);
      const delegate = await prisma.user.findFirst({
        where: { id: data.delegateId, organizationId: ctx.organizationId, status: 'active' },
      });
      if (!delegate) return res.status(404).json({ error: 'Delegate not found in your organization' });
      if (data.delegateId === ctx.userId) return res.status(400).json({ error: 'Cannot delegate to yourself' });

      const delegation = await prisma.delegation.create({
        data: {
          delegatingUserId: ctx.userId,
          delegateId: data.delegateId,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          reason: data.reason || null,
          status: 'active',
        },
        include: {
          delegatingUser: { select: { id: true, name: true } },
          delegate: { select: { id: true, name: true } },
        },
      });

      await prisma.auditLog.create({
        data: {
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          event: 'delegation_created',
          entityType: 'delegation',
          entityId: delegation.id,
          description: `Delegated approval authority to ${delegate.name}`,
        },
      });

      return res.json({ delegation });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query as { id: string };
      const delegation = await prisma.delegation.findFirst({
        where: { id, delegatingUserId: ctx.userId },
      });
      if (!delegation) return res.status(404).json({ error: 'Delegation not found' });

      await prisma.delegation.update({ where: { id }, data: { status: 'cancelled' } });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }),
);
