import express from 'express';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get notifications
router.get('/', async (req: AuthRequest, res) => {
  // TODO: Implement notification retrieval
  res.json({ notifications: [] });
});

// Mark notification as read
router.post('/:id/read', async (req: AuthRequest, res) => {
  // TODO: Implement mark as read
  res.json({ message: 'Notification marked as read' });
});

export { router };
