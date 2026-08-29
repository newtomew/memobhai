import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { supabaseAdmin } from '../_lib/supabase';
import { apiHandler } from '../_lib/handler';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      include: {
        departments: true,
        _count: { select: { users: true, memos: true } },
      },
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    return res.json({ organization: org });
  }

  if (req.method === 'PUT') {
    if (ctx.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { name, contactEmail, logoData, logoMimeType } = req.body as {
      name?: string;
      contactEmail?: string;
      logoData?: string;
      logoMimeType?: string;
    };

    let logoUrl: string | undefined;
    if (logoData && logoMimeType?.startsWith('image/')) {
      const ext = logoMimeType.split('/')[1] || 'png';
      const path = `${ctx.organizationId}/logo.${ext}`;
      const buffer = Buffer.from(logoData, 'base64');
      const { error } = await supabaseAdmin.storage.from('avatars').upload(path, buffer, {
        upsert: true,
        contentType: logoMimeType,
      });
      if (error) return res.status(500).json({ error: error.message });
      const { data: urlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(path);
      logoUrl = urlData.publicUrl;
    }

    const org = await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: {
        ...(name !== undefined && { name }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(logoUrl !== undefined && { logo: logoUrl }),
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        event: 'org_updated',
        entityType: 'organization',
        entityId: org.id,
        description: 'Organization settings updated',
      },
    });

    return res.json({ organization: org });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
