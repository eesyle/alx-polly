# ALX Polly - Secure Polling Application

A modern, secure polling application built with Next.js, TypeScript, and Supabase. Create, share, and participate in polls with real-time results and comprehensive security features.

## 🔒 Security First

This application has undergone a comprehensive security audit and implements industry-standard security practices. For detailed security information, see [SECURITY.md](./SECURITY.md).

### Security Highlights
- ✅ **Input Validation & Sanitization** - Comprehensive server-side validation
- ✅ **Authentication & Authorization** - Secure session management with Supabase
- ✅ **Rate Limiting** - Protection against DoS and abuse
- ✅ **Security Headers** - Complete set of security headers including CSP
- ✅ **API Security** - Secure API endpoints with proper validation
- ✅ **XSS Protection** - Input sanitization and CSP implementation
- ✅ **CSRF Protection** - Secure authentication and origin validation

## 🚀 Features

- **Create Polls** - Easy poll creation with multiple options
- **Real-time Voting** - Live vote counting and results
- **User Authentication** - Secure login/registration with Supabase
- **Responsive Design** - Works on all devices
- **Poll Management** - View and manage your polls
- **Security Focused** - Built with security best practices

## 🛠️ Technology Stack

- **Framework:** Next.js 15.5.3 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (Radix UI)
- **Authentication:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **State Management:** React Context API

## 📁 Project Structure

```
├── app/                     # Next.js App Router pages
│   ├── api/                 # API routes
│   │   └── polls/           # Poll-related API endpoints
│   ├── auth/                # Authentication pages
│   ├── polls/               # Poll-related pages
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Home page
├── components/              # Reusable UI components
│   ├── ui/                  # Shadcn UI components
│   ├── navigation.tsx       # Main navigation
│   ├── poll-card.tsx        # Poll display component
│   └── poll-creation-form.tsx # Poll creation form
├── context/                 # React Context providers
│   └── auth-context.tsx     # Authentication context
├── lib/                     # Utility libraries
│   ├── security.ts          # Security utilities and validation
│   ├── supabase.ts          # Supabase client configuration
│   ├── types.ts             # TypeScript type definitions
│   ├── utils.ts             # General utility functions
│   └── mock-data.ts         # Mock data for development
├── middleware.ts            # Next.js middleware for security
├── SECURITY.md              # Security documentation
└── supabase_schema.sql      # Database schema
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd alx-polly
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For enhanced security (production)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_secure_random_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Setup

#### Step-by-step Supabase Configuration:

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization and set project name
   - Select a region close to your users
   - Set a strong database password

2. **Configure Database Schema:**
   ```bash
   # Copy the schema file content
   cat supabase_schema.sql
   ```
   - Navigate to your Supabase project dashboard
   - Go to "SQL Editor"
   - Paste the entire content of `supabase_schema.sql`
   - Click "Run" to execute the schema

3. **Enable Row Level Security (RLS):**
   - Go to "Authentication" → "Policies"
   - Verify that RLS is enabled on all tables:
     - `polls`
     - `poll_options` 
     - `votes`
     - `poll_views`

4. **Configure Authentication Providers:**
   - Go to "Authentication" → "Providers"
   - Enable Email authentication (default)
   - Optional: Enable social providers (Google, GitHub, etc.)
   - Set up email templates if needed

5. **Get API Keys:**
   - Go to "Settings" → "API"
   - Copy your `Project URL` and `anon public` key
   - For production, also copy the `service_role` key (keep secure!)

### 5. Run the Development Server

```bash
# Install dependencies first
npm install

# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

#### Development Server Features:
- **Hot Reload:** Changes are reflected immediately
- **TypeScript Checking:** Real-time type checking
- **Error Overlay:** Detailed error information in development
- **API Routes:** Available at `/api/*` endpoints

## 📖 Usage Examples

### Creating Your First Poll

1. **Register/Login:**
   ```
   Navigate to: http://localhost:3000/auth/register
   - Enter your email and password
   - Verify your email (check spam folder)
   - Login at: http://localhost:3000/auth/login
   ```

2. **Create a Poll:**
   ```
   Navigate to: http://localhost:3000/polls/create
   - Enter poll title: "What's your favorite programming language?"
   - Add description: "Help us understand developer preferences"
   - Add options:
     * JavaScript
     * Python
     * TypeScript
     * Go
   - Set expiration (optional): 7 days from now
   - Click "Create Poll"
   ```

3. **Share Your Poll:**
   ```
   After creation, you'll get a shareable URL:
   http://localhost:3000/polls/[poll-id]
   
   Share this URL with others to collect votes!
   ```

### Voting on Polls

1. **Find Polls:**
   ```
   Navigate to: http://localhost:3000/polls
   - Browse all active polls
   - Click "View Poll" on any poll card
   ```

2. **Cast Your Vote:**
   ```
   On the poll page:
   - Select your preferred option
   - Click "Vote" button
   - View real-time results immediately
   ```

### Managing Your Polls

1. **View Your Polls:**
   ```
   Navigate to: http://localhost:3000/auth/profile
   - See all polls you've created
   - View vote counts and statistics
   - Check poll status (active/expired)
   ```

2. **Poll Analytics:**
   ```
   Each poll shows:
   - Total vote count
   - Percentage breakdown per option
   - Creation and expiration dates
   - Real-time vote updates
   ```

### API Usage Examples

#### Creating a Poll via API

```javascript
// POST /api/polls
const response = await fetch('/api/polls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    title: "Favorite Framework?",
    description: "Choose your preferred web framework",
    options: ["React", "Vue", "Angular", "Svelte"],
    expires_at: "2025-02-01T00:00:00Z", // Optional
    allow_multiple_votes: false,
    is_anonymous: false
  })
});

const poll = await response.json();
console.log('Poll created:', poll);
```

#### Voting via API

```javascript
// POST /api/polls/[id]/vote
const response = await fetch(`/api/polls/${pollId}/vote`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    option_id: selectedOptionId
  })
});

const result = await response.json();
console.log('Vote submitted:', result);
```

#### Fetching Poll Results

```javascript
// GET /api/polls/[id]
const response = await fetch(`/api/polls/${pollId}`);
const pollData = await response.json();

console.log('Poll results:', {
  title: pollData.title,
  totalVotes: pollData.total_votes,
  options: pollData.options.map(option => ({
    text: option.option_text,
    votes: option.vote_count,
    percentage: (option.vote_count / pollData.total_votes * 100).toFixed(1)
  }))
});
```

### Component Usage Examples

#### Using PollCard Component

```tsx
import { PollCard } from '@/components/poll-card';

function PollsList({ polls }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {polls.map(poll => (
        <PollCard 
          key={poll.id} 
          poll={poll} 
          className="hover:shadow-lg transition-shadow"
        />
      ))}
    </div>
  );
}
```

#### Using Poll Creation Form

```tsx
import { PollCreationForm } from '@/components/poll-creation-form';

function CreatePollPage() {
  const handlePollCreated = (poll) => {
    console.log('New poll created:', poll);
    // Redirect to poll page or show success message
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1>Create New Poll</h1>
      <PollCreationForm onPollCreated={handlePollCreated} />
    </div>
  );
}
```

## 🔐 Security Features

### Input Validation
- **Server-side validation** for all user inputs
- **Character limits** and format validation
- **XSS prevention** through input sanitization
- **SQL injection prevention** through parameterized queries

### Authentication & Authorization
- **Secure session management** with Supabase
- **Route protection** with enhanced middleware
- **Server-side authentication validation**
- **Proper error handling** for auth failures

### Rate Limiting
- **Configurable rate limits** for different endpoints
- **IP-based tracking** for anonymous users
- **Graceful degradation** with proper error messages

### API Security
- **Comprehensive input validation** for all API endpoints
- **Authentication requirements** for sensitive operations
- **Error handling** without information disclosure
- **Security logging** for monitoring

## 🧪 Testing

### Test Suite Overview

The application includes comprehensive testing covering:
- **Unit Tests:** Component and function testing
- **Integration Tests:** API endpoint and database testing  
- **Security Tests:** Vulnerability and attack prevention testing
- **End-to-End Tests:** Complete user workflow testing

### Running Tests

#### Basic Test Commands

```bash
# Run all tests
npm test
# or
yarn test
# or
pnpm test

# Run tests in watch mode (development)
npm run test:watch
# or
yarn test:watch

# Run tests with coverage report
npm run test:coverage
# or
yarn test:coverage

# Run specific test file
npm test -- poll-creation-form.test.tsx
# or
yarn test poll-creation-form.test.tsx
```

#### Test Types and Examples

##### 1. Component Tests

```bash
# Run component tests
npm test -- --testPathPattern=components

# Example: Testing PollCard component
npm test -- poll-card.test.tsx
```

**Test Coverage:**
- Rendering with different props
- User interactions (clicks, form submissions)
- State management and updates
- Error handling and edge cases

##### 2. API Integration Tests

```bash
# Run API tests
npm test -- --testPathPattern=api

# Example: Testing poll creation endpoint
npm test -- poll-creation.integration.test.tsx
```

**Test Coverage:**
- Authentication and authorization
- Input validation and sanitization
- Database operations
- Error responses and status codes

##### 3. Security Tests

```bash
# Run security-specific tests
npm test -- --testPathPattern=security

# Run XSS prevention tests
npm test -- xss-prevention.test.tsx

# Run rate limiting tests
npm test -- rate-limiting.test.tsx
```

**Security Test Coverage:**
- **Input Validation:** SQL injection, XSS, malformed data
- **Authentication:** Bypass attempts, token validation
- **Authorization:** Access control, privilege escalation
- **Rate Limiting:** DoS protection, abuse prevention
- **CSRF Protection:** Cross-site request forgery prevention

##### 4. End-to-End Tests

```bash
# Run E2E tests (requires running application)
npm run test:e2e
# or
yarn test:e2e

# Run E2E tests in headless mode
npm run test:e2e:headless
```

**E2E Test Scenarios:**
- Complete user registration and login flow
- Poll creation and sharing workflow
- Voting and results viewing process
- Profile management and poll analytics

### Test Configuration

#### Jest Configuration

The project uses Jest with the following setup:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
  ],
};
```

#### Test Environment Setup

```bash
# Create test environment file
cp .env.local .env.test.local

# Add test-specific variables
echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321" >> .env.test.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=test_anon_key" >> .env.test.local
```

### Writing Tests

#### Component Test Example

```tsx
// components/__tests__/poll-card.test.tsx
import { render, screen } from '@testing-library/react';
import { PollCard } from '../poll-card';

const mockPoll = {
  id: '1',
  title: 'Test Poll',
  description: 'Test Description',
  total_votes: 5,
  created_at: '2025-01-01T00:00:00Z',
  expires_at: null,
};

describe('PollCard', () => {
  it('renders poll information correctly', () => {
    render(<PollCard poll={mockPoll} />);
    
    expect(screen.getByText('Test Poll')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('5 votes')).toBeInTheDocument();
  });

  it('handles click events properly', async () => {
    const user = userEvent.setup();
    render(<PollCard poll={mockPoll} />);
    
    const viewButton = screen.getByText('View Poll');
    await user.click(viewButton);
    
    // Assert navigation or state changes
  });
});
```

#### API Test Example

```tsx
// app/api/polls/__tests__/route.test.ts
import { POST } from '../route';
import { createMocks } from 'node-mocks-http';

describe('/api/polls', () => {
  it('creates a poll with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: 'Test Poll',
        options: ['Option 1', 'Option 2'],
      },
    });

    await POST(req);
    
    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.title).toBe('Test Poll');
  });

  it('rejects invalid input', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: '', // Invalid: empty title
        options: ['Option 1'],
      },
    });

    await POST(req);
    
    expect(res._getStatusCode()).toBe(400);
  });
});
```

### Continuous Integration

#### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:security
      - run: npm run build
```

### Test Coverage Goals

- **Unit Tests:** > 90% coverage
- **Integration Tests:** All API endpoints
- **Security Tests:** All attack vectors
- **E2E Tests:** Critical user paths

### Debugging Tests

```bash
# Run tests with debugging
npm test -- --verbose

# Run single test with debugging
npm test -- --testNamePattern="specific test name" --verbose

# Debug with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 🚀 Deployment

### Production Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_secure_random_secret
NEXTAUTH_URL=https://your-domain.com
```

### Deployment Checklist
- [ ] Set up production environment variables
- [ ] Configure Supabase for production
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure security headers
- [ ] Test all security features

### Deploy on Vercel
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

For other platforms, ensure:
- Node.js 18+ support
- Environment variable configuration
- HTTPS enabled
- Security headers configured

## 📊 Database Schema

The application uses the following main tables:
- **polls** - Poll information and metadata
- **poll_options** - Individual poll options
- **votes** - User votes on polls
- **poll_views** - Analytics for poll views

All tables have Row Level Security (RLS) enabled for data protection.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Security Contributions
For security-related contributions:
- Follow responsible disclosure practices
- Include security impact assessment
- Add appropriate tests
- Update security documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** Check this README and [SECURITY.md](./SECURITY.md)
- **Issues:** Open an issue on GitHub
- **Security:** For security issues, see [SECURITY.md](./SECURITY.md)

## 🔄 Changelog

### v1.0.0 (January 2025)
- Initial release with comprehensive security features
- Complete security audit and vulnerability fixes
- Secure API endpoints implementation
- Enhanced authentication and authorization
- Rate limiting and security headers

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Supabase](https://supabase.com/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Shadcn UI](https://ui.shadcn.com/) for UI components
- Security community for best practices and guidelines

---

**Built with ❤️ and 🔒 by the ALX Polly Team**
