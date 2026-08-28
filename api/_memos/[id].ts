import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const memo = await prisma.memo.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        attachments: true,
        workflowSteps: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { position: 'asc' },
        },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!memo) return res.status(404).json({ error: 'Memo not found' });

    return res.json({ memo });
  }

  if (req.method === 'PUT') {
    const { subject, body, priority } = req.body;

    const memo = await prisma.memo.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });

    if (!memo) return res.status(404).json({ error: 'Memo not found' });
    if (memo.status !== 'draft') return res.status(400).json({ error: 'Only draft memos can be edited' });
    if (memo.authorId !== ctx.userId) return res.status(403).json({ error: 'Only the author can edit' });

    const updated = await prisma.memo.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(body !== undefined && { body }),
        ...(priority !== undefined && { priority }),
      },
    });

    return res.json({ memo: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
