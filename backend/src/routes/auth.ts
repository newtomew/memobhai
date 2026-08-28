import express, { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  organizationName: z.string().min(1),
  organizationSlug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
router.post('/register', async (req, res) => {
  const data = registerSchema.parse(req.body);

  // Check if organization exists
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: data.organizationSlug },
  });

  if (existingOrg) {
    return res.status(400).json({ error: 'Organization already exists' });
  }

  // Check if user email exists globally
  const existingEmail = await prisma.user.findFirst({
    where: { email: data.email },
  });

  if (existingEmail) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: data.organizationName,
      slug: data.organizationSlug,
    },
  });

  // Create default department
  const department = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Default Department',
      status: 'active',
    },
  });

  // Hash password
  const hashedPassword = await bcryptjs.hash(data.password, 10);

  // Create admin user
  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: department.id,
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: 'admin',
      status: 'active',
    },
  });

  // Generate token
  const token = jwt.sign(
    {
      userId: user.id,
      organizationId: org.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRY || '7d' },
  );

  res.json({
    token,
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

// Login
router.post('/login', async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { organization: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordMatch = await bcryptjs.compare(data.password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRY || '7d' },
  );

  res.json({
    token,
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

export { router };
