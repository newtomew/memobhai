import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Supabase admin client for creating auth users
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = 'Demo123!';

interface SeedUser {
  email: string;
  name: string;
  designation: string;
  role: string;
  departmentName: string;
}

const usersToCreate: SeedUser[] = [
  { email: 'admin@demo.com', name: 'Admin User', designation: 'Administrator', role: 'admin', departmentName: 'Human Resources' },
  { email: 'employee@demo.com', name: 'John Employee', designation: 'Software Engineer', role: 'user', departmentName: 'Information Technology' },
  { email: 'manager@demo.com', name: 'Jane Manager', designation: 'Engineering Manager', role: 'user', departmentName: 'Information Technology' },
  { email: 'finance@demo.com', name: 'Bob Finance', designation: 'Finance Director', role: 'user', departmentName: 'Finance' },
  { email: 'hr@demo.com', name: 'Alice HR', designation: 'HR Manager', role: 'user', departmentName: 'Human Resources' },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data (order matters for FK constraints)
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.workflowStep.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.memoVersion.deleteMany({});
  await prisma.memo.deleteMany({});
  await prisma.workflowTemplate.deleteMany({});
  await prisma.memoCategory.deleteMany({});
  await prisma.delegation.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.organization.deleteMany({});

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Company',
      slug: 'demo-company',
      contactEmail: 'admin@demo.com',
    },
  });
  console.log('Created organization:', org.name);

  // Create departments
  const departments = await Promise.all(
    ['Human Resources', 'Finance', 'Information Technology'].map((name) =>
      prisma.department.create({
        data: {
          organizationId: org.id,
          name,
          description: `${name} Department`,
          status: 'active',
        },
      })
    )
  );
  const deptMap = Object.fromEntries(departments.map((d) => [d.name, d]));

  // Create categories
  await Promise.all(
    ['Administrative', 'Financial', 'Technical'].map((name) =>
      prisma.memoCategory.create({
        data: { organizationId: org.id, name, status: 'active' },
      })
    )
  );

  // Create auth users in Supabase + profile records in Prisma
  for (const u of usersToCreate) {
    // Create auth user in Supabase
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });

    if (error) {
      console.error(`Failed to create auth user for ${u.email}:`, error.message);
      continue;
    }

    // Create profile in Prisma
    const user = await prisma.user.create({
      data: {
        authId: authData.user.id,
        organizationId: org.id,
        departmentId: deptMap[u.departmentName].id,
        email: u.email,
        name: u.name,
        designation: u.designation,
        role: u.role,
        status: 'active',
      },
    });

    console.log(`- Created user: ${user.email} (${user.role})`);
  }

  // Create workflow templates
  await prisma.workflowTemplate.create({
    data: {
      organizationId: org.id,
      name: 'Simple Approval',
      description: 'Employee -> Manager -> Director',
      positions: ['Employee', 'Manager', 'Director'],
    },
  });
  await prisma.workflowTemplate.create({
    data: {
      organizationId: org.id,
      name: 'Finance Approval',
      description: 'Employee -> Finance -> Director',
      positions: ['Requester', 'Finance Manager', 'Director'],
    },
  });

  console.log('Created workflow templates');
  console.log(`Password for all users: ${DEFAULT_PASSWORD}`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
