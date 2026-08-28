import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// List memos (inbox/sent)
router.get('/', async (req: AuthRequest, res) => {
  const { type = 'inbox' } = req.query;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  // TODO: Implement memo listing with proper filtering
  // inbox: memos awaiting user's action
  // sent: memos created by user

  res.json({ memos: [] });
});

// Create memo
router.post('/', async (req: AuthRequest, res) => {
  const { subject, body, categoryId, priority, departmentId } = req.body;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  // TODO: Implement memo creation
  // Generate memo number
  // Create memo record
  // Log audit event

  res.json({ message: 'Memo created' });
});

// Get memo details
router.get('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;

  // TODO: Implement memo retrieval with authorization check

  res.json({ memo: {} });
});

// Update memo (draft only)
router.put('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { subject, body, priority } = req.body;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  // TODO: Implement memo update
  // Only allow if memo is draft
  // Only author can update

  res.json({ message: 'Memo updated' });
});

// Submit memo
router.post('/:id/submit', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { workflowUserIds } = req.body;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  // TODO: Implement memo submission
  // Validate workflow users
  // Create workflow steps
  // Update memo status
  // Send notifications

  res.json({ message: 'Memo submitted' });
});

// Export as PDF
router.get('/:id/export-pdf', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;

  // TODO: Implement PDF export
  // Check authorization
  // Generate PDF with memo details, approvals, comments
  // Return PDF file

  res.json({ message: 'PDF export not yet implemented' });
});

export { router };
