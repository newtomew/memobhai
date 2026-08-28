import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { Prisma } from '@prisma/client';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { q, status, priority, category, department, startDate, endDate } = req.query as Record<string, string | undefined>;

  const where: Prisma.MemoWhereInput = {
    organizationId: ctx.organizationId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(category && { categoryId: category }),
    ...(department && { departmentId: department }),
    ...(startDate && endDate && {
      createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
    }),
    ...(q && {
      OR: [
        { subject: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
        { memoNumber: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const results = await prisma.memo.findMany({
    where,
    include: {
      author: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return res.json({ results });
});
