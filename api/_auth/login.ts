import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { isPlatformAdminEmail } from '../_lib/platformAdmin';
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

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = await prisma.user.findUnique({
    where: { authId: data.user.id },
    include: { organization: true },
  });

  if (!user) {
    return res.status(403).json({ error: 'User profile not found' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ error: 'Your account has been suspended' });
  }

  if (user.organization.status === 'banned') {
    return res.status(403).json({ error: 'Your organization has been suspended' });
  }

  let previousLoginAt: Date | null = null;
  if (user.status === 'active') {
    previousLoginAt = user.lastLoginAt ?? user.createdAt;
    // Return token immediately — update last login in background (non-blocking)
    void prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});
  }

  res.json({
    token: data.session?.access_token,
    refreshToken: data.session?.refresh_token ?? null,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      designation: user.designation,
      isPlatformAdmin: isPlatformAdminEmail(user.email),
    },
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
      status: user.organization.status,
      logo: user.organization.logo,
    },
    pending: user.status === 'pending' || user.organization.status === 'pending',
    previousLoginAt,
    notificationsSynced: 0,
  });
});
