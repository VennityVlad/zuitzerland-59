# Setup Guide

This guide will help you set up the ZuPass Community Platform for your own use.

## Prerequisites

- Supabase account and project
- Node.js 18+ installed
- (Optional) Privy account for enhanced authentication
- (Optional) Stripe account for payments

## Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Note your project URL and anon key from the API settings
3. Save these for configuration later

### 2. Configure the Application

#### Update `src/lib/config.ts`

Replace the placeholder values with your actual Supabase credentials:

```typescript
export const config = {
  supabase: {
    url: "https://your-project-ref.supabase.co", // Your project URL
    anonKey: "your-anon-key-here", // Your anon key
  },
  // ... keep other settings as needed
};
```

#### Update `supabase/config.toml`

```toml
project_id = "your-project-id"

[auth]
site_url = "http://localhost:3000"  # Your local development URL
additional_redirect_urls = ["https://your-production-domain.com"]
```

### 3. Set Up Database Schema

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push database schema
supabase db push
```

#### Option B: Manual Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL files from `supabase/migrations/` in order

### 4. Configure Authentication

#### Basic Supabase Auth

Authentication is configured by default. Users can sign up with email/password.

#### Enhanced Privy Integration (Optional)

1. Create a Privy account at [privy.io](https://privy.io)
2. Get your Privy App ID and Secret
3. Add them to Supabase secrets:
   - `PRIVY_APP_ID`
   - `PRIVY_APP_SECRET`

### 5. Set Up Edge Functions

The application uses several edge functions for server-side logic. These are deployed automatically, but you need to configure secrets:

#### Required Secrets

Go to your Supabase project → Settings → Functions and add:

```
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
JWT_SECRET=your-jwt-secret-key
```

#### Optional Secrets (for full functionality)

```
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-secret-key
MEERKAT_AUTH_SECRET=your-meerkat-secret
REQUEST_FINANCE_API_KEY=your-request-finance-key
ZAPIER_WEBHOOK_URL=your-zapier-webhook
```

### 6. Configure Storage (Optional)

If you want file uploads:

1. Go to Supabase → Storage
2. Create buckets as needed:
   - `avatars` (public)
   - `team-logos` (public)
   - `issue_attachments` (private)

### 7. Set Up Row Level Security

The migrations include RLS policies, but verify they're active:

1. Go to Supabase → Authentication → Policies
2. Ensure policies are enabled for all tables
3. Test with different user roles

### 8. Configure Feature Flags

In `src/lib/config.ts`, enable/disable features:

```typescript
features: {
  enableMeerkatIntegration: true,    // Video conferencing
  enablePrivyAuth: true,             // Enhanced authentication
  enableFileUploads: true,           // File upload functionality
  enableDirectoryFeature: true,      // User directory
  enableOnboardingFlow: true,        // User onboarding
}
```

### 9. Test Your Setup

1. Start the development server:
```bash
npm run dev
```

2. Test key functionality:
   - User registration/login
   - Event creation
   - Booking system
   - Profile management

### 10. Production Deployment

#### Update Configuration

1. Update `src/lib/config.ts` with production URLs
2. Update `supabase/config.toml` with production domain
3. Configure production secrets in Supabase

#### Deploy Database

```bash
supabase db push --linked
```

#### Deploy Edge Functions

```bash
supabase functions deploy
```

#### Build and Deploy Frontend

```bash
npm run build
# Deploy the dist folder to your hosting platform
```

## Troubleshooting

### Common Issues

1. **"Configuration errors" on startup**
   - Check that `src/lib/config.ts` has valid Supabase credentials
   - Ensure your Supabase project is active

2. **Authentication not working**
   - Verify site URL in Supabase Auth settings
   - Check redirect URLs are configured correctly

3. **Database connection issues**
   - Ensure database migrations have been run
   - Check RLS policies are properly configured

4. **Edge function errors**
   - Verify secrets are configured in Supabase
   - Check function logs in Supabase dashboard

### Getting Help

1. Check the main README.md for general information
2. Look at the database schema in `src/integrations/supabase/types.ts`
3. Review edge function code in `supabase/functions/`
4. Check Supabase logs for detailed error messages

## Next Steps

After setup:
1. Customize the UI/branding to match your community
2. Configure additional integrations as needed
3. Set up monitoring and analytics
4. Train your team on administration features

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Production secrets configured
- [ ] HTTPS enabled in production
- [ ] Authentication redirect URLs configured
- [ ] File upload policies tested
- [ ] Admin access properly restricted
