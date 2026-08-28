# Deployment Guide

This guide covers deploying the Memo Management System to production.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Build completes without errors
- [ ] Security review completed
- [ ] HTTPS certificate ready
- [ ] Database backups configured
- [ ] Monitoring set up

## Deployment Options

### Option 1: Railway.app (Recommended)

Railway is the easiest option for full-stack deployment with PostgreSQL.

**Steps:**

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/memo-system.git
   git push -u origin main
   ```

2. **Create Railway Project**
   - Go to railway.app
   - Create new project
   - Select "Deploy from GitHub"
   - Connect your repository

3. **Add PostgreSQL**
   - In Railway dashboard, add PostgreSQL plugin
   - Note the DATABASE_URL

4. **Configure Environment Variables**
   - In Railway project settings, add:
     ```
     NODE_ENV=production
     PORT=5000
     DATABASE_URL=<from_postgresql>
     JWT_SECRET=<generate_strong_secret>
     FRONTEND_URL=<your_railway_domain>
     ```

5. **Configure Build**
   - Backend root: `/backend`
   - Frontend root: `/frontend`
   - Build command: `npm run build -w backend`
   - Start command: `npm start -w backend`

6. **Deploy**
   - Railway will auto-deploy on git push

### Option 2: Vercel + Railway

Deploy frontend to Vercel and backend to Railway.

**Frontend (Vercel):**
1. Deploy frontend repo to Vercel
2. Set environment variables:
   ```
   VITE_API_URL=<railway_backend_url>
   ```

**Backend (Railway):**
- Follow Option 1 for backend only

### Option 3: Self-Hosted (VPS)

Deploy on a VPS like Digital Ocean, Linode, or AWS EC2.

**Requirements:**
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+
- PostgreSQL 12+
- Nginx/Apache
- SSL certificate

**Steps:**

1. **SSH to server**
   ```bash
   ssh root@your-server-ip
   ```

2. **Update system**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt install -y nodejs postgresql postgresql-contrib nginx
   ```

4. **Clone repository**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/memo-system.git
   cd memo-system
   ```

5. **Setup environment**
   ```bash
   cp .env.local.template .env.local
   nano .env.local  # Edit with production values
   ```

6. **Setup database**
   ```bash
   sudo -u postgres createdb memo_system
   npm run db:migrate -w backend
   npm run db:seed -w backend
   ```

7. **Build application**
   ```bash
   npm install
   npm run build
   ```

8. **Setup PM2 (process manager)**
   ```bash
   npm install -g pm2
   pm2 start "npm start -w backend" --name memo-api
   pm2 save
   pm2 startup
   ```

9. **Configure Nginx**
   Create `/etc/nginx/sites-available/memo-system`:
   ```nginx
   upstream backend {
     server 127.0.0.1:5000;
   }

   server {
     listen 80;
     server_name your-domain.com;
     return 301 https://$server_name$request_uri;
   }

   server {
     listen 443 ssl http2;
     server_name your-domain.com;

     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

     # Frontend
     location / {
       root /var/www/memo-system/frontend/dist;
       try_files $uri $uri/ /index.html;
     }

     # Backend API
     location /api {
       proxy_pass http://backend;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

10. **Enable site**
    ```bash
    ln -s /etc/nginx/sites-available/memo-system /etc/nginx/sites-enabled/
    nginx -t
    systemctl restart nginx
    ```

11. **Setup SSL with Certbot**
    ```bash
    apt install certbot python3-certbot-nginx
    certbot --nginx -d your-domain.com
    ```

## Database Migrations

Run migrations before first startup:

```bash
npm run db:migrate -w backend
```

Seed demo data (optional):
```bash
npm run db:seed -w backend
```

## Monitoring

### Logs

**Railway:** View in dashboard
**VPS with PM2:** 
```bash
pm2 logs memo-api
pm2 monit
```

### Health Check

```bash
curl https://your-domain.com/health
```

Should return:
```json
{"status": "ok"}
```

### Database

Monitor with Prisma Studio (development only):
```bash
npm run db:studio -w backend
```

## Backup Strategy

### Database Backups

**PostgreSQL:**
```bash
# Daily backup
pg_dump memo_system > backup_$(date +%Y%m%d).sql

# With cron job
0 2 * * * /usr/bin/pg_dump memo_system > /backups/memo_$(date +\%Y\%m\%d).sql
```

**Upload to S3:**
```bash
aws s3 cp backup_*.sql s3://your-bucket/backups/
```

### Application Backups

- Keep git repository backed up
- Archive old deployments
- Document all configurations

## Updates

### Updating Application

```bash
cd /var/www/memo-system
git pull origin main
npm install
npm run build
npm run db:migrate -w backend  # If schema changed
pm2 restart memo-api
```

### Database Updates

Always backup before updating:
```bash
pg_dump memo_system > pre-update-backup.sql
```

## Troubleshooting

### Port Already in Use

```bash
lsof -i :5000
kill -9 <PID>
```

### Database Connection Error

Check PostgreSQL is running:
```bash
systemctl status postgresql
psql -U postgres -d memo_system
```

### CORS Errors

Ensure environment variables match:
- `FRONTEND_URL` in backend
- `VITE_API_URL` in frontend

### Out of Memory

Check system resources:
```bash
free -h
top
```

Increase if needed or optimize queries.

## Performance Tuning

### Database

1. Add indexes for frequent queries
2. Enable connection pooling
3. Configure appropriate shared_buffers

### Application

1. Enable gzip compression in Nginx
2. Implement caching headers
3. Use CDN for static assets
4. Monitor response times

## Security

### SSL/TLS

- Force HTTPS redirect
- Use modern TLS 1.2+
- Configure HSTS headers

### Rate Limiting

Add to Nginx:
```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req zone=general burst=20 nodelay;
```

### Dependencies

Regular updates:
```bash
npm audit fix
npm update
```

## Support

For deployment issues:
- Check Railway/VPS provider documentation
- Review application logs
- Verify environment variables
- Check database connectivity

## Rollback

### Railway

Automatic rollback available in dashboard.

### VPS

```bash
git revert <commit-hash>
npm run build
pm2 restart memo-api
```

Store backups for faster rollback.
