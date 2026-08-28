import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.user.deleteMany({});
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
  const deptHR = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Human Resources',
      description: 'HR Department',
      status: 'active',
    },
  });

  const deptFinance = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Finance',
      description: 'Finance Department',
      status: 'active',
    },
  });

  const deptIT = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Information Technology',
      description: 'IT Department',
      status: 'active',
    },
  });

  // Create categories
  await prisma.memoCategory.create({
    data: {
      organizationId: org.id,
      name: 'Administrative',
      status: 'active',
    },
  });

  await prisma.memoCategory.create({
    data: {
      organizationId: org.id,
      name: 'Financial',
      status: 'active',
    },
  });

  await prisma.memoCategory.create({
    data: {
      organizationId: org.id,
      name: 'Technical',
      status: 'active',
    },
  });

  // Hash password
  const hashedPassword = await bcryptjs.hash('Demo123!', 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: deptHR.id,
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'Admin User',
      designation: 'Administrator',
      role: 'admin',
      status: 'active',
    },
  });

  const employee = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: deptIT.id,
      email: 'employee@demo.com',
      password: hashedPassword,
      name: 'John Employee',
      designation: 'Software Engineer',
      role: 'user',
      status: 'active',
    },
  });

  const manager = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: deptIT.id,
      email: 'manager@demo.com',
      password: hashedPassword,
      name: 'Jane Manager',
      designation: 'Engineering Manager',
      role: 'user',
      status: 'active',
    },
  });

  const finance = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: deptFinance.id,
      email: 'finance@demo.com',
      password: hashedPassword,
      name: 'Bob Finance',
      designation: 'Finance Director',
      role: 'user',
      status: 'active',
    },
  });

  const hr = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: deptHR.id,
      email: 'hr@demo.com',
      password: hashedPassword,
      name: 'Alice HR',
      designation: 'HR Manager',
      role: 'user',
      status: 'active',
    },
  });

  console.log('Created users:');
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Employee: ${employee.email}`);
  console.log(`- Manager: ${manager.email}`);
  console.log(`- Finance: ${finance.email}`);
  console.log(`- HR: ${hr.email}`);
  console.log('Password for all: Demo123!');

  // Create workflow templates
  await prisma.workflowTemplate.create({
    data: {
      organizationId: org.id,
      name: 'Simple Approval',
      description: 'Employee → Manager → Director',
      positions: ['Employee', 'Manager', 'Director'],
    },
  });

  await prisma.workflowTemplate.create({
    data: {
      organizationId: org.id,
      name: 'Finance Approval',
      description: 'Employee → Finance → Director',
      positions: ['Requester', 'Finance Manager', 'Director'],
    },
  });

  console.log('Created workflow templates');

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
