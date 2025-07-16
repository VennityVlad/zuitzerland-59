# Deployment Guide

This guide covers deploying the ZuPass Community Platform to production.

## Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] Updated `src/lib/config.ts` with production values
- [ ] Configured `supabase/config.toml` for production
- [ ] All secrets configured in Supabase
- [ ] Database migrations tested and ready
- [ ] SSL certificates configured

### 2. Security Review

- [ ] Reviewed SECURITY.md guidelines
- [ ] RLS policies tested and verified
- [ ] Authentication flows tested
- [ ] API endpoints secured
- [ ] File upload security verified

### 3. Performance Optimization

- [ ] Database indexes optimized
- [ ] Image assets optimized
- [ ] Bundle size analyzed
- [ ] Caching configured
- [ ] CDN configured (if applicable)

## Deployment Options

### Option 1: Supabase + Vercel (Recommended)

This is the recommended deployment setup for most use cases.

#### Step 1: Prepare Supabase

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login and link to your project
supabase login
supabase link --project-ref your-project-ref

# Deploy database schema
supabase db push

# Deploy edge functions
supabase functions deploy
```

#### Step 2: Configure Supabase Secrets

In your Supabase dashboard → Settings → Functions:

```
PRIVY_APP_ID=your-production-privy-app-id
PRIVY_APP_SECRET=your-production-privy-secret
JWT_SECRET=your-production-jwt-secret
# ... other secrets as needed
```

#### Step 3: Deploy Frontend to Vercel

```bash
# Build the project
npm run build

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

#### Step 4: Configure Domain and SSL

1. Set up custom domain in Vercel
2. Configure SSL certificate
3. Update Supabase Auth settings with production URLs

### Option 2: Supabase + Netlify

#### Step 1: Prepare Build

```bash
npm run build
```

#### Step 2: Deploy to Netlify

```bash
# Using Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Step 3: Configure Redirects

Create `public/_redirects`:

```
/*    /index.html   200
```

### Option 3: Custom Server Deployment

For advanced deployments with custom server requirements.

#### Step 1: Build Static Assets

```bash
npm run build
```

#### Step 2: Configure Web Server

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://your-supabase-url.supabase.co;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Post-Deployment Configuration

### 1. Update Supabase Auth Settings

In Supabase → Authentication → URL Configuration:

```
Site URL: https://your-domain.com
Additional Redirect URLs:
- https://your-domain.com/auth/callback
- https://your-domain.com/
```

### 2. Configure DNS

Update your DNS records to point to your hosting provider:

```
Type: CNAME
Name: your-subdomain
Value: your-hosting-provider-url
```

### 3. Test Production Deployment

- [ ] User registration and login
- [ ] All major features working
- [ ] Mobile responsiveness
- [ ] Performance metrics
- [ ] Error tracking setup

## Environment-Specific Configurations

### Development

```typescript
// src/lib/config.ts
export const config = {
  supabase: {
    url: "https://your-project-ref.supabase.co",
    anonKey: "your-dev-anon-key",
  },
  // ... other dev settings
};
```

### Staging

```typescript
// src/lib/config.ts
export const config = {
  supabase: {
    url: "https://your-staging-project-ref.supabase.co",
    anonKey: "your-staging-anon-key",
  },
  // ... other staging settings
};
```

### Production

```typescript
// src/lib/config.ts
export const config = {
  supabase: {
    url: "https://your-production-project-ref.supabase.co",
    anonKey: "your-production-anon-key",
  },
  // ... other production settings
};
```

## Database Migrations

### Running Migrations

```bash
# Check migration status
supabase migration list

# Apply pending migrations
supabase db push

# Create new migration
supabase migration new your_migration_name
```

### Migration Best Practices

1. **Test migrations in development first**
2. **Backup database before major migrations**
3. **Run migrations during low-traffic periods**
4. **Have rollback plan ready**
5. **Monitor performance after migrations**

## Monitoring and Maintenance

### 1. Set Up Monitoring

#### Supabase Monitoring

- Database performance metrics
- API response times
- Error rates
- Authentication metrics

#### Application Monitoring

```typescript
// Example error tracking setup
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error);
  // Send to your error tracking service
});
```

### 2. Regular Maintenance Tasks

#### Daily
- Check error logs
- Monitor performance metrics
- Verify backup completion

#### Weekly
- Review security logs
- Check database performance
- Update dependencies (if needed)

#### Monthly
- Rotate secrets
- Review access permissions
- Performance optimization
- Security audit

### 3. Backup and Recovery

#### Database Backups

Supabase provides automatic backups, but consider:

```bash
# Manual backup
supabase db dump --file backup.sql

# Restore from backup
supabase db reset --file backup.sql
```

#### File Storage Backups

Set up regular backups of uploaded files:

```typescript
// Example backup script for storage
const backupStorage = async () => {
  const { data: files } = await supabase.storage
    .from('avatars')
    .list();
  
  // Process and backup files
};
```

## Troubleshooting Common Issues

### 1. Authentication Issues

**Problem**: Users can't log in after deployment

**Solution**:
- Check Supabase Auth URL configuration
- Verify JWT secret configuration
- Check CORS settings

### 2. Database Connection Issues

**Problem**: Database queries failing

**Solution**:
- Verify RLS policies are correct
- Check database connection limits
- Review query performance

### 3. File Upload Issues

**Problem**: File uploads not working

**Solution**:
- Check storage bucket permissions
- Verify file size limits
- Review CORS configuration

### 4. Performance Issues

**Problem**: Slow page loads

**Solution**:
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets
- Optimize bundle size

## Scaling Considerations

### Database Scaling

- Monitor query performance
- Add database indexes as needed
- Consider read replicas for high traffic
- Implement connection pooling

### Application Scaling

- Use CDN for static assets
- Implement caching strategies
- Consider server-side rendering
- Monitor bundle size

### Storage Scaling

- Implement CDN for file storage
- Consider multiple storage buckets
- Monitor storage usage
- Implement file cleanup procedures

## Support and Maintenance

### Getting Help

1. Check logs in Supabase dashboard
2. Review error tracking dashboard
3. Consult documentation
4. Contact support team

### Maintenance Windows

Plan regular maintenance windows for:
- Database migrations
- Security updates
- Performance optimizations
- Feature deployments

---

**Note**: Always test deployments in a staging environment before deploying to production.
