import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase';
import { prisma } from './prisma';
import { isPlatformAdminEmail } from './platformAdmin';

export interface AuthContext {
  userId: string;
  authId: string;
  organizationId: string;
  email: string;
  role: string;
  name: string;
  status: string;
  avatarUrl: string | null;
  orgStatus: string;
  isPlatformAdmin: boolean;
}

const AUTH_CACHE_TTL_MS = 300_000;
const authCache = new Map<string, { ctx: AuthContext; expires: number }>();

function getCachedAuth(token: string): AuthContext | null {
  const entry = authCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    authCache.delete(token);
    return null;
  }
  return entry.ctx;
}

function setCachedAuth(token: string, ctx: AuthContext) {
  authCache.set(token, { ctx, expires: Date.now() + AUTH_CACHE_TTL_MS });
  if (authCache.size > 500) {
    const oldest = authCache.keys().next().value;
    if (oldest) authCache.delete(oldest);
  }
}

export async function resolveAuth(req: VercelRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const accessToken = authHeader.replace('Bearer ', '');

  const cached = getCachedAuth(accessToken);
  if (cached) return cached;

  const { data: authData, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !authData.user) return null;

  const authId = authData.user.id;

  const user = await prisma.user.findUnique({
    where: { authId },
    select: {
      id: true,
      authId: true,
      organizationId: true,
      email: true,
      role: true,
      name: true,
      status: true,
      avatarUrl: true,
      organization: { select: { status: true } },
    },
  });

  if (!user) return null;
  if (user.status === 'banned') return null;
  if (user.organization.status === 'banned') return null;

  const ctx: AuthContext = {
    userId: user.id,
    authId,
    organizationId: user.organizationId,
    email: user.email,
    role: user.role,
    name: user.name,
    status: user.status,
    avatarUrl: user.avatarUrl,
    orgStatus: user.organization.status,
    isPlatformAdmin: isPlatformAdminEmail(user.email),
  };

  setCachedAuth(accessToken, ctx);
  return ctx;
}

export function withAuth(
  handler: (ctx: AuthContext, req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>,
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const ctx = await resolveAuth(req);
    if (!ctx) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(ctx, req, res);
  };
}

export function withAdmin(
  handler: (ctx: AuthContext, req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>,
) {
  return withAuth(async (ctx, req, res) => {
    if (ctx.role !== 'admin' || ctx.status !== 'active') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (ctx.orgStatus !== 'active') {
      return res.status(403).json({ error: 'Organization is not active' });
    }
    return handler(ctx, req, res);
  });
}

export function withActiveUser(
  handler: (ctx: AuthContext, req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>,
) {
  return withAuth(async (ctx, req, res) => {
    if (ctx.status !== 'active') {
      return res.status(403).json({ error: 'Account pending approval', code: 'PENDING_APPROVAL' });
    }
    if (ctx.orgStatus !== 'active') {
      return res.status(403).json({ error: 'Organization pending approval', code: 'ORG_PENDING' });
    }
    return handler(ctx, req, res);
  });
}

export function withPlatformAdmin(
  handler: (ctx: AuthContext, req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>,
) {
  return withAuth(async (ctx, req, res) => {
    if (!ctx.isPlatformAdmin) {
      return res.status(403).json({ error: 'Platform administrator access required' });
    }
    return handler(ctx, req, res);
  });
}
