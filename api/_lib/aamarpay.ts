const SANDBOX_BASE = 'https://sandbox.aamarpay.com';

export function aamarpayConfig() {
  const sandbox = process.env.AAMARPAY_SANDBOX !== 'false';
  return {
    sandbox,
    baseUrl: sandbox ? SANDBOX_BASE : 'https://secure.aamarpay.com',
    storeId: process.env.AAMARPAY_STORE_ID || 'aamarpaytest',
    signatureKey: process.env.AAMARPAY_SIGNATURE_KEY || 'dbb74894e82415a2f7ff0ec3a97e4183',
  };
}

export function frontendBaseUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.VITE_FRONTEND_URL ||
    'https://memobhai.vercel.app'
  ).replace(/\/$/, '');
}

export function apiBaseUrl() {
  const url =
    process.env.API_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : frontendBaseUrl());
  return url.replace(/\/$/, '');
}

export async function initiateAamarpayPayment(payload: Record<string, string>) {
  const { baseUrl } = aamarpayConfig();
  const res = await fetch(`${baseUrl}/jsonpost.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, type: 'json' }),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as { result?: string; payment_url?: string; message?: string };
  } catch {
    throw new Error(text || 'Invalid aamarPay response');
  }
}

export function parseGatewayPayload(req: { method?: string; body?: unknown; query?: unknown }) {
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, string>;
  const query = (req.query && typeof req.query === 'object' ? req.query : {}) as Record<string, string>;
  return { ...query, ...body };
}
