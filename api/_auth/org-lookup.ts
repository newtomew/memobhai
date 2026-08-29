import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slug = (req.query.slug as string)?.trim().toLowerCase();
  if (!slug) return res.status(400).json({ error: 'slug is required' });

  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, status: true },
  });

  if (!org || org.status === 'banned') {
    return res.status(404).json({ error: 'Organization not found' });
  }

  if (org.status !== 'active') {
    return res.status(400).json({ error: 'Organization is not accepting new members yet' });
  }

  return res.json({ organization: { name: org.name, slug: org.slug } });
});
