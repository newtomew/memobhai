import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { isPlatformAdminEmail } from '../_lib/platformAdmin';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ctx = await resolveAuth(req);
  if (!ctx) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { id: true, name: true, slug: true, status: true, logo: true },
  });

  res.json({
    user: {
      id: ctx.userId,
      name: ctx.name,
      email: ctx.email,
      role: ctx.role,
      status: ctx.status,
      avatarUrl: ctx.avatarUrl,
      isPlatformAdmin: ctx.isPlatformAdmin,
    },
    organization: org,
    pending: ctx.status === 'pending' || ctx.orgStatus === 'pending',
  });
});
