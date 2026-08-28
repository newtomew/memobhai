import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { supabaseAdmin } from '../_lib/supabase';
import { apiHandler } from '../_lib/handler';
import { z } from 'zod';

const schema = z.object({
  newPassword: z.string().min(8),
});

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { newPassword } = schema.parse(req.body);

  const { error } = await supabaseAdmin.auth.admin.updateUserById(ctx.authId, {
    password: newPassword,
  });

  if (error) return res.status(400).json({ error: error.message });

  return res.json({ message: 'Password updated successfully' });
});
