import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = loginSchema.parse(req.body);

  // Sign in with Supabase Auth
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Fetch user profile from Prisma
  const user = await prisma.user.findUnique({
    where: { authId: data.user.id },
    include: { organization: true },
  });

  if (!user || user.status !== 'active') {
    return res.status(403).json({ error: 'User profile not found or inactive' });
  }

  res.json({
    token: data.session?.access_token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
    },
  });
});
