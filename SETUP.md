# Complete Setup Instructions

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **PostgreSQL 12+** - Download from [postgresql.org](https://www.postgresql.org/)
- **npm** - Comes with Node.js
- **Git** (optional, for version control)

### Verify Installation

```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 8.0.0 or higher
psql --version    # Should be 12 or higher
```

## Step 1: Extract/Clone the Project

If you have a ZIP file:
```bash
unzip memo-management-system.zip
cd memo-management-system
```

Or if you cloned from GitHub:
```bash
cd memo-management-system
```

## Step 2: Setup Environment Variables

Copy the template:
```bash
cp .env.local.template .env.local
```

Edit `.env.local` with your settings:
```
# Database - important!
DATABASE_URL="postgresql://postgres:password@localhost:5432/memo_system"

# Backend
NODE_ENV=development
PORT=5000
JWT_SECRET="generate_a_random_secret_key_here"
JWT_EXPIRY="7d"

# Frontend
VITE_API_URL="http://localhost:5000/api"
```

### Generate JWT Secret

Linux/Mac:
```bash
openssl rand -base64 32
```

Windows (PowerShell):
```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## Step 3: Setup PostgreSQL Database

### On macOS (Homebrew)

```bash
# Install PostgreSQL if not already installed
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Connect to PostgreSQL
psql postgres
```

### On Windows

1. Run the PostgreSQL installer
2. Remember your password
3. PostgreSQL starts automatically
4. Open Command Prompt and connect:
```bash
psql -U postgres
```

### On Linux (Ubuntu/Debian)

```bash
# Install
sudo apt install postgresql postgresql-contrib

# Start
sudo systemctl start postgresql

# Connect
sudo -u postgres psql
```

### Create Database

Once connected to PostgreSQL:
```sql
CREATE DATABASE memo_system;
\q
```

Verify connection:
```bash
psql -U postgres -d memo_system -c "SELECT version();"
```

## Step 4: Install Dependencies

In project root:
```bash
npm install
```

This installs dependencies for both frontend and backend (workspace setup).

To verify:
```bash
npm list --depth=0
```

## Step 5: Setup Database Schema

Create tables and run migrations:
```bash
npm run db:migrate -w backend
```

You should see:
```
✓ Prisma schema loaded from prisma/schema.prisma
✓ Database connection validated
✓ Generated Prisma Client (v5.x.x)
✓ Migrations complete
```

### Seed Demo Data (Optional)

Add sample organization and users:
```bash
npm run db:seed -w backend
```

This creates:
- Organization: "Demo Company"
- Users with roles and departments
- Memo categories
- Workflow templates

Default credentials:
```
Email: admin@demo.com
Password: Demo123!

Email: employee@demo.com  
Password: Demo123!

Email: manager@demo.com
Password: Demo123!

Email: finance@demo.com
Password: Demo123!
```

## Step 6: Start Development Servers

Start both frontend and backend:
```bash
npm run dev
```

You should see:
```
Frontend: Vite server running at http://localhost:5173
Backend: Server running on port 5000
```

Open in your browser:
- **Frontend**: http://localhost:5173
- **API Health**: http://localhost:5000/health

## Step 7: Login and Test

1. Navigate to http://localhost:5173
2. Click "Register" to create a new organization OR use demo credentials to login
3. Try creating a memo
4. Test the workflow system

## Troubleshooting

### PostgreSQL Connection Error

**Problem**: `error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS
# Or check Services on Windows

# If not running, start it
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS
```

### Database URL Format

Your DATABASE_URL should match your PostgreSQL credentials:
```
postgresql://username:password@host:port/database_name

Example:
postgresql://postgres:mypassword@localhost:5432/memo_system
```

### Port Already in Use

**Problem**: `Port 5000 or 5173 already in use`

**Solution**:
```bash
# Change PORT in .env.local
PORT=5001

# Or kill the process
lsof -i :5000
kill -9 <PID>
```

### Module Not Found Error

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

These are usually resolved after:
1. Saving the file
2. Waiting for TypeScript to recompile
3. Refreshing the browser

If persistent:
```bash
npm run build -w frontend  # Check build errors
npm run build -w backend
```

## Verify Installation

### Frontend Test

1. Go to http://localhost:5173
2. Should see login page
3. Try registering new account

### Backend Test

```bash
# Check health
curl http://localhost:5000/health

# Should return: {"status":"ok"}
```

### Database Test

```bash
npm run db:studio -w backend
```

Opens GUI browser at http://localhost:5555 to view/edit database.

## Next Steps

1. **Read DEVELOPMENT.md** - Guide for implementing features
2. **Read DEPLOYMENT.md** - Guide for deploying to production
3. **Review Requirements** - See CSE226_Summer_26_Project-3.pdf for full requirements
4. **Start Development** - Implement core features from DEVELOPMENT.md

## Common Development Commands

```bash
# Start dev servers
npm run dev

# Build for production
npm run build

# View database GUI
npm run db:studio -w backend

# Create database migration
npx prisma migrate dev --name feature_name

# View database schema
npx prisma studio

# Run specific workspace
npm run dev -w frontend
npm run dev -w backend

# Stop servers
# Press Ctrl+C in terminal
```

## File Structure Reference

```
memo-management-system/
├── .env.local              # Your environment configuration
├── .env.local.template     # Template (don't edit)
├── package.json            # Root workspace config
│
├── frontend/               # React app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API calls
│   │   ├── store/         # State management
│   │   └── App.tsx        # Root component
│   └── package.json       # Frontend config
│
├── backend/               # Express API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Express middleware
│   │   └── index.ts       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Database migrations
│   └── package.json       # Backend config
│
├── README.md              # Project overview
├── DEVELOPMENT.md         # Development guide
├── DEPLOYMENT.md          # Deployment guide
└── SETUP.md              # This file
```

## Getting Help

1. **Error Messages** - Read the error carefully, often tells you exactly what's wrong
2. **Console Output** - Check browser console (F12) for frontend errors
3. **Server Logs** - Watch terminal output for backend errors
4. **Database** - Use `npm run db:studio -w backend` to inspect data
5. **Documentation** - Check DEVELOPMENT.md for implementation guides

## Ready to Code?

Once everything is set up:

1. Open http://localhost:5173 in browser
2. Register and create test data
3. Start implementing features from DEVELOPMENT.md
4. Test thoroughly
5. Deploy to production when ready

Have fun building! 🚀
