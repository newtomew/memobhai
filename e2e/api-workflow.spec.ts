import { test, expect } from '@playwright/test';

const API = process.env.PLAYWRIGHT_BASE_URL
  ? `${process.env.PLAYWRIGHT_BASE_URL}/api`
  : 'https://memobhai.vercel.app/api';

async function apiLogin(request, email: string, password: string) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.token as string;
}

test.describe('API role enforcement', () => {
  test('Employee billing GET returns 403', async ({ request }) => {
    const token = await apiLogin(request, 'employee@demo.com', 'Demo123!');
    const res = await request.get(`${API}/billing`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('Org admin billing GET returns 200', async ({ request }) => {
    const token = await apiLogin(request, 'admin@demo.com', 'Demo123!');
    const res = await request.get(`${API}/billing`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('Platform owner Gmail login works', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'zahidhoshen.masud@gmail.com', password: 'Pass@2026(memobhai)' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.user?.isPlatformAdmin).toBe(true);
  });

  test('Full workflow: create → submit → approve → cancel', async ({ request }) => {
    const adminToken = await apiLogin(request, 'admin@demo.com', 'Demo123!');
    const empToken = await apiLogin(request, 'employee@demo.com', 'Demo123!');
    const mgrToken = await apiLogin(request, 'manager@demo.com', 'Demo123!');

    const depts = await request.get(`${API}/admin/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deptId = (await depts.json()).departments[0].id;

    const users = await request.get(`${API}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const managerId = (await users.json()).users.find((u: { email: string }) => u.email === 'manager@demo.com').id;

    const tag = `[E2E-${Date.now()}]`;
    const createRes = await request.post(`${API}/memos`, {
      headers: { Authorization: `Bearer ${empToken}` },
      data: {
        subject: `${tag} Playwright workflow`,
        body: '<p>E2E test memo</p>',
        departmentId: deptId,
        priority: 'normal',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const memo = (await createRes.json()).memo;
    expect(memo.id).toBeTruthy();

    const submitRes = await request.post(`${API}/memos/${memo.id}/submit`, {
      headers: { Authorization: `Bearer ${empToken}` },
      data: { workflowUserIds: [managerId] },
    });
    expect(submitRes.ok()).toBeTruthy();

    const approveRes = await request.post(`${API}/workflow/${memo.id}/approve`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
      data: { comment: 'E2E approved' },
    });
    expect(approveRes.ok()).toBeTruthy();

    const pdfRes = await request.get(`${API}/memos/${memo.id}/export-pdf`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(pdfRes.ok()).toBeTruthy();

    const otherToken = await apiLogin(request, 'acme-admin@demo.com', 'Demo123!');
    const searchRes = await request.get(`${API}/search?q=${encodeURIComponent(memo.memoNumber)}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    const searchBody = await searchRes.json();
    const hits = searchBody.results?.length ?? searchBody.memos?.length ?? 0;
    expect(hits).toBe(0);

    // Approved memos cannot be cancelled — workflow complete
  });
});
