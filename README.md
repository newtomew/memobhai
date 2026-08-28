# Inter-Office Memo Management System

A comprehensive multi-tenant web application for managing internal organizational communications with workflows, approvals, and audit trails.

## Features

- **Multi-tenant Architecture**: Strict data isolation between organizations
- **User Management**: Role-based access control (Admin, User)
- **Memo Workflow**: Sequential approval/review chains with customizable workflows
- **Draft Support**: Save and edit drafts before submission
- **Rich Text Editor**: Format memo content with Tiptap
- **Comments & Discussion**: Add comments at each workflow step
- **Notifications**: Real-time notifications for workflow events
- **Attachment Support**: Upload files to memos
- **Search & Filtering**: Full-text search and advanced filtering
- **Audit Logging**: Complete history of all actions
- **PDF Export**: Export approved memos as PDF
- **Delegation**: Delegate approval authority temporarily
- **Versioning**: Track memo versions through workflow steps

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **React Router** for navigation
- **Zustand** for state management
- **Tiptap** for rich text editing
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **TypeScript**
- **Prisma** ORM for database access
- **JWT** for authentication
- **PostgreSQL** database

### Database
- **PostgreSQL** with Prisma migrations
- Multi-tenant schema with organization isolation

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 12+
- Git

### Setup Instructions

1. **Clone/Extract the Project**
   ```bash
   cd /path/to/memo-management-system
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.local.template .env.local
   ```

   Edit `.env.local` with your configuration:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/memo_system"
   NODE_ENV=development
   PORT=5000
   JWT_SECRET="your_secure_jwt_secret_change_this"
   JWT_EXPIRY="7d"
   VITE_API_URL="http://localhost:5000/api"
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb memo_system

   # Run migrations
   npm run db:migrate -w backend

   # Seed demo data (optional)
   npm run db:seed -w backend
   ```

5. **Start Development Server**
   ```bash
   # Both frontend and backend
   npm run dev

   # Or separately:
   npm run dev -w frontend  # http://localhost:5173
   npm run dev -w backend   # http://localhost:5000/api
   ```

## Project Structure

```
memo-management-system/
├── frontend/                 # React frontend app
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── controllers/      # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   ├── tsconfig.json
│   └── package.json
├── .env.local.template      # Environment variables template
├── package.json             # Root package.json
└── README.md
```

## Database Design

### Key Entities

**Organization (Tenant)**
- Stores organization details
- Enforces data isolation

**User**
- Belongs to an organization and department
- Has roles: admin, user

**Memo**
- Core document for communication
- Tracks status and workflow
- Supports versioning

**WorkflowStep**
- Represents each position in an approval chain
- Tracks action and completion

**Approval**
- Records actions taken (approve, reject, request changes)

**Notification**
- In-app notifications for workflow events

**AuditLog**
- Complete audit trail of system events

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Complete password reset

### Memos
- `GET /api/memos` - List memos (inbox/sent)
- `POST /api/memos` - Create memo
- `GET /api/memos/:id` - Get memo details
- `PUT /api/memos/:id` - Update memo
- `POST /api/memos/:id/submit` - Submit memo
- `POST /api/memos/:id/export-pdf` - Export as PDF

### Workflow Actions
- `POST /api/memos/:id/approve` - Approve memo
- `POST /api/memos/:id/reject` - Reject memo
- `POST /api/memos/:id/request-changes` - Request changes
- `POST /api/memos/:id/forward` - Forward to next step

### Comments
- `POST /api/memos/:id/comments` - Add comment
- `GET /api/memos/:id/comments` - Get all comments

### Attachments
- `POST /api/memos/:id/attachments` - Upload attachment
- `GET /api/memos/:id/attachments/:attachmentId` - Download attachment

### Organization Admin
- `GET /api/admin/organization` - Get org details
- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/departments` - Create department
- `GET /api/admin/categories` - List memo categories

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/:id/read` - Mark as read

## Security

### Authentication
- JWT-based authentication with secure tokens
- Password hashing with bcryptjs
- Secure session management

### Authorization
- Server-side authorization checks
- Role-based access control (RBAC)
- Tenant isolation at database level

### Data Protection
- Parameterized queries to prevent SQL injection
- Input validation with Zod schemas
- CORS protection
- Secure file upload validation

### Audit Trail
- Complete audit log of all actions
- User attribution for every operation
- Timestamp tracking

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables (Production)
Update `.env.local` with production values:
- `NODE_ENV=production`
- `DATABASE_URL=<production_db_url>`
- `JWT_SECRET=<strong_secret>`

### Deploy to Vercel/Railway/Render
1. Push code to Git
2. Connect repository to hosting platform
3. Set environment variables
4. Deploy

## Demonstrations

### Basic Workflow Demo

1. **Create Organization**
   - Sign up with admin account
   - Set organization name and details

2. **Create Users**
   - Add users: Employee, Manager, Finance, Director
   - Assign to departments

3. **Create Memo**
   - Draft memo with subject and content
   - Add attachments

4. **Define Workflow**
   - Select workflow template or create custom
   - Assign users to positions

5. **Submit and Review**
   - Submit memo to workflow
   - Each user reviews and approves/rejects
   - Track status changes

6. **View Notifications**
   - See workflow event notifications
   - Access notifications panel

## Testing Accounts

Default demo accounts (after seeding):

```
Admin Account:
- Email: admin@demo.org
- Password: Demo123!

Employee Account:
- Email: employee@demo.org
- Password: Demo123!

Manager Account:
- Email: manager@demo.org
- Password: Demo123!
```

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env.local
# Run migrations: npm run db:migrate -w backend
```

### Port Already in Use
```bash
# Change PORT in .env.local
# Or kill existing process on port 5000/5173
```

### CORS Errors
```bash
# Ensure VITE_API_URL matches backend URL
# Check backend CORS configuration
```

## Documentation

- **Requirements**: See `CSE226_Summer_26_Project-3.pdf`
- **API Docs**: See `/backend/API.md` (to be created)
- **Database Docs**: See `/backend/DATABASE.md` (to be created)

## Development Notes

### Adding New Features

1. **Update Database Schema**
   - Modify `backend/prisma/schema.prisma`
   - Create migration: `npx prisma migrate dev --name feature_name`

2. **Implement Backend API**
   - Add route in `/backend/src/routes`
   - Add controller logic
   - Add service layer for business logic

3. **Implement Frontend**
   - Create components in `/frontend/src/components`
   - Add API service methods
   - Update Zustand store if needed

4. **Test Thoroughly**
   - Test authorization
   - Test multi-tenant isolation
   - Test error handling

### Code Style

- Use TypeScript for type safety
- Follow REST conventions for APIs
- Use descriptive variable/function names
- Add comments for complex logic

## Known Limitations

- Email notifications not yet implemented (in-app only)
- PDF export uses basic formatting
- Real-time collaboration not supported
- Full-text search requires PostgreSQL configuration

## Support

For issues or questions, refer to the requirements document and system architecture documentation.

## License

Internal project for North South University CSE226 Course.
