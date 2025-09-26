# ALX Polly Project Rules and Conventions

## Project Overview
ALX Polly is a Next.js-based polling application with Supabase authentication. This document outlines the project's coding standards, architecture patterns, and development guidelines.

## Technology Stack
- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (based on Radix UI)
- **Authentication**: Supabase
- **State Management**: React Context API

## Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── auth/             # Authentication-related pages
│   ├── polls/            # Poll-related pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Home page
├── components/           # Reusable UI components
│   ├── ui/               # Shadcn UI components
│   └── navigation.tsx    # Main navigation component
├── context/              # React Context providers
│   └── auth-context.tsx  # Authentication context
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client configuration
│   └── utils.ts          # General utility functions
├── public/               # Static assets
└── middleware.ts         # Next.js middleware for route protection
```

## Coding Conventions

### TypeScript
- Use strict type checking
- Define interfaces/types for all props and state
- Use type inference where appropriate
- Follow the TypeScript configuration in `tsconfig.json`

### Component Structure
- Use functional components with hooks
- Add 'use client' directive for client-side components
- Follow the component naming convention: PascalCase for components
- Export components as named exports when possible

### Authentication
- Use the `useAuth` hook for authentication-related functionality
- Protected routes are defined in `middleware.ts`
- Authentication state is managed through the AuthContext

### Styling
- Use Tailwind CSS for styling
- Follow utility-first approach
- Use Shadcn UI components when available
- Maintain responsive design patterns (e.g., `hidden md:flex`)

### File Organization
- Group related files by feature (auth, polls)
- Use absolute imports with `@/` prefix
- Keep components focused on a single responsibility

### Environment Variables
- Store sensitive information in `.env.local`
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Validate environment variables at startup

## Development Workflow

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run the development server: `npm run dev`

### Adding New Features
1. Create necessary components in the `components` directory
2. Add new pages in the appropriate `app` directory
3. Update types and context providers as needed
4. Test the feature locally

### Authentication Implementation
- Use Supabase authentication methods
- Implement route protection through middleware
- Update UI based on authentication state

## Best Practices

### Performance
- Use Next.js features for optimization (Image component, etc.)
- Implement code splitting where appropriate
- Minimize unnecessary re-renders

### Accessibility
- Use semantic HTML elements
- Ensure proper keyboard navigation
- Maintain appropriate color contrast

### Security
- Validate user input
- Implement proper authentication checks
- Use environment variables for sensitive information

### Error Handling
- Implement proper error boundaries
- Display user-friendly error messages
- Log errors appropriately

### Code Quality
- Lint code with flake8 before committing
- Follow PEP 8 style guidelines for Python code
- Maintain a maximum line length of 100 characters
- Run flake8 checks as part of the CI/CD pipeline

### TypeScript/JavaScript Linting
- Use ESLint with the TypeScript parser for static code analysis
- Follow Airbnb's JavaScript Style Guide as a base configuration
- Enforce consistent code formatting with Prettier
- Run linting as a pre-commit hook using husky
- Key rules to enforce:
  - No unused variables or imports
  - Consistent use of single quotes for strings
  - Proper spacing and indentation (2 spaces)
  - Semicolons at the end of statements
  - No console.log statements in production code
  - Proper error handling for promises
  - Descriptive variable and function names

## Deployment

### Build Process
- Run `npm run build` to create a production build
- Use `npm start` to run the production server

### Environment Configuration
- Ensure all required environment variables are set in production
- Configure Supabase authentication settings for production