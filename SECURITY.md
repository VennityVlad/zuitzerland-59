# Security Guide

This document outlines security considerations and best practices for deploying the ZuPass Community Platform.

## Security Overview

The platform implements multiple layers of security:

1. **Authentication**: Multi-provider authentication with Privy and Supabase
2. **Authorization**: Role-based access control with Row Level Security
3. **Data Protection**: Encrypted data storage and secure API endpoints
4. **Input Validation**: Client and server-side validation
5. **Secure Configuration**: Environment-specific configuration management

## Pre-Deployment Security Checklist

### 1. Configuration Security

- [ ] Replace all placeholder values in `src/lib/config.ts`
- [ ] Ensure no hardcoded secrets in the codebase
- [ ] Verify `config.toml` contains your project-specific settings
- [ ] Remove or secure any test/demo data

### 2. Database Security

- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Verify RLS policies are correctly configured
- [ ] Test access controls with different user roles
- [ ] Ensure sensitive data is properly encrypted
- [ ] Set up database backup and recovery procedures

### 3. Authentication & Authorization

- [ ] Configure proper redirect URLs in Supabase Auth settings
- [ ] Test authentication flows thoroughly
- [ ] Verify JWT token expiration and refresh logic
- [ ] Review and test all role-based permissions
- [ ] Ensure admin access is properly restricted

### 4. API Security

- [ ] All edge functions have proper authentication
- [ ] Rate limiting configured where appropriate
- [ ] Input validation on all API endpoints
- [ ] Error handling doesn't expose sensitive information
- [ ] CORS configured correctly for production

### 5. File Upload Security

- [ ] File type validation implemented
- [ ] File size limits enforced
- [ ] Virus scanning configured (if applicable)
- [ ] Storage bucket permissions correctly set
- [ ] File access controls working properly

## Secret Management

### Required Secrets

Configure these in Supabase → Settings → Functions:

```
# Authentication
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
JWT_SECRET=your-jwt-secret-256-bits

# Database
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional Services
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-secret
MEERKAT_AUTH_SECRET=your-meerkat-secret
```

### Secret Rotation

- Rotate secrets regularly (every 90 days recommended)
- Use strong, randomly generated secrets
- Never commit secrets to version control
- Use different secrets for different environments
- Monitor secret usage and access logs

## Database Security

### Row Level Security Policies

Key RLS policies implemented:

```sql
-- Example: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Example: Admin-only table access
CREATE POLICY "Admin access only" ON admin_table
FOR ALL USING (is_admin_user());
```

### Security Functions

The platform includes security helper functions:

- `is_admin_user()` - Check if user has admin role
- `get_user_role()` - Get current user's role
- `has_role(user_id, role)` - Check specific role permissions

## API Security

### Edge Function Security

All edge functions include:
- CORS headers properly configured
- Input validation and sanitization
- Authentication checks where required
- Rate limiting (where applicable)
- Error handling that doesn't expose internals

### Example Secure Edge Function

```typescript
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    // Input validation
    const body = await req.json();
    if (!body.requiredField) {
      throw new Error('Missing required field');
    }

    // Process request...
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Safe error handling
    return new Response(
      JSON.stringify({ error: 'Request failed' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

## Production Deployment

### Environment Configuration

1. **Development Environment**:
   - Use `http://localhost:3000` for site URLs
   - Enable debug logging
   - Use test API keys where applicable

2. **Production Environment**:
   - Use HTTPS for all URLs
   - Disable debug logging
   - Use production API keys
   - Enable monitoring and alerting

### SSL/TLS Configuration

- Ensure HTTPS is enforced
- Use strong SSL certificates
- Configure proper security headers
- Enable HSTS (HTTP Strict Transport Security)

### Monitoring and Alerting

Set up monitoring for:
- Failed authentication attempts
- API error rates
- Database connection issues
- Edge function failures
- File upload anomalies

## Incident Response

### Security Incident Checklist

1. **Immediate Response**:
   - Identify and isolate affected systems
   - Preserve evidence and logs
   - Notify relevant stakeholders

2. **Investigation**:
   - Analyze logs and system behavior
   - Determine scope and impact
   - Identify root cause

3. **Recovery**:
   - Implement fixes and patches
   - Restore systems from clean backups if needed
   - Verify system integrity

4. **Post-Incident**:
   - Document lessons learned
   - Update security procedures
   - Implement additional safeguards

## Regular Security Maintenance

### Monthly Tasks

- [ ] Review user access and permissions
- [ ] Check for failed authentication attempts
- [ ] Review API usage and error logs
- [ ] Update dependencies and security patches
- [ ] Test backup and recovery procedures

### Quarterly Tasks

- [ ] Rotate secrets and API keys
- [ ] Review and update RLS policies
- [ ] Conduct security testing
- [ ] Update documentation
- [ ] Review and update monitoring alerts

## Security Contact

For security issues or questions:
- Review this documentation
- Check Supabase security documentation
- Contact your security team
- Report vulnerabilities responsibly

## Additional Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/auth)
- [OWASP Security Guidelines](https://owasp.org/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)