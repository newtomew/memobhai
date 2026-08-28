import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { z } from 'zod';

const registerSchema = z.object({
  organizationName: z.string().min(1),
  organizationSlug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = registerSchema.parse(req.body);

  // Check if organization slug already exists
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: data.organizationSlug },
  });
  if (existingOrg) {
    return res.status(400).json({ error: 'Organization already exists' });
  }

  // Check if email already exists in our profiles
  const existingEmail = await prisma.user.findFirst({
    where: { email: data.email },
  });
  if (existingEmail) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Create the auth user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // Auto-confirm for demo
  });

  if (authError || !authData.user) {
    return res.status(400).json({ error: authError?.message || 'Failed to create auth user' });
  }

  // Create organization, department, and user profile.
  // If any Prisma step fails, delete the Supabase auth user to avoid orphaned accounts.
  let org: Awaited<ReturnType<typeof prisma.organization.create>>;
  let user: Awaited<ReturnType<typeof prisma.user.create>>;
  try {
    org = await prisma.organization.create({
      data: {
        name: data.organizationName,
        slug: data.organizationSlug,
      },
    });

    const department = await prisma.department.create({
      data: {
        organizationId: org.id,
        name: 'Default Department',
        status: 'active',
      },
    });

    user = await prisma.user.create({
      data: {
        authId: authData.user.id,
        organizationId: org.id,
        departmentId: department.id,
        email: data.email,
        name: data.name,
        role: 'admin',
        status: 'active',
      },
    });
  } catch (prismaError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw prismaError;
  }

  // Generate a session by signing in
  const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (sessionError || !sessionData.session) {
    return res.status(500).json({ error: 'Account created but sign-in failed. Please log in manually.' });
  }

  res.json({
    token: sessionData.session.access_token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
    },
  });
});
