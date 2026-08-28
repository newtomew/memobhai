import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { supabaseAdmin } from '../../_lib/supabase';
import { apiHandler } from '../../_lib/handler';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  designation: z.string().optional(),
  departmentId: z.string(),
  role: z.enum(['user', 'admin']).default('user'),
});

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    // Any authenticated org member can list users (needed for workflow participant selection)
    const users = await prisma.user.findMany({
      where: { organizationId: ctx.organizationId },
      include: { department: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ users });
  }

  // All write operations require admin
  if (ctx.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  if (req.method === 'POST') {
    const data = createUserSchema.parse(req.body);

    // Check email not taken
    const existing = await prisma.user.findFirst({ where: { email: data.email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Failed to create auth user' });
    }

    // Create profile
    const user = await prisma.user.create({
      data: {
        authId: authData.user.id,
        organizationId: ctx.organizationId,
        departmentId: data.departmentId,
        email: data.email,
        name: data.name,
        designation: data.designation || null,
        role: data.role,
        status: 'active',
      },
    });

    return res.json({ user });
  }

  if (req.method === 'PUT') {
    const { id } = req.query as { id: string };
    const { name, designation, departmentId, role, status } = req.body;

    const user = await prisma.user.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (departmentId !== undefined) {
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, organizationId: ctx.organizationId },
      });
      if (!dept) return res.status(400).json({ error: 'Department does not belong to this organization' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(designation !== undefined && { designation }),
        ...(departmentId !== undefined && { departmentId }),
        ...(role !== undefined && { role }),
        ...(status !== undefined && { status }),
      },
    });

    return res.json({ user: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
