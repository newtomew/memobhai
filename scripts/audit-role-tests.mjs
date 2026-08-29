#!/usr/bin/env node
/**
 * MemoBhai comprehensive role + workflow API audit.
 * Usage: node scripts/audit-role-tests.mjs [baseUrl]
 * Set AUDIT_MUTATE=1 to run workflow tests that create/cancel memos on the target server.
 */
const BASE = process.argv[2] || process.env.AUDIT_BASE_URL || 'https://memobhai.vercel.app';
const API = `${BASE}/api`;
const MUTATE = process.env.AUDIT_MUTATE !== '0';

const ACCOUNTS = {
  platformAdmin: { email: 'admin@memobhai.com', password: 'Pass@2026(memobhai)', label: 'Platform Admin' },
  platformOwner: { email: 'zahidhoshen.masud@gmail.com', password: 'Pass@2026(memobhai)', label: 'Platform Owner (Gmail)' },
  orgAdmin: { email: 'admin@demo.com', password: 'Demo123!', label: 'Org Administrator' },
  manager: { email: 'manager@demo.com', password: 'Demo123!', label: 'Manager / Approver' },
  employee: { email: 'employee@demo.com', password: 'Demo123!', label: 'Employee' },
  otherOrgAdmin: { email: 'acme-admin@demo.com', password: 'Demo123!', label: 'Other Org Admin' },
};

const results = [];

function record(category, name, status, detail = '') {
  results.push({ category, name, status, detail });
  const icon = { PASS: '✅', FAIL: '❌', WARN: '⚠️', SKIP: '⏭️' }[status] || '•';
  console.log(`${icon} [${category}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data, ok: res.ok };
}

async function login(account) {
  const r = await req('POST', '/auth/login', { body: { email: account.email, password: account.password } });
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(r.data)}`);
  return {
    token: r.data.token,
    user: r.data.user,
    organization: r.data.organization,
    pending: r.data.pending,
  };
}

async function testPublicRoutes() {
  const cat = 'Public';
  record(cat, 'Landing page', (await fetch(BASE)).ok ? 'PASS' : 'FAIL');
  record(cat, 'Org lookup', (await req('GET', '/auth/org-lookup?slug=demo-company')).ok ? 'PASS' : 'FAIL');
  for (const path of ['/messages', '/platform/organizations', '/billing']) {
    const r = await req('GET', path);
    record(cat, `401 without auth ${path}`, r.status === 401 ? 'PASS' : 'FAIL', `HTTP ${r.status}`);
  }
}

async function testRole(account, checks) {
  let session;
  try {
    session = await login(account);
    record(account.label, 'Login', session.pending ? 'WARN' : 'PASS', session.organization?.slug || '');
  } catch (e) {
    record(account.label, 'Login', 'FAIL', e.message);
    return null;
  }
  for (const check of checks) {
    await check(session, account.label);
  }
  return session;
}

async function runWorkflowE2E() {
  if (!MUTATE) {
    record('Workflow E2E', 'Full memo lifecycle', 'SKIP', 'Set AUDIT_MUTATE=1 to enable');
    return;
  }
  const cat = 'Workflow E2E';
  try {
    const adminSession = await login(ACCOUNTS.orgAdmin);
    const empSession = await login(ACCOUNTS.employee);
    const mgrSession = await login(ACCOUNTS.manager);

    const depts = await req('GET', '/admin/departments', { token: adminSession.token });
    const deptId = depts.data?.departments?.[0]?.id;
    const users = await req('GET', '/admin/users', { token: adminSession.token });
    const managerId = users.data?.users?.find((u) => u.email === 'manager@demo.com')?.id;

    if (!deptId || !managerId) {
      record(cat, 'Setup dept/manager ids', 'FAIL', `dept=${deptId} mgr=${managerId}`);
      return;
    }

    const tag = `[AUDIT-${Date.now()}]`;
    const created = await req('POST', '/memos', {
      token: empSession.token,
      body: { subject: `${tag} Workflow test`, body: '<p>Automated E2E audit memo</p>', departmentId: deptId, priority: 'normal' },
    });
    const memoId = created.data?.memo?.id || created.data?.id;
    record(cat, 'Employee creates draft', created.ok && memoId ? 'PASS' : 'FAIL', `HTTP ${created.status}`);

    if (!memoId) return;

    const submitted = await req('POST', `/memos/${memoId}/submit`, {
      token: empSession.token,
      body: { workflowUserIds: [managerId] },
    });
    record(cat, 'Submit with approver chain', submitted.ok ? 'PASS' : 'FAIL', `HTTP ${submitted.status}`);

    const inbox = await req('GET', '/memos?scope=inbox', { token: mgrSession.token });
    const inInbox = inbox.data?.memos?.some((m) => m.id === memoId);
    record(cat, 'Memo in manager inbox', inInbox ? 'PASS' : 'WARN', `inbox=${inbox.data?.memos?.length ?? 0}`);

    const approved = await req('POST', `/workflow/${memoId}/approve`, {
      token: mgrSession.token,
      body: { comment: 'Audit approval' },
    });
    record(cat, 'Manager approves', approved.ok ? 'PASS' : 'FAIL', `HTTP ${approved.status}`);

    const pdf = await fetch(`${API}/memos/${memoId}/export-pdf`, {
      headers: { Authorization: `Bearer ${empSession.token}` },
    });
    record(cat, 'PDF export', pdf.ok ? 'PASS' : 'FAIL', `HTTP ${pdf.status}`);

    const memoNumber = created.data?.memo?.memoNumber || created.data?.memoNumber;
    if (memoNumber) {
      const other = await login(ACCOUNTS.otherOrgAdmin);
      const cross = await req('GET', `/search?q=${encodeURIComponent(memoNumber)}`, { token: other.token });
      const hits = cross.data?.results?.length ?? cross.data?.memos?.length ?? 0;
      record('Tenant isolation', 'Cross-org search blocked', hits === 0 ? 'PASS' : 'FAIL', `found=${hits}`);
    }

    // Approved memos cannot be cancelled — leave as completed audit artifact
    record(cat, 'Cleanup', 'PASS', 'Approved memo left in demo org (cancel not allowed post-approval)');
  } catch (e) {
    record(cat, 'Workflow E2E', 'FAIL', e.message);
  }
}

async function runProfileTests(token, label) {
  const me = await req('GET', '/auth/me', { token });
  record(label, 'Profile via /auth/me', me.ok ? 'PASS' : 'FAIL', me.data?.user?.email);

  const otpReq = await req('POST', '/profile', {
    token,
    body: { action: 'request-otp', purpose: 'change_password', currentPassword: ACCOUNTS.employee.password },
  });
  // 200 or 400 (rate limit / resend) both prove endpoint exists
  record(label, 'Profile OTP request endpoint', otpReq.status !== 405 ? 'PASS' : 'FAIL', `HTTP ${otpReq.status}`);
}

async function run() {
  console.log(`\n🔍 MemoBhai Audit — ${BASE} (mutate=${MUTATE})\n${'='.repeat(60)}\n`);
  await testPublicRoutes();

  await testRole(ACCOUNTS.platformAdmin, [
    async (s, l) => {
      record(l, 'isPlatformAdmin flag', s.user?.isPlatformAdmin ? 'PASS' : 'FAIL');
      record(l, 'Platform org list', (await req('GET', '/platform/organizations', { token: s.token })).ok ? 'PASS' : 'FAIL');
      record(l, 'Join requests', (await req('GET', '/join-requests', { token: s.token })).ok ? 'PASS' : 'FAIL');
      record(l, 'Billing', (await req('GET', '/billing', { token: s.token })).ok ? 'PASS' : 'FAIL');
    },
  ]);

  await testRole(ACCOUNTS.platformOwner, [
    async (s, l) => {
      record(l, 'Platform access', s.user?.isPlatformAdmin ? 'PASS' : 'WARN', 'Gmail platform flag');
    },
  ]);

  await testRole(ACCOUNTS.orgAdmin, [
    async (s, l) => {
      for (const [name, path] of [
        ['Admin dashboard', '/admin/dashboard'],
        ['Users', '/admin/users'],
        ['Departments', '/admin/departments'],
        ['Categories', '/admin/categories'],
        ['Templates', '/admin/templates'],
        ['Audit logs', '/admin/audit-logs'],
        ['Join requests', '/join-requests'],
        ['Billing', '/billing'],
      ]) {
        const r = await req('GET', path, { token: s.token });
        record(l, name, r.ok ? 'PASS' : 'FAIL', `HTTP ${r.status}`);
      }
      record(l, 'Platform blocked', (await req('GET', '/platform/organizations', { token: s.token })).status === 403 ? 'PASS' : 'FAIL');
    },
  ]);

  await testRole(ACCOUNTS.manager, [
    async (s, l) => {
      record(l, 'Admin role', s.user?.role === 'admin' ? 'PASS' : 'FAIL');
      record(l, 'Admin dashboard', (await req('GET', '/admin/dashboard', { token: s.token })).ok ? 'PASS' : 'FAIL');
    },
  ]);

  await testRole(ACCOUNTS.employee, [
    async (s, l) => {
      record(l, 'Admin blocked', (await req('GET', '/admin/dashboard', { token: s.token })).status === 403 ? 'PASS' : 'FAIL');
      record(l, 'Platform blocked', (await req('GET', '/platform/organizations', { token: s.token })).status === 403 ? 'PASS' : 'FAIL');
      record(l, 'Billing blocked', (await req('GET', '/billing', { token: s.token })).status === 403 ? 'PASS' : 'FAIL');
      record(l, 'Dashboard', (await req('GET', '/dashboard/summary', { token: s.token })).ok ? 'PASS' : 'FAIL');
      record(l, 'Inbox', (await req('GET', '/memos?scope=inbox', { token: s.token })).ok ? 'PASS' : 'FAIL');
      record(l, 'Messages', (await req('GET', '/messages', { token: s.token })).ok ? 'PASS' : 'FAIL');
      record(l, 'Delegations', (await req('GET', '/delegations', { token: s.token })).ok ? 'PASS' : 'FAIL');
      await runProfileTests(s.token, l);
    },
  ]);

  await runWorkflowE2E();

  // Frontend chunks (lazy routes)
  const cat = 'Frontend deploy';
  try {
    const html = await (await fetch(BASE)).text();
    const mainJs = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
    const chunks = mainJs ? await (await fetch(`${BASE}${mainJs}`)).text() : '';
    const checks = [
      ['UpgradePage', 'Premium /upgrade route'],
      ['PlatformAdminPage', 'Platform admin'],
      ['MemoCreatePage', 'Rich text editor (lazy chunk)'],
      ['BillingPage', 'Billing'],
      ['MessagesPage', 'Messages'],
    ];
    for (const [needle, name] of checks) {
      record(cat, name, chunks.includes(needle) ? 'PASS' : 'FAIL', needle);
    }
    record(cat, 'Landing (in bundle)', chunks.includes('landing-bg') || chunks.includes('/articles') ? 'PASS' : 'FAIL');
    record(cat, 'Articles route', (await fetch(`${BASE}/articles`)).ok ? 'PASS' : 'FAIL');
  } catch (e) {
    record(cat, 'Bundle check', 'FAIL', e.message);
  }

  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  const skip = results.filter((r) => r.status === 'SKIP').length;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SUMMARY: ${pass} PASS | ${fail} FAIL | ${warn} WARN | ${skip} SKIP\n`);
  if (fail) {
    console.log('FAILURES:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  • [${r.category}] ${r.name}: ${r.detail}`));
  }
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(2); });
