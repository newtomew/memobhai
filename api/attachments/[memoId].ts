import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { supabaseAdmin } from '../_lib/supabase';
import { apiHandler } from '../_lib/handler';

const BUCKET_NAME = 'memo-attachments';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { memoId } = req.query as { memoId: string };

  // Verify memo belongs to org
  const memo = await prisma.memo.findFirst({
    where: { id: memoId, organizationId: ctx.organizationId },
  });
  if (!memo) return res.status(404).json({ error: 'Memo not found' });

  if (req.method === 'POST') {
    // For serverless, we expect base64-encoded file data
    const { fileName, fileData, mimeType } = req.body;
    if (!fileName || !fileData) return res.status(400).json({ error: 'fileName and fileData are required' });

    const filePath = `${memoId}/${fileName}`;
    const buffer = Buffer.from(fileData, 'base64');

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, { contentType: mimeType || 'application/octet-stream', upsert: true });

    if (error) return res.status(500).json({ error: error.message });

    // Save attachment record
    const attachment = await prisma.attachment.create({
      data: {
        memoId,
        fileName,
        fileSize: buffer.length,
        mimeType: mimeType || 'application/octet-stream',
        path: filePath,
        uploadedBy: ctx.userId,
      },
    });

    return res.json({ attachment });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
