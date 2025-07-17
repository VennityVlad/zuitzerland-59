# Zuitzerland Community Platform

A comprehensive community management platform built with React, TypeScript, and Supabase. This platform provides event management, user authentication, booking systems, and community features for modern organizations.

## Features

- **Event Management**: Create, manage, and track community events with calendar integration
- **User Authentication**: Multi-provider authentication with role-based access control
- **Booking System**: Room and resource booking with payment integration
- **Community Features**: User directory, team management, and social features
- **Issue Tracking**: Built-in issue reporting and tracking system
- **Admin Dashboard**: Comprehensive administration tools and analytics
- **Mobile Responsive**: Fully responsive design for all devices

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: TanStack Query
- **Authentication**: Supabase Auth + Privy (optional)
- **Payments**: Stripe integration (optional)
- **Deployment**: Vercel, Netlify, or custom hosting

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account and project
- (Optional) Privy account for enhanced authentication
- (Optional) Stripe account for payments

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd zupass-community-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Update `src/lib/config.ts` with your Supabase credentials
3. Copy `supabase/config.toml.example` to `supabase/config.toml` and update with your settings

### 4. Set Up Database

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login and link to your project
supabase login
supabase link --project-ref your-project-ref

# Push database schema
supabase db push
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

## Documentation

### 📚 Complete Setup Guide
See [SETUP.md](./SETUP.md) for detailed step-by-step setup instructions, including:
- Supabase configuration
- Authentication setup
- Database schema deployment
- Edge functions configuration
- Feature flag configuration

### 🔒 Security Guide
See [SECURITY.md](./SECURITY.md) for security best practices:
- Pre-deployment security checklist
- Secret management
- Database security (RLS policies)
- API security guidelines
- Incident response procedures

### 🚀 Deployment Guide
See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment:
- Multiple deployment options (Vercel, Netlify, custom)
- Environment configuration
- Database migrations
- Monitoring and maintenance
- Scaling considerations

## Project Structure

```
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and configuration
│   ├── integrations/       # Third-party integrations
│   └── types/              # TypeScript type definitions
├── supabase/
│   ├── functions/          # Edge functions
│   ├── migrations/         # Database migrations
│   └── config.toml         # Supabase configuration
├── public/                 # Static assets
└── docs/                   # Additional documentation
```

## Key Features

### Event Management
- Create and manage events with rich metadata
- Calendar integration with recurring events
- RSVP tracking and attendee management
- Event comments and co-host functionality

### User System
- Multi-provider authentication
- Role-based access control (Admin, Co-curator, Co-designer, Attendee)
- User profiles with housing preferences
- Team management and organization

### Booking System
- Room and resource booking
- Payment integration with Stripe
- Invoice generation and tracking
- Booking analytics and reporting

### Community Features
- User directory with privacy controls
- Issue reporting and tracking system
- File uploads and management
- Real-time notifications

## Configuration

### Environment Configuration

Update `src/lib/config.ts` with your specific settings:

```typescript
export const config = {
  supabase: {
    url: "https://your-project-ref.supabase.co",
    anonKey: "your-anon-key",
  },
  features: {
    enablePrivyAuth: true,
    enableMeerkatIntegration: false,
    enableFileUploads: true,
    // ... other feature flags
  },
  // ... other configuration
};
```

### Database Configuration

The platform uses Supabase with PostgreSQL. Key tables include:
- `profiles` - User profiles and preferences
- `events` - Event management
- `invoices` - Booking and payment tracking
- `issue_reports` - Issue tracking system
- `locations` - Rooms and resources

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Lint code
npm run lint
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Use semantic CSS tokens from the design system
- Write tests for new features
- Update documentation as needed

## API Integration

The platform integrates with several external services:

- **Supabase**: Database, authentication, storage, edge functions
- **Privy**: Enhanced authentication (optional)
- **Stripe**: Payment processing (optional)
- **Meerkat**: Video conferencing (optional)

## Security

This platform implements multiple security layers:
- Row Level Security (RLS) for database access
- JWT-based authentication
- Role-based authorization
- Input validation and sanitization
- Secure file upload handling

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Check the [SETUP.md](./SETUP.md) for setup issues
- Review [SECURITY.md](./SECURITY.md) for security concerns
- Consult [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment problems
- Open an issue for bugs or feature requests

## Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
