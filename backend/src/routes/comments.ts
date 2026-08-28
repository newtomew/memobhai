import express from 'express';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Add comment to memo
router.post('/', async (req: AuthRequest, res) => {
  // TODO: Implement comment creation
  res.json({ message: 'Comment created' });
});

// Get memo comments
router.get('/:memoId', async (req: AuthRequest, res) => {
  // TODO: Implement comment retrieval
  res.json({ comments: [] });
});

export { router };
