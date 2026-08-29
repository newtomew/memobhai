import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { supabaseAdmin } from '../_lib/supabase';
import { apiHandler } from '../_lib/handler';
import { memoWhereById } from '../_lib/memoAccess';

const BUCKET_NAME = 'memo-attachments';
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { memoId } = req.query as { memoId: string };

  const memo = await prisma.memo.findFirst({
    where: memoWhereById(memoId, ctx),
  });
  if (!memo) return res.status(404).json({ error: 'Memo not found' });

  if (req.method === 'POST') {
    const { fileName, fileData, mimeType } = req.body;
    if (!fileName || !fileData) return res.status(400).json({ error: 'fileName and fileData are required' });

    const type = mimeType || 'application/octet-stream';
    if (!ALLOWED_MIME.has(type)) {
      return res.status(400).json({
        error: 'File type not allowed. Use PDF, images, Word, Excel, or plain text.',
      });
    }

    const buffer = Buffer.from(fileData, 'base64');
    if (buffer.length > MAX_FILE_BYTES) {
      return res.status(400).json({ error: 'File exceeds 10 MB limit' });
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${memoId}/${Date.now()}-${safeName}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, { contentType: type, upsert: false });

    if (error) return res.status(500).json({ error: error.message });

    const attachment = await prisma.attachment.create({
      data: {
        memoId,
        fileName: safeName,
        fileSize: buffer.length,
        mimeType: type,
        path: filePath,
        uploadedBy: ctx.userId,
      },
    });

    return res.json({ attachment });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
