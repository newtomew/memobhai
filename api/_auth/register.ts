import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { hashPassword } from '../_lib/crypto';
import { z } from 'zod';

const registerSchema = z.object({
  signupType: z.enum(['new_org', 'join_manager', 'join_employee']),
  organizationName: z.string().min(1).optional(),
  organizationSlug: z.string().min(1).optional(),
  orgSlug: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = registerSchema.parse(req.body);
  const orgSlug = data.organizationSlug || data.orgSlug;

  const existingEmail = await prisma.user.findFirst({ where: { email: data.email } });
  if (existingEmail) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const pendingJoin = await prisma.joinRequest.findFirst({
    where: { email: data.email, status: 'pending' },
  });
  if (pendingJoin) {
    return res.status(400).json({ error: 'A pending join request already exists for this email' });
  }

  if (data.signupType === 'new_org') {
    if (!data.organizationName || !orgSlug) {
      return res.status(400).json({ error: 'Organization name and slug are required' });
    }

    const existingOrg = await prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (existingOrg) {
      return res.status(400).json({ error: 'Organization slug already taken' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Failed to create auth user' });
    }

    try {
      const org = await prisma.organization.create({
        data: {
          name: data.organizationName,
          slug: orgSlug,
          status: 'pending',
          contactEmail: data.email,
        },
      });

      const department = await prisma.department.create({
        data: { organizationId: org.id, name: 'Default Department', status: 'active' },
      });

      const user = await prisma.user.create({
        data: {
          authId: authData.user.id,
          organizationId: org.id,
          departmentId: department.id,
          email: data.email,
          name: data.name,
          role: 'admin',
          status: 'pending',
        },
      });

      await prisma.joinRequest.create({
        data: {
          requestType: 'new_org',
          organizationId: org.id,
          organizationName: data.organizationName,
          organizationSlug: orgSlug,
          email: data.email,
          name: data.name,
          passwordHash: hashPassword(data.password),
          requestedRole: 'founder',
        },
      });

      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (sessionError || !sessionData.session) {
        return res.status(201).json({
          pending: true,
          message: 'Organization registration submitted for platform approval',
        });
      }

      return res.status(201).json({
        token: sessionData.session.access_token,
        pending: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
        organization: { id: org.id, name: org.name, slug: org.slug, status: org.status },
      });
    } catch (err) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw err;
    }
  }

  // Join existing organization as manager or employee
  if (!orgSlug) {
    return res.status(400).json({ error: 'Organization slug is required to join' });
  }

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  if (org.status === 'banned') {
    return res.status(403).json({ error: 'This organization is not accepting new members' });
  }
  if (org.status !== 'active') {
    return res.status(400).json({ error: 'Organization is not yet active' });
  }

  const requestedRole = data.signupType === 'join_manager' ? 'admin' : 'user';

  const existingInOrg = await prisma.user.findFirst({
    where: { organizationId: org.id, email: data.email },
  });
  if (existingInOrg) {
    return res.status(400).json({ error: 'Email already registered in this organization' });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return res.status(400).json({ error: authError?.message || 'Failed to create auth user' });
  }

  try {
    const department = await prisma.department.findFirst({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'asc' },
    });

    const user = await prisma.user.create({
      data: {
        authId: authData.user.id,
        organizationId: org.id,
        departmentId: department?.id,
        email: data.email,
        name: data.name,
        role: requestedRole,
        status: 'pending',
      },
    });

    await prisma.joinRequest.create({
      data: {
        requestType: 'join_org',
        organizationId: org.id,
        email: data.email,
        name: data.name,
        passwordHash: hashPassword(data.password),
        requestedRole,
      },
    });

    const { data: sessionData } = await supabaseAdmin.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    return res.status(201).json({
      token: sessionData?.session?.access_token,
      pending: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
      organization: { id: org.id, name: org.name, slug: org.slug, status: org.status },
      message:
        requestedRole === 'admin'
          ? 'Manager join request submitted — awaiting platform administrator approval'
          : 'Employee join request submitted — awaiting manager approval',
    });
  } catch (err) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw err;
  }
});
