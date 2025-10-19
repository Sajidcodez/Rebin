# ReBin Pro Frontend

A modern, secure, and accessible React frontend for the ReBin Pro AI-powered waste sorting application.

## 🚀 Features

### 🔒 Security-First Architecture

- **Input Validation**: Comprehensive Zod schemas for all user inputs
- **XSS Protection**: DOMPurify integration for sanitizing user content
- **CSRF Protection**: Secure token-based CSRF protection
- **Rate Limiting**: Built-in rate limiting for authentication and API calls
- **Secure Authentication**: Enterprise-grade auth with Supabase integration

### 🎨 Design System

- **Consistent UI Components**: Reusable, accessible components
- **Design Tokens**: Centralized color, spacing, and typography system
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode Ready**: Prepared for theme switching

### ⚡ Performance Optimized

- **Code Splitting**: Lazy loading for optimal bundle sizes
- **Memoization**: React.memo and useMemo for efficient rendering
- **Real-time Updates**: Supabase real-time subscriptions
- **Caching**: React Query for intelligent data caching

### ♿ Accessibility Compliant

- **WCAG 2.1 AA**: Full compliance with accessibility standards
- **Screen Reader Support**: Proper ARIA labels and roles
- **Keyboard Navigation**: Complete keyboard accessibility
- **Focus Management**: Proper focus handling and indicators

### 🧪 Comprehensive Testing

- **Unit Tests**: Vitest with React Testing Library
- **Component Tests**: Isolated component testing
- **Integration Tests**: Full user flow testing
- **Coverage Reports**: 80%+ code coverage requirement

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard and stats components
│   ├── ui/              # Reusable UI components
│   └── ...
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication state management
│   └── ToastContext.tsx # Toast notifications
├── lib/                 # Utility libraries
│   ├── security.ts      # Security utilities and validation
│   ├── api.ts          # API client
│   └── utils.ts        # General utilities
├── test/               # Test files
│   ├── setup.ts        # Test configuration
│   └── components/     # Component tests
└── types/              # TypeScript type definitions
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ReBin-1/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Update `.env.local` with your values:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests once
npm run test:run
```

### Test Structure

- **Unit Tests**: Test individual functions and utilities
- **Component Tests**: Test React components in isolation
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user flows (planned)

## 🔧 Available Scripts

| Script                  | Description              |
| ----------------------- | ------------------------ |
| `npm run dev`           | Start development server |
| `npm run build`         | Build for production     |
| `npm run preview`       | Preview production build |
| `npm run lint`          | Run ESLint               |
| `npm test`              | Run tests in watch mode  |
| `npm run test:run`      | Run tests once           |
| `npm run test:coverage` | Run tests with coverage  |
| `npm run test:ui`       | Run tests with UI        |

## 🏗️ Architecture

### Security Architecture

```typescript
// Input validation with Zod
const LoginSchema = z.object({
  email: z.string().email().min(1).max(255),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
});

// XSS protection
const sanitizedInput = XSSProtection.sanitizeText(userInput);

// CSRF protection
const csrfToken = CSRFProtection.generateToken();
```

### Component Architecture

```typescript
// Reusable, accessible components
<FormField label="Email" error={errors.email} required>
  <Input
    type="email"
    value={email}
    onChange={handleChange}
    leftIcon={<Icons.mail />}
    error={!!errors.email}
  />
</FormField>
```

### State Management

```typescript
// Context-based state management
const { user, login, logout, isLoading } = useAuth();
const { addToast, removeToast } = useToast();
```

## 🎨 Design System

### Color Palette

```typescript
export const designTokens = {
  colors: {
    primary: {
      50: "#f0fdf4",
      500: "#22c55e",
      600: "#16a34a",
      900: "#14532d",
    },
    semantic: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },
};
```

### Typography

- **Font Family**: Inter (primary), JetBrains Mono (monospace)
- **Font Sizes**: xs (0.75rem) to 3xl (1.875rem)
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing

- **Scale**: xs (0.25rem) to xl (2rem)
- **Consistent**: 4px base unit system

## 🔐 Security Features

### Input Validation

- **Zod Schemas**: Type-safe validation for all inputs
- **Real-time Validation**: Immediate feedback on form errors
- **Sanitization**: XSS protection for all user content

### Authentication Security

- **Strong Passwords**: Enforced complexity requirements
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Token-based request validation
- **Session Management**: Secure session handling

### Data Protection

- **Input Sanitization**: All user inputs are sanitized
- **Output Encoding**: Safe rendering of dynamic content
- **Secure Headers**: Proper security headers for API requests

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance

- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators

### Implementation Examples

```typescript
// Accessible form field
<FormField
  label="Email Address"
  error={errors.email}
  required
>
  <Input
    type="email"
    aria-describedby={errors.email ? "email-error" : undefined}
    aria-invalid={!!errors.email}
    required
  />
</FormField>

// Accessible button
<Button
  onClick={handleClick}
  aria-label="Submit form"
  disabled={isLoading}
>
  {isLoading ? 'Submitting...' : 'Submit'}
</Button>
```

## 🚀 Performance Features

### Code Splitting

```typescript
// Lazy loading components
const Dashboard = lazy(() => import("./components/Dashboard"));
const Analytics = lazy(() => import("./components/Analytics"));
```

### Memoization

```typescript
// Optimized components
const StatsCard = memo<StatsCardProps>(({ title, value, trend }) => {
  const formattedValue = useMemo(() => {
    return typeof value === "number" ? value.toLocaleString() : value;
  }, [value]);

  const handleClick = useCallback(() => {
    // Handle click
  }, []);

  return <div onClick={handleClick}>{formattedValue}</div>;
});
```

### Real-time Updates

```typescript
// Supabase real-time subscriptions
useEffect(() => {
  const channel = supabase
    .channel("user-stats")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sort_events",
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        // Update stats in real-time
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [user]);
```

## 🧪 Testing Strategy

### Test Types

1. **Unit Tests**: Individual functions and utilities
2. **Component Tests**: React components with user interactions
3. **Integration Tests**: Component interactions and data flow
4. **E2E Tests**: Complete user journeys (planned)

### Test Coverage

- **Target**: 80%+ code coverage
- **Critical Paths**: 100% coverage for authentication and security
- **Components**: All public APIs tested

### Example Test

```typescript
describe("LoginForm", () => {
  it("validates email format", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });
});
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://api.rebinpro.com
```

### Docker Support

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📚 API Integration

### Supabase Integration

```typescript
// Authentication
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Real-time subscriptions
const channel = supabase
  .channel('user-stats')
  .on('postgres_changes', { ... }, callback)
  .subscribe();
```

### REST API Integration

```typescript
// API client with security headers
const apiClient = {
  async infer(file: File, zip?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (zip) formData.append("zip", zip);

    return api.post("/infer", formData, {
      headers: SecurityHeaders.getHeaders(csrfToken),
    });
  },
};
```

## 🔧 Configuration

### ESLint Configuration

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch
3. **Write** tests for new features
4. **Implement** the feature
5. **Run** tests and linting
6. **Submit** a pull request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Zero warnings policy
- **Testing**: 80%+ coverage required
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: All inputs validated and sanitized

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Security**: Report security issues privately to the maintainers

---

**Built with ❤️ for a sustainable future** 🌱♻️
