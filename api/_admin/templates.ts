import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdmin } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  positions: z.array(z.string().min(1)).min(1),
});

export default apiHandler(
  withAdmin(async (ctx, req, res) => {
    if (req.method === 'GET') {
      const templates = await prisma.workflowTemplate.findMany({
        where: { organizationId: ctx.organizationId },
        orderBy: { name: 'asc' },
      });
      return res.json({ templates });
    }

    if (req.method === 'POST') {
      const data = templateSchema.parse(req.body);
      const template = await prisma.workflowTemplate.create({
        data: { organizationId: ctx.organizationId, ...data },
      });
      await prisma.auditLog.create({
        data: {
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          event: 'template_created',
          entityType: 'workflow_template',
          entityId: template.id,
          description: `Created workflow template ${data.name}`,
        },
      });
      return res.json({ template });
    }

    if (req.method === 'PUT') {
      const { id } = req.query as { id: string };
      const data = templateSchema.partial().parse(req.body);
      const existing = await prisma.workflowTemplate.findFirst({
        where: { id, organizationId: ctx.organizationId },
      });
      if (!existing) return res.status(404).json({ error: 'Template not found' });

      const template = await prisma.workflowTemplate.update({ where: { id }, data });
      return res.json({ template });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query as { id: string };
      const existing = await prisma.workflowTemplate.findFirst({
        where: { id, organizationId: ctx.organizationId },
      });
      if (!existing) return res.status(404).json({ error: 'Template not found' });

      await prisma.workflowTemplate.delete({ where: { id } });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }),
);
