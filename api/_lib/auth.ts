import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase';
import { prisma } from './prisma';

export interface AuthContext {
  userId: string;        // Prisma User.id
  authId: string;       // Supabase Auth user id
  organizationId: string;
  email: string;
  role: string;
  name: string;
}

/**
 * Extracts and verifies the Supabase JWT from the Authorization header.
 * Resolves the Prisma User profile + organization from the authId.
 * Returns null if unauthenticated (caller should return 401).
 */
export async function resolveAuth(req: VercelRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const accessToken = authHeader.replace('Bearer ', '');

  // Verify the JWT with Supabase
  const { data: authData, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !authData.user) return null;

  const authId = authData.user.id;

  // Look up the Prisma user profile
  const user = await prisma.user.findUnique({
    where: { authId },
    include: { organization: true },
  });

  if (!user || user.status !== 'active') return null;

  return {
    userId: user.id,
    authId,
    organizationId: user.organizationId,
    email: user.email,
    role: user.role,
    name: user.name,
  };
}

/**
 * Wraps a handler with auth resolution. Returns 401 if not authenticated.
 */
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

/**
 * Wraps a handler with admin-only auth. Returns 403 if not admin.
 */
export function withAdmin(
  handler: (ctx: AuthContext, req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>,
) {
  return withAuth(async (ctx, req, res) => {
    if (ctx.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return handler(ctx, req, res);
  });
}
