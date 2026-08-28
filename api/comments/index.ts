import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { z } from 'zod';

const createCommentSchema = z.object({
  memoId: z.string(),
  text: z.string().min(1),
  type: z.string().default('general'),
});

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'POST') {
    const data = createCommentSchema.parse(req.body);

    // Verify memo belongs to org
    const memo = await prisma.memo.findFirst({
      where: { id: data.memoId, organizationId: ctx.organizationId },
    });
    if (!memo) return res.status(404).json({ error: 'Memo not found' });

    const comment = await prisma.comment.create({
      data: {
        memoId: data.memoId,
        authorId: ctx.userId,
        text: data.text,
        type: data.type,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    return res.json({ comment });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
