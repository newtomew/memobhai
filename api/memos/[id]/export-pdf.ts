import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { apiHandler } from '../../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query as { id: string };

  const memo = await prisma.memo.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      author: { select: { name: true, email: true } },
      department: { select: { name: true } },
      approvals: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!memo) return res.status(404).json({ error: 'Memo not found' });

  // Return JSON representation (client can generate PDF or display)
  res.setHeader('Content-Type', 'application/json');
  return res.json({
    memoNumber: memo.memoNumber,
    subject: memo.subject,
    body: memo.body,
    status: memo.status,
    priority: memo.priority,
    author: memo.author,
    department: memo.department,
    createdAt: memo.createdAt,
    submittedAt: memo.submittedAt,
    completedAt: memo.completedAt,
    approvals: memo.approvals,
    comments: memo.comments,
  });
});
