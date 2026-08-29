import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = 'Demo123!';
const OWNER_PASSWORD = 'Pass@2026(memobhai)';

interface OrgSeed {
  name: string;
  slug: string;
  contactEmail: string;
  departments: string[];
  categories: string[];
  users: Array<{
    email: string;
    name: string;
    designation: string;
    role: 'admin' | 'user';
    departmentName: string;
    password?: string;
  }>;
}

const ORGS: OrgSeed[] = [
  {
    name: 'Demo Company',
    slug: 'demo-company',
    contactEmail: 'admin@demo.com',
    departments: ['Human Resources', 'Finance', 'Information Technology'],
    categories: ['Administrative', 'Financial', 'Technical'],
    users: [
      { email: 'admin@demo.com', name: 'Admin User', designation: 'Administrator', role: 'admin', departmentName: 'Human Resources' },
      { email: 'manager@demo.com', name: 'Jane Manager', designation: 'Engineering Manager', role: 'admin', departmentName: 'Information Technology' },
      { email: 'employee@demo.com', name: 'John Employee', designation: 'Software Engineer', role: 'user', departmentName: 'Information Technology' },
      { email: 'finance@demo.com', name: 'Bob Finance', designation: 'Finance Director', role: 'user', departmentName: 'Finance' },
      { email: 'hr@demo.com', name: 'Alice HR', designation: 'HR Manager', role: 'user', departmentName: 'Human Resources' },
    ],
  },
  {
    name: 'Acme Corporation',
    slug: 'acme-corp',
    contactEmail: 'acme-admin@demo.com',
    departments: ['Operations', 'Sales', 'Engineering'],
    categories: ['General', 'Procurement', 'HR'],
    users: [
      { email: 'acme-admin@demo.com', name: 'Acme Admin', designation: 'Org Administrator', role: 'admin', departmentName: 'Operations' },
      { email: 'acme-manager@demo.com', name: 'Acme Manager', designation: 'Operations Manager', role: 'admin', departmentName: 'Operations' },
      { email: 'acme-staff@demo.com', name: 'Acme Staff', designation: 'Operations Associate', role: 'user', departmentName: 'Sales' },
    ],
  },
  {
    name: 'NorthSouth University',
    slug: 'northsouth-edu',
    contactEmail: 'nsu-admin@demo.com',
    departments: ['Administration', 'Academic Affairs', 'Student Services'],
    categories: ['Academic', 'Administrative', 'Financial'],
    users: [
      { email: 'nsu-admin@demo.com', name: 'NSU Admin', designation: 'University Administrator', role: 'admin', departmentName: 'Administration' },
      { email: 'nabeel.mohammed@northsouth.edu', name: 'Nabeel Mohammed', designation: 'Department Manager', role: 'admin', departmentName: 'Academic Affairs' },
      { email: 'nsu-staff@demo.com', name: 'NSU Staff', designation: 'Administrative Officer', role: 'user', departmentName: 'Student Services' },
    ],
  },
  {
    name: 'TechStart Inc',
    slug: 'techstart',
    contactEmail: 'tech-admin@demo.com',
    departments: ['Product', 'Engineering', 'People Ops'],
    categories: ['Product', 'Engineering', 'Ops'],
    users: [
      { email: 'tech-admin@demo.com', name: 'TechStart Admin', designation: 'CEO', role: 'admin', departmentName: 'Product' },
      { email: 'tech-manager@demo.com', name: 'Tech Manager', designation: 'Engineering Lead', role: 'admin', departmentName: 'Engineering' },
      { email: 'tech-staff@demo.com', name: 'Tech Staff', designation: 'Developer', role: 'user', departmentName: 'Engineering' },
    ],
  },
  {
    name: 'Global Finance Ltd',
    slug: 'global-finance',
    contactEmail: 'gf-admin@demo.com',
    departments: ['Treasury', 'Compliance', 'Operations'],
    categories: ['Financial', 'Compliance', 'Operations'],
    users: [
      { email: 'gf-admin@demo.com', name: 'GF Admin', designation: 'Managing Director', role: 'admin', departmentName: 'Treasury' },
      { email: 'gf-manager@demo.com', name: 'GF Manager', designation: 'Compliance Manager', role: 'admin', departmentName: 'Compliance' },
      { email: 'gf-staff@demo.com', name: 'GF Staff', designation: 'Analyst', role: 'user', departmentName: 'Operations' },
    ],
  },
  {
    name: 'MemoBhai HQ',
    slug: 'memobhai-hq',
    contactEmail: 'zahidhoshen.masud@gmail.com',
    departments: ['Platform', 'Support'],
    categories: ['Platform', 'Internal'],
    users: [
      { email: 'zahidhoshen.masud@gmail.com', name: 'Zahid Hoshen', designation: 'Platform Owner', role: 'admin', departmentName: 'Platform', password: OWNER_PASSWORD },
      { email: 'admin@memobhai.com', name: 'MemoBhai Admin', designation: 'Platform Administrator', role: 'admin', departmentName: 'Platform', password: OWNER_PASSWORD },
    ],
  },
];

async function ensureAuthUser(email: string, password: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!error && data.user) return data.user.id;

  const { data: listed } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = listed?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) throw new Error(`Auth user failed for ${email}: ${error?.message}`);

  await supabaseAdmin.auth.admin.updateUserById(existing.id, { password });
  return existing.id;
}

async function main() {
  console.log('Seeding MemoBhai multi-tenant demo data...');

  await prisma.otpVerification.deleteMany({});
  await prisma.directMessage.deleteMany({});
  await prisma.joinRequest.deleteMany({});
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

  for (const orgDef of ORGS) {
    const org = await prisma.organization.create({
      data: {
        name: orgDef.name,
        slug: orgDef.slug,
        contactEmail: orgDef.contactEmail,
        status: 'active',
      },
    });

    const deptMap: Record<string, { id: string }> = {};
    for (const deptName of orgDef.departments) {
      const dept = await prisma.department.create({
        data: { organizationId: org.id, name: deptName, description: `${deptName} Department`, status: 'active' },
      });
      deptMap[deptName] = dept;
    }

    for (const catName of orgDef.categories) {
      await prisma.memoCategory.create({
        data: { organizationId: org.id, name: catName, status: 'active' },
      });
    }

    for (const u of orgDef.users) {
      const password = u.password || DEMO_PASSWORD;
      const authId = await ensureAuthUser(u.email, password);
      await prisma.user.create({
        data: {
          authId,
          organizationId: org.id,
          departmentId: deptMap[u.departmentName]?.id,
          email: u.email.toLowerCase(),
          name: u.name,
          designation: u.designation,
          role: u.role,
          status: 'active',
        },
      });
      console.log(`  ✓ ${orgDef.slug}: ${u.email} (${u.role})`);
    }

    await prisma.workflowTemplate.create({
      data: {
        organizationId: org.id,
        name: 'Standard Approval',
        description: 'Manager → Director chain',
        positions: ['Requester', 'Manager', 'Director'],
      },
    });
  }

  console.log('\n=== Demo Credentials ===');
  console.log('Demo orgs password: Demo123!');
  console.log('Owner (zahidhoshen.masud@gmail.com / admin@memobhai.com): Pass@2026(memobhai)');
  console.log('Platform admins (env): zahidhoshen.masud@gmail.com, admin@memobhai.com, nabeel.mohammed@northsouth.edu');
  console.log('Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
