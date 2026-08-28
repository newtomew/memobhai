import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'express-async-errors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';
import { router as authRouter } from './routes/auth';
import { router as memosRouter } from './routes/memos';
import { router as commentsRouter } from './routes/comments';
import { router as attachmentsRouter } from './routes/attachments';
import { router as notificationsRouter } from './routes/notifications';
import { router as adminRouter } from './routes/admin';
import { router as workflowRouter } from './routes/workflow';
import { router as searchRouter } from './routes/search';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const app: Express = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:20262',
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes - require authentication and tenant
app.use('/api', authMiddleware);
app.use('/api', tenantMiddleware);

// API Routes
app.use('/api/memos', memosRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/search', searchRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
