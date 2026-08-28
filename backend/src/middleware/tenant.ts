import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const tenantMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.organizationId) {
    return res.status(401).json({ error: 'No organization context' });
  }

  // Verify organization exists
  const org = await prisma.organization.findUnique({
    where: { id: req.organizationId },
  });

  if (!org) {
    return res.status(403).json({ error: 'Organization not found' });
  }

  // Attach organization to request
  (req as any).organization = org;

  next();
};

// Helper to ensure user belongs to organization
export const ensureOrgAccess = async (
  userId: string,
  organizationId: string,
) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId,
    },
  });

  return !!user;
};

// Helper to ensure admin access
export const requireAdmin = (req: AuthRequest, res: Response): boolean => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return false;
  }
  return true;
};
