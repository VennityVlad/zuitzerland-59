//needs review
# Contributing to Zuitzerland Community Platform

Thank you for your interest in contributing to the Zuitzerland Community Platform! This guide will help you get started with contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct (see CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Supabase account (for development)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/zuitzerland-community-platform.git
   cd zuitzerland-community-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your development environment**
   - Follow the [SETUP.md](./SETUP.md) guide to configure Supabase
   - Copy `supabase/config.toml.example` to `supabase/config.toml`
   - Update `src/lib/config.ts` with your development credentials

4. **Start the development server**
   ```bash
   npm run dev
   ```

## How to Contribute

### Reporting Issues

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** provided in `.github/ISSUE_TEMPLATE/`
3. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details

### Suggesting Features

1. **Check existing feature requests** in issues
2. **Use the feature request template**
3. **Provide clear use cases** and rationale
4. **Consider implementation complexity** and maintenance

### Code Contributions

#### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Follow the coding standards below
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide clear description of changes

#### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add user directory privacy settings
fix: resolve booking form validation issue
docs: update setup guide for new users
```

## Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Define proper types** - avoid `any`
- **Use strict mode** settings
- **Import types explicitly** when needed

### React

- **Use functional components** with hooks
- **Follow React best practices**
- **Use custom hooks** for reusable logic
- **Implement proper error boundaries**

### Styling

- **Use Tailwind CSS** for styling
- **Use semantic tokens** from the design system
- **Avoid hardcoded colors** - use CSS variables
- **Implement responsive design** for all components

### File Organization

- **Create small, focused files** (prefer <50 lines)
- **Use descriptive file names**
- **Group related functionality** in directories
- **Follow existing project structure**

### Code Quality

```typescript
// Good: Clear, typed, and focused
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export const UserProfile = ({ user, onUpdate }: UserProfileProps) => {
  // Component implementation
};

// Avoid: Large, unclear, untyped components
```

### Component Guidelines

1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Always define TypeScript interfaces for props
3. **Error Handling**: Handle loading and error states appropriately
4. **Accessibility**: Include proper ARIA labels and semantic HTML
5. **Performance**: Use React.memo and useCallback when appropriate

### Database Changes

- **Create migrations** for schema changes
- **Test migrations** thoroughly
- **Update RLS policies** as needed
- **Document breaking changes**

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- **Test components** with React Testing Library
- **Test hooks** with appropriate testing utilities
- **Test edge cases** and error conditions
- **Mock external dependencies** appropriately

Example:
```typescript
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

test('displays user name correctly', () => {
  const mockUser = { id: '1', name: 'John Doe' };
  render(<UserProfile user={mockUser} onUpdate={jest.fn()} />);
  
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

## Documentation

### Code Documentation

- **Write clear comments** for complex logic
- **Document component props** with JSDoc
- **Update README** for new features
- **Include usage examples**

### API Documentation

- **Document edge functions** with clear examples
- **Include parameter descriptions**
- **Provide error response examples**
- **Update integration guides**

## Security Considerations

### Before Contributing

- **Review SECURITY.md** guidelines
- **Never commit secrets** or credentials
- **Follow secure coding practices**
- **Test authentication flows**

### Security-Related Changes

- **Get security review** for auth changes
- **Test RLS policies** thoroughly
- **Validate input handling**
- **Consider privacy implications**

## Review Process

### What We Look For

1. **Code Quality**: Clean, readable, well-structured code
2. **Functionality**: Features work as intended
3. **Testing**: Adequate test coverage
4. **Documentation**: Clear documentation and comments
5. **Security**: No security vulnerabilities
6. **Performance**: No performance regressions

### Review Timeline

- **Initial review**: Within 3-5 business days
- **Feedback response**: Please respond within 1 week
- **Final approval**: After all feedback is addressed

## Getting Help

### Resources

- **Setup Issues**: Check [SETUP.md](./SETUP.md)
- **Security Questions**: Review [SECURITY.md](./SECURITY.md)
- **Deployment Help**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

### Communication

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For general questions and ideas
- **Pull Request Comments**: For code-specific discussions

### Community Guidelines

- **Be respectful** and inclusive
- **Provide constructive feedback**
- **Help others learn and grow**
- **Follow the Code of Conduct**

## Recognition

Contributors will be recognized in:
- Project README.md
- Release notes for significant contributions
- GitHub contributor statistics

Thank you for contributing to the Zuitzerland Community Platform! 🎉
