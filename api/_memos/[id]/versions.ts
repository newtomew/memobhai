import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { apiHandler } from '../../_lib/handler';
import { memoWhereById } from '../../_lib/memoAccess';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query as { id: string };

  const memo = await prisma.memo.findFirst({
    where: memoWhereById(id, ctx),
    select: { id: true, authorId: true, organizationId: true },
  });

  if (!memo) return res.status(404).json({ error: 'Memo not found' });

  const canView =
    ctx.isPlatformAdmin ||
    (ctx.role === 'admin' && ctx.status === 'active' && memo.organizationId === ctx.organizationId) ||
    memo.authorId === ctx.userId;

  if (!canView) {
    return res.status(403).json({ error: 'Not authorized to view memo versions' });
  }

  const versions = await prisma.memoVersion.findMany({
    where: { memoId: id },
    orderBy: { versionNumber: 'desc' },
  });

  return res.json({ versions });
});
