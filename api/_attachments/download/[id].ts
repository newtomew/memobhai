import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { supabaseAdmin } from '../../_lib/supabase';
import { apiHandler } from '../../_lib/handler';

const BUCKET_NAME = 'memo-attachments';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query as { id: string };

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { memo: true },
  });

  if (!attachment) return res.status(404).json({ error: 'Attachment not found' });
  if (attachment.memo.organizationId !== ctx.organizationId) return res.status(403).json({ error: 'Forbidden' });

  // Generate a signed URL (valid for 1 hour)
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(attachment.path, 3600);

  if (error || !data?.signedUrl) return res.status(500).json({ error: 'Failed to generate download URL' });

  return res.json({ url: data.signedUrl, fileName: attachment.fileName });
});
