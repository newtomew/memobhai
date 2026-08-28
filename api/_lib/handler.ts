import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, handleOptions } from './cors';
import { ZodError } from 'zod';

export function apiHandler(
  fn: (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>,
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: 'Validation error', details: err.errors });
      }
      console.error('API Error:', err);
      const message = err instanceof Error ? err.message : 'Internal server error';
      return res.status(500).json({ error: message });
    }
  };
}
