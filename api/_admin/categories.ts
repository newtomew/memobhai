import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    // Any authenticated org member can list categories (needed for memo creation)
    const categories = await prisma.memoCategory.findMany({
      where: { organizationId: ctx.organizationId },
    });
    return res.json({ categories });
  }

  // Write operations require admin
  if (ctx.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  if (req.method === 'POST') {
    const data = createCategorySchema.parse(req.body);

    const category = await prisma.memoCategory.create({
      data: {
        organizationId: ctx.organizationId,
        name: data.name,
        description: data.description || null,
        status: 'active',
      },
    });

    return res.json({ category });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
