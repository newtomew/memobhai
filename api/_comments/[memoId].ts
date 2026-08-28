import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { memoId } = req.query as { memoId: string };

  // Verify memo belongs to org
  const memo = await prisma.memo.findFirst({
    where: { id: memoId, organizationId: ctx.organizationId },
  });
  if (!memo) return res.status(404).json({ error: 'Memo not found' });

  const comments = await prisma.comment.findMany({
    where: { memoId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return res.json({ comments });
});
