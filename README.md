# ReBin Pro - AI-Powered Waste Sorting Application

ReBin Pro is a comprehensive AI-powered waste sorting application that helps users make environmentally conscious decisions about waste disposal. The application combines computer vision, machine learning, and real-time data to provide accurate sorting guidance and track environmental impact.

## 🌟 Features

### Core Functionality

- **AI-Powered Image Recognition**: Upload or capture photos of waste items for instant classification
- **Local Policy Integration**: Get sorting guidance based on your ZIP code's specific recycling policies
- **Real-time Processing**: Fast image analysis with Cloudflare Workers for optimal performance
- **Environmental Impact Tracking**: Monitor your CO₂ savings and environmental contribution

### Community Features

- **Leaderboards**: Compete with other users and track your ranking across different time periods and categories
- **Challenges**: Participate in community challenges to increase engagement and earn rewards
- **Achievements**: Earn badges and points for sustainable actions with a comprehensive achievement system
- **Real-time Updates**: Live statistics and community activity feeds with real-time notifications
- **Social Engagement**: Connect with other users, share achievements, and participate in community events

### User Experience

- **Progressive Web App (PWA)**: Install on mobile devices for offline functionality
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG 2.1 AA compliant interface
- **Multi-language Support**: Internationalization ready

### Advanced Features

- **Offline Mode**: Core functionality works without internet connection
- **Push Notifications**: Stay updated on challenges and achievements
- **Analytics Dashboard**: Comprehensive insights into your recycling habits
- **Social Sharing**: Share your environmental impact with friends

## 🏗️ Architecture

### Frontend (React/TypeScript)

- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with custom components
- **State Management**: React Query for server state, Zustand for client state
- **Real-time**: Supabase real-time subscriptions
- **PWA**: Service Worker with offline capabilities

### Backend (FastAPI/Python)

- **Framework**: FastAPI with async/await patterns
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **AI Integration**: OpenRouter/Gemini for reasoning, YOLOv8 for computer vision
- **Authentication**: Supabase Auth with social providers
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

### Edge Layer (Cloudflare Workers)

- **Image Processing**: Canvas API for image optimization
- **Caching**: KV storage for policies and user sessions
- **Rate Limiting**: Per-user request throttling
- **Analytics**: Event tracking and performance monitoring

### Infrastructure

- **Containerization**: Docker with multi-stage builds
- **Monitoring**: Prometheus, Grafana, and custom metrics
- **CI/CD**: GitHub Actions with automated testing
- **Security**: Rate limiting, input validation, and audit logging

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Docker and Docker Compose
- Supabase account
- Cloudflare account (for Workers)

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/rebin-pro.git
   cd rebin-pro
   ```

2. **Set up environment variables**

   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration

   # Frontend
   cp frontend/.env.example frontend/.env.local
   # Edit frontend/.env.local with your configuration
   ```

3. **Database setup**

   ```bash
   # Run database migrations
   cd database
   python migrate.py
   ```

4. **Start development servers**

   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d

   # Or manually
   # Backend
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000

   # Frontend
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run community features tests
npm run test:community

# Run specific test suites
npm run test:ui          # UI component tests
npm run test:auth        # Authentication tests
npm run test:security    # Security tests
```

### Test Coverage

The project includes comprehensive test coverage for:

- **Community Features**: Challenge system, leaderboards, achievements, notifications
- **UI Components**: All reusable components with accessibility testing
- **Authentication**: Login, registration, and security features
- **API Endpoints**: Backend route testing and validation
- **Security**: XSS protection, CSRF tokens, rate limiting
- **Integration**: End-to-end workflow testing

### Test Structure

```
frontend/src/test/
├── components/
│   ├── auth/           # Authentication component tests
│   ├── community/      # Community feature tests
│   ├── ui/            # UI component tests
│   └── navigation/    # Navigation component tests
├── lib/               # Library and utility tests
└── setup.ts          # Test configuration
```

## 📊 Database Schema

### Core Tables

- **users**: User accounts and profiles
- **sort_events**: Individual waste sorting events
- **policies**: Local recycling policies by ZIP code
- **user_preferences**: User customization settings

### Community Features

- **achievements**: User achievements and badges with progress tracking
- **challenges**: Community challenges and competitions with real-time updates
- **challenge_participants**: User participation tracking and progress monitoring
- **leaderboard**: Materialized view for performance with caching
- **user_preferences**: User customization and notification settings
- **analytics_events**: Detailed user behavior and engagement tracking

### Analytics

- **user_sessions**: Session tracking for analytics
- **analytics_events**: Detailed user behavior tracking
- **feedback**: User feedback on sorting decisions

## 🔧 API Documentation

### Authentication Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile

### Core Functionality

- `POST /infer` - Image analysis and item detection
- `POST /explain` - Get sorting explanations and eco tips
- `POST /event` - Log sorting events
- `POST /chatbot` - Generate conversational explanations

### User Management

- `GET /users/profile/{user_id}` - Get user profile
- `PUT /users/profile/{user_id}` - Update user profile
- `GET /users/preferences/{user_id}` - Get user preferences
- `PUT /users/preferences/{user_id}` - Update user preferences
- `GET /users/stats/{user_id}` - Get user statistics
- `GET /users/achievements/{user_id}` - Get user achievements

### Analytics

- `GET /analytics/trends` - Get recycling trends and patterns
- `GET /analytics/impact` - Calculate environmental impact
- `GET /analytics/leaderboard` - Get leaderboard data
- `GET /analytics/recent-activity` - Get recent activity
- `POST /analytics/track-event` - Track analytics events

### Community Features

- `GET /users/challenges` - Get available challenges with filtering
- `POST /users/challenges/{challenge_id}/join` - Join a challenge
- `GET /users/achievements/{user_id}` - Get user achievements and progress
- `GET /analytics/leaderboard` - Get leaderboard data with rankings
- `GET /analytics/trends` - Get recycling trends and community statistics
- `GET /analytics/impact` - Calculate environmental impact metrics
- `POST /analytics/track-event` - Track user engagement events

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# E2E tests
npm run test:e2e
```

### Test Coverage

- **Unit Tests**: 90%+ coverage for core business logic
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load testing with k6

## 🚀 Deployment

### Production Deployment

1. **Build and push Docker images**

   ```bash
   docker build -t rebin-pro/backend:latest ./backend
   docker build -t rebin-pro/frontend:latest ./frontend
   ```

2. **Deploy to production**

   ```bash
   # Using Docker Compose
   docker-compose -f docker-compose.prod.yml up -d

   # Or using Kubernetes
   kubectl apply -f k8s/
   ```

3. **Set up monitoring**
   ```bash
   # Start monitoring stack
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

### Environment Variables

#### Backend (.env)

```env
ENVIRONMENT=production
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
ELEVENLABS_API_KEY=your_elevenlabs_key
FRONTEND_ORIGIN=https://your-domain.com
```

#### Frontend (.env.local)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://api.your-domain.com
VITE_CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev
```

## 📈 Monitoring and Observability

### Metrics

- **Application Metrics**: Request rates, response times, error rates
- **Business Metrics**: Sort events, user engagement, environmental impact
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Custom Metrics**: AI model performance, cache hit rates

### Dashboards

- **Grafana**: Real-time monitoring dashboards
- **Prometheus**: Metrics collection and alerting
- **Custom Analytics**: User behavior and engagement tracking

### Alerting

- **API Response Time**: Alert if > 200ms for 95th percentile
- **Error Rate**: Alert if > 1% error rate
- **Database Performance**: Alert on slow queries
- **User Engagement**: Alert on significant drops in activity

## 🔒 Security

### Security Measures

- **Rate Limiting**: Per-user and per-IP request throttling
- **Input Validation**: Comprehensive validation and sanitization
- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Row-level security in Supabase
- **Audit Logging**: Complete audit trail for all operations
- **CORS**: Proper cross-origin resource sharing configuration

### Security Best Practices

- **Environment Variables**: Sensitive data in environment variables only
- **Dependency Scanning**: Regular security audits of dependencies
- **Code Scanning**: Static analysis for security vulnerabilities
- **Penetration Testing**: Regular security assessments

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict typing, no `any` types
- **Python**: Type hints, async/await patterns, proper error handling
- **Testing**: Unit tests for all new features
- **Documentation**: Update documentation for API changes
- **Linting**: ESLint for frontend, Black/flake8 for backend

### Pull Request Guidelines

- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass
- Follow the existing code style
- Include a clear description of changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the backend-as-a-service platform
- **Cloudflare** for edge computing and CDN services
- **OpenRouter** for AI model access
- **ElevenLabs** for text-to-speech capabilities
- **YOLOv8** for computer vision capabilities

## 📞 Support

- **Documentation**: [docs.rebin-pro.com](https://docs.rebin-pro.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/rebin-pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/rebin-pro/discussions)
- **Email**: support@rebin-pro.com

## 🗺️ Roadmap

### Phase 1 (Current)

- ✅ Core waste sorting functionality
- ✅ User authentication and profiles
- ✅ Comprehensive community features (leaderboards, challenges, achievements)
- ✅ Real-time notifications and updates
- ✅ Advanced analytics and reporting
- ✅ PWA capabilities with offline support
- ✅ Comprehensive test coverage

### Phase 2 (Q2 2024)

- 🔄 Advanced AI models for better accuracy
- 🔄 Multi-language support
- 🔄 Social features and sharing
- 🔄 Mobile app (React Native)

### Phase 3 (Q3 2024)

- 📋 Enterprise features for businesses
- 📋 API for third-party integrations
- 📋 Advanced analytics and reporting
- 📋 Machine learning model improvements

### Phase 4 (Q4 2024)

- 📋 Global expansion with local policies
- 📋 Integration with smart waste bins
- 📋 Carbon credit marketplace
- 📋 Advanced gamification features

---

**ReBin Pro** - Making waste sorting smarter, one item at a time. 🌱♻️
