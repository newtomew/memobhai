const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const BASE = 'https://api.resend.com';

export type ResendDomainRecord = {
  record: string;
  name: string;
  type: string;
  value: string;
  status: string;
  ttl?: string;
  priority?: number;
};

export type ResendDomain = {
  id: string;
  name: string;
  status: string;
  region?: string;
  created_at?: string;
  records?: ResendDomainRecord[];
};

async function resendFetch(path: string, options: RequestInit = {}) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const msg = typeof data === 'object' && data && 'message' in data
      ? String((data as { message: string }).message)
      : text;
    throw new Error(msg || `Resend API error ${res.status}`);
  }

  return data;
}

export function getConfiguredEmailDomain() {
  return process.env.RESEND_DOMAIN || 'memobhai.online';
}

export async function listResendDomains(): Promise<ResendDomain[]> {
  const data = await resendFetch('/domains') as { data?: ResendDomain[] };
  return data.data || [];
}

export async function getResendDomain(domainId: string): Promise<ResendDomain> {
  return resendFetch(`/domains/${domainId}`) as Promise<ResendDomain>;
}

export async function verifyResendDomain(domainId: string) {
  return resendFetch(`/domains/${domainId}/verify`, { method: 'POST' });
}

export async function createResendDomain(name: string): Promise<ResendDomain> {
  return resendFetch('/domains', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }) as Promise<ResendDomain>;
}

export async function findDomainByName(name: string): Promise<ResendDomain | null> {
  const domains = await listResendDomains();
  const match = domains.find((d) => d.name.toLowerCase() === name.toLowerCase());
  if (!match) return null;
  return getResendDomain(match.id);
}

export function maskApiKey(key: string) {
  if (!key || key.length < 8) return key ? '***' : '';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
