# Development Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.local.template .env.local
   # Edit .env.local with your local database URL
   ```

3. **Setup Database**
   ```bash
   npm run db:migrate -w backend
   npm run db:seed -w backend
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

   Frontend: http://localhost:5173
   Backend: http://localhost:5000/api

## Architecture

### Frontend Structure

```
frontend/src/
├── pages/          # Page components (route-level)
├── components/     # Reusable components
├── services/       # API calls
├── store/          # Zustand state management
├── types/          # TypeScript interfaces
├── utils/          # Helper functions
└── App.tsx         # Root component
```

### Backend Structure

```
backend/src/
├── routes/         # API endpoints
├── middleware/     # Express middleware
├── services/       # Business logic
├── utils/          # Helpers
└── index.ts        # Entry point

backend/prisma/
├── schema.prisma   # Database schema
└── migrations/     # Database migrations
```

## Key Implementation Areas

### 1. Memo Workflow Engine (HIGH PRIORITY)

**Location**: `backend/src/routes/memos.ts`, `backend/src/routes/workflow.ts`

**What to implement**:
- Submit memo with workflow users
- Create WorkflowStep records for each position
- Move to next step on approval
- Handle rejections and change requests
- Return memo to appropriate person on changes

**Tips**:
- Use Prisma transactions for consistency
- Validate all workflow steps in order
- Only allow current user to act
- Send notifications on state changes

### 2. Real-time Notifications (HIGH PRIORITY)

**Location**: `frontend/src/components/`, `backend/src/routes/notifications.ts`

**What to implement**:
- Create Notification records on events
- Poll notifications endpoint
- Display unread count in navbar
- Mark as read functionality
- Toast notifications for new events

**Tips**:
- Could use WebSockets for real-time (optional)
- Start with polling for simplicity
- Filter notifications by organization

### 3. Rich Text Editor (MEDIUM PRIORITY)

**Location**: `frontend/src/pages/MemoCreatePage.tsx`

**What to implement**:
- Integrate Tiptap editor
- Format buttons (bold, italic, lists, etc.)
- Save to memo.body as HTML
- Display formatted content in memo details

**Tips**:
- Tiptap is already in package.json
- Store content as HTML
- Sanitize on display to prevent XSS

### 4. File Attachments (MEDIUM PRIORITY)

**Location**: `backend/src/routes/attachments.ts`, `frontend/`

**What to implement**:
- File upload to `/uploads` directory (or S3)
- Save Attachment records
- Download with authorization check
- List attachments for memo

**Tips**:
- Validate file types and size
- Store file path securely
- Use authorization check before download

### 5. Search & Filtering (MEDIUM PRIORITY)

**Location**: `backend/src/routes/search.ts`

**What to implement**:
- Full-text search on subject/body
- Filter by status, priority, category, date
- Restrict to authored or workflow memos
- Paginate results

**Tips**:
- Use Prisma fulltext search
- Always filter by organization
- Check user has access to each result

### 6. Admin Dashboard (LOW PRIORITY)

**Location**: `backend/src/routes/admin.ts`, `frontend/src/pages/AdminPage.tsx`

**What to implement**:
- User management (create, list, activate/deactivate)
- Department management
- Category management
- Statistics (memo counts by status, etc.)
- Audit log viewing

**Tips**:
- Only admin users can access
- Add server-side permission check
- Log all admin actions

### 7. PDF Export (LOW PRIORITY)

**Location**: `backend/src/routes/memos.ts`

**What to implement**:
- Generate PDF with memo details
- Include approval history
- Include comments
- Include workflow participants

**Tips**:
- Use a library like `pdfkit` or `puppeteer`
- Sanitize HTML before converting
- Return PDF binary response

## Database Migrations

Create new migration:
```bash
npx prisma migrate dev --name add_new_field
```

This creates migration file and applies it.

Update schema in `backend/prisma/schema.prisma` first, then run the command.

## Testing Workflow

1. **Create Organization** (Admin creates on register)
2. **Create Test Users** via admin panel
3. **Create Memo** as regular user
4. **Submit with Workflow** - select workflow users
5. **Approve as each user** - step by step
6. **View Timeline** - see all actions

## API Development Tips

### Authorization Pattern

```typescript
// Check user belongs to organization
if (req.organizationId !== memo.organizationId) {
  return res.status(403).json({ error: 'Not authorized' });
}

// Check user in workflow
const inWorkflow = await prisma.workflowStep.findFirst({
  where: { memoId, userId: req.userId }
});
```

### Query Patterns with Tenant

```typescript
// Always filter by organization
const memos = await prisma.memo.findMany({
  where: {
    organizationId: req.organizationId,
    // ... other conditions
  }
});
```

### Error Responses

```typescript
// Validation error
res.status(400).json({ error: 'Invalid input' });

// Not found
res.status(404).json({ error: 'Memo not found' });

// Not authorized
res.status(403).json({ error: 'Not authorized' });

// Server error
res.status(500).json({ error: 'Internal server error' });
```

## Frontend Development Tips

### Using Zustand Store

```typescript
const { token, user, isLoggedIn } = useAuthStore();

// Set auth
useAuthStore.getState().setAuth(token, user, org);
```

### Calling API

```typescript
import { memosAPI } from '../services/api';

const memos = await memosAPI.list('inbox');
```

### Loading States

```typescript
const [loading, setLoading] = useState(false);

try {
  setLoading(true);
  // API call
} finally {
  setLoading(false);
}
```

## Common Tasks

### Adding New API Endpoint

1. Create route file: `backend/src/routes/feature.ts`
2. Add to `index.ts`: `app.use('/api/feature', ...)`
3. Add service methods: `frontend/src/services/api.ts`
4. Create page/component: `frontend/src/pages/FeaturePage.tsx`

### Adding Database Model

1. Add to `schema.prisma`
2. Run: `npx prisma migrate dev --name add_model`
3. Update Prisma client usage
4. Create API endpoints for CRUD

### Adding Component

1. Create: `frontend/src/components/MyComponent.tsx`
2. Use TypeScript for props
3. Keep components focused and reusable
4. Handle loading/error states

## Debugging

### Backend Logs

```bash
npm run dev -w backend
# Watch for console.log output
```

### Database Debugging

```bash
npm run db:studio -w backend
# Browse data in GUI
```

### Frontend Errors

Check browser console (F12) for:
- Network errors
- TypeScript errors
- Runtime exceptions

### API Testing

Use curl or Postman:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Performance Optimization

### Database
- Add indexes for frequently queried fields
- Use `.select()` to limit fields returned
- Implement pagination for large lists

### Frontend
- Code splitting with React.lazy()
- Memoize expensive computations
- Lazy load images

### Caching
- Set appropriate cache headers
- Cache API responses locally
- Invalidate on mutations

## Security Checklist

- [ ] All routes have authorization checks
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles)
- [ ] XSS prevention (sanitize HTML)
- [ ] CSRF token if needed
- [ ] Rate limiting configured
- [ ] Secrets in .env.local only
- [ ] No passwords in logs

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/memo-workflow

# Make changes
# Test locally

# Commit
git add .
git commit -m "feat: implement memo workflow"

# Push
git push origin feature/memo-workflow

# Create pull request
```

## Common Issues

### Port Already in Use
```bash
lsof -i :5000
kill -9 <PID>
```

### Module Not Found
```bash
npm install
npm install @types/missing-package
```

### Database Connection Failed
- Check DATABASE_URL
- Ensure PostgreSQL is running
- Check credentials

### CORS Error
- Verify frontend URL in backend
- Check Authorization header format

## Next Steps

1. **Implement Core Workflow**
   - Memo submission with workflow
   - Approval/rejection flow
   - Status tracking

2. **Add Notifications**
   - Create notification center
   - Send on workflow events
   - Mark as read

3. **Implement Search**
   - Full-text search
   - Filters and sorting
   - Authorization checks

4. **Complete Admin Features**
   - User management
   - Department management
   - Reports and statistics

5. **Polish UI**
   - Add error handling components
   - Improve loading states
   - Add animations

6. **Testing**
   - Write unit tests
   - Integration tests
   - E2E tests

7. **Deploy**
   - Set up deployment pipeline
   - Configure production database
   - Set up monitoring

## Additional Resources

- [Prisma Docs](https://www.prisma.io/docs/)
- [Express Docs](https://expressjs.com/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
