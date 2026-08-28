# Quick Start Guide

Get the Memo Management System running in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running
- npm installed

## 1. Download/Extract Project

```bash
cd /path/to/memo-management-system
```

## 2. Setup Environment

```bash
# Copy template
cp .env.local.template .env.local

# Edit .env.local - replace DATABASE_URL with your PostgreSQL connection
# Example: postgresql://postgres:password@localhost:5432/memo_system
```

## 3. Install Dependencies (2 minutes)

```bash
npm install
```

## 4. Setup Database (2 minutes)

```bash
# Create database and tables
npm run db:migrate -w backend

# Add demo data (optional)
npm run db:seed -w backend
```

## 5. Start Development (1 minute)

```bash
npm run dev
```

You'll see:
```
Frontend: http://localhost:5173
Backend: http://localhost:5000/api
```

## 6. Open in Browser

```
http://localhost:5173
```

## Login with Demo Credentials (if you seeded data)

```
Email: admin@demo.com
Password: Demo123!
```

Or create a new account by registering.

## What's Working Now

✅ User registration and login
✅ Organization management
✅ Multi-tenant isolation
✅ User authentication
✅ Dashboard with basic layout

## What Needs Implementation

- [ ] Memo creation & management
- [ ] Workflow approval system
- [ ] Notifications
- [ ] Search & filtering
- [ ] Admin features
- And more... (see PROJECT_STATUS.md)

## Essential Commands

```bash
# Start dev servers
npm run dev

# Build for production
npm run build

# View database GUI
npm run db:studio -w backend

# Create new migration (after schema change)
npx prisma migrate dev --name your_migration_name

# Run frontend only
npm run dev -w frontend

# Run backend only  
npm run dev -w backend

# Stop servers
Ctrl+C
```

## File Structure

```
src/
├── pages/         ← Add new page components
├── components/    ← Add reusable components
├── services/      ← API calls
├── store/         ← State management
└── App.tsx        ← Root component

backend/src/
├── routes/        ← API endpoints (add implementations)
├── middleware/    ← Express middleware
└── index.ts       ← Server entry point

backend/prisma/
├── schema.prisma  ← Database schema
└── migrations/    ← Auto-generated migrations
```

## Common Issues & Fixes

### "Cannot connect to database"
- Check PostgreSQL is running
- Verify DATABASE_URL in .env.local
- Make sure memo_system database exists

### "Port 5000/5173 already in use"
- Change PORT in .env.local
- Or kill existing process: `lsof -i :5000`

### "Module not found"
```bash
rm -rf node_modules
npm install
```

### "TypeScript errors"
Usually go away after:
1. Saving file
2. Waiting for compilation
3. Refreshing browser

## Next Steps

1. **Read SETUP.md** for detailed setup instructions
2. **Read DEVELOPMENT.md** for implementation guidance
3. **Check PROJECT_STATUS.md** for what needs doing
4. **Start coding!** Focus on memo management first

## Implementation Checklist

For each feature, implement in this order:

```
1. Backend Route
   └─ Add to backend/src/routes/

2. API Service
   └─ Add to frontend/src/services/api.ts

3. Frontend Component
   └─ Add to frontend/src/pages/ or components/

4. Test Manually
   └─ Use the UI to test the feature
```

## Need Help?

- **Setup issues** → See SETUP.md
- **Development questions** → See DEVELOPMENT.md  
- **Deployment** → See DEPLOYMENT.md
- **Project status** → See PROJECT_STATUS.md
- **Requirements** → See CSE226_Summer_26_Project-3.pdf

## Current Progress

```
Phase 1: Foundation ✅ COMPLETE
- Project structure
- Database schema
- Authentication basics
- Frontend scaffolding

Phase 2: Core Features 🚀 IN PROGRESS
- Memo management (TODO)
- Workflow system (TODO)
- Notifications (TODO)

Phase 3: Polish 📋 PLANNED
- Search & filtering
- Admin features
- PDF export
- Deployment
```

**Ready to start coding? Go to DEVELOPMENT.md and implement memos first!**
