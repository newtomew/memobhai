import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withPlatformAdmin } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';

export default apiHandler(
  withPlatformAdmin(async (ctx, req, res) => {
    const orgId = req.query.orgId as string | undefined;

    if (req.method === 'GET' && !orgId) {
      const organizations = await prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, memos: true } },
        },
      });

      const enriched = await Promise.all(
        organizations.map(async (org) => {
          const managers = await prisma.user.count({
            where: { organizationId: org.id, role: 'admin', status: 'active' },
          });
          const employees = await prisma.user.count({
            where: { organizationId: org.id, role: 'user', status: 'active' },
          });
          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            status: org.status,
            contactEmail: org.contactEmail,
            createdAt: org.createdAt,
            userCount: org._count.users,
            memoCount: org._count.memos,
            managers,
            employees,
          };
        }),
      );

      return res.json({ organizations: enriched });
    }

    if (req.method === 'GET' && orgId) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              avatarUrl: true,
              createdAt: true,
              designation: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          memos: {
            select: {
              id: true,
              memoNumber: true,
              subject: true,
              status: true,
              isBlocked: true,
              createdAt: true,
              author: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      });

      if (!org) return res.status(404).json({ error: 'Organization not found' });

      const managers = org.users.filter((u) => u.role === 'admin');
      const employees = org.users.filter((u) => u.role === 'user');

      return res.json({
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          status: org.status,
          contactEmail: org.contactEmail,
          createdAt: org.createdAt,
        },
        managers,
        employees,
        memos: org.memos,
        activityLogs: org.auditLogs,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }),
);
