import express from 'express';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Search memos
router.get('/', async (req: AuthRequest, res) => {
  const { q, status, priority, category, department, startDate, endDate } = req.query;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  // TODO: Implement search
  // Search only memos authored or involved in workflow
  // Apply filters
  // Full-text search on subject and body
  // Return paginated results

  res.json({ results: [] });
});

export { router };
