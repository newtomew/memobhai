import express from 'express';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Upload attachment
router.post('/:memoId', async (req: AuthRequest, res) => {
  // TODO: Implement file upload
  res.json({ message: 'File uploaded' });
});

// Download attachment
router.get('/:attachmentId', async (req: AuthRequest, res) => {
  // TODO: Implement file download with authorization
  res.json({ message: 'File download not implemented' });
});

export { router };
