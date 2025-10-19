# Hybrid Data Integration Guide

This guide explains how to implement and use the hybrid data system that seamlessly combines mock and real-time user data for your ReBin application.

## 🎯 Overview

The hybrid data system provides:

- **Seamless Integration**: Combines mock and real data without breaking existing functionality
- **Best Practices**: Follows software engineering, design, security, and UX best practices
- **Performance Optimized**: Includes caching, error handling, and performance monitoring
- **User Experience**: Maintains rich experience with mock data while adding real user interactions
- **Competitive Features**: Ensures accurate leaderboards and fair competition

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                      │
├─────────────────────────────────────────────────────────────┤
│  Leaderboard  │  Achievements  │  Challenges  │  Analytics  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Hybrid Data Service                         │
├─────────────────────────────────────────────────────────────┤
│  • Data Merging  │  • Error Handling  │  • Performance     │
│  • Caching       │  • Fallback        │  • Monitoring      │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Sources                             │
├─────────────────────────────────────────────────────────────┤
│  Mock Data Service  │  Real-Time API  │  Local Storage     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import { Leaderboard } from './components/Leaderboard';

// Use traditional mock data (existing behavior)
<Leaderboard
  timePeriod="7d"
  limit={10}
  currentUserId="user-123"
/>

// Enable hybrid data mode
<Leaderboard
  timePeriod="7d"
  limit={10}
  currentUserId="user-123"
  useHybridData={true}
  showDataQuality={true}
/>
```

### 2. Advanced Configuration

```tsx
import { HybridLeaderboard } from "./components/HybridLeaderboard";
import { HybridDataService } from "./lib/services/HybridDataService";

// Create custom hybrid service
const hybridService = new HybridDataService(
  realTimeService, // Optional real-time service
  logger, // Optional logger
  {
    enableRealTimeData: true,
    enableMockData: true,
    mockDataWeight: 0.6, // 60% mock data
    realDataWeight: 0.4, // 40% real data
    fallbackToMock: true,
    cacheTimeout: 30000, // 30 seconds
  }
);

<HybridLeaderboard
  timePeriod="7d"
  limit={20}
  currentUserId="user-123"
  enableRealTimeUpdates={true}
  showDataQuality={true}
/>;
```

## 📊 Data Flow

### Leaderboard Data Flow

1. **Request**: Component requests leaderboard data
2. **Hybrid Service**: Fetches from both mock and real sources
3. **Data Adapters**: Normalize data formats
4. **Merging**: Combine and deduplicate entries
5. **Ranking**: Sort by points with tie-breaking
6. **Caching**: Store result for performance
7. **Response**: Return unified leaderboard

### Error Handling Flow

1. **Error Occurs**: Network, API, or data error
2. **Assessment**: Determine severity and impact
3. **Fallback**: Try cached data, then mock data
4. **User Notification**: Show appropriate message
5. **Recovery**: Automatic retry or manual action

## 🔧 Configuration Options

### Hybrid Data Service Configuration

```typescript
interface DataSourceConfig {
  enableRealTimeData: boolean; // Enable real-time data fetching
  enableMockData: boolean; // Enable mock data fallback
  mockDataWeight: number; // Weight for mock data (0-1)
  realDataWeight: number; // Weight for real data (0-1)
  fallbackToMock: boolean; // Fallback to mock on error
  cacheTimeout: number; // Cache TTL in milliseconds
}
```

### Performance Optimization Configuration

```typescript
interface OptimizationConfig {
  enableCaching: boolean; // Enable data caching
  enableMemoization: boolean; // Enable function memoization
  enableCompression: boolean; // Enable data compression
  enablePrefetching: boolean; // Enable data prefetching
  maxConcurrentRequests: number; // Max concurrent API requests
  requestTimeout: number; // Request timeout in ms
}
```

## 🎨 Component Integration

### Existing Components (Backward Compatible)

```tsx
// Existing Leaderboard component with new props
<Leaderboard
  timePeriod="7d"
  limit={10}
  currentUserId="user-123"
  useHybridData={true} // NEW: Enable hybrid mode
  showDataQuality={true} // NEW: Show data quality indicators
/>
```

### New Hybrid Components

```tsx
// Dedicated hybrid components with full features
<HybridLeaderboard
  timePeriod="7d"
  limit={20}
  currentUserId="user-123"
  enableRealTimeUpdates={true}
  showDataQuality={true}
  className="custom-styles"
/>

<HybridAchievementSystem
  userId="user-123"
  useHybridData={true}
  showProgressBars={true}
  showRarityIndicators={true}
  enableRealTimeUpdates={true}
/>
```

## 🔄 Real-Time Updates

### WebSocket Integration

```typescript
import { realTimeDataService } from "./lib/services/RealTimeDataService";

// Initialize real-time service
await realTimeDataService.initialize();

// Set up event handlers
realTimeDataService.onLeaderboardUpdate((data) => {
  console.log("Leaderboard updated:", data);
  // Update UI with new data
});

realTimeDataService.onAchievementUnlocked((achievement) => {
  console.log("Achievement unlocked:", achievement);
  // Show achievement notification
});

realTimeDataService.onChallengeProgress((challenge) => {
  console.log("Challenge progress:", challenge);
  // Update challenge UI
});
```

### Manual Refresh

```typescript
// Trigger manual data refresh
const refreshData = async () => {
  try {
    await hybridService.clearCache();
    await fetchLeaderboard();
  } catch (error) {
    console.error("Refresh failed:", error);
  }
};
```

## 🛡️ Error Handling

### Automatic Fallback

The system automatically handles errors with multiple fallback strategies:

1. **Cached Data**: Use recently cached data
2. **Mock Data**: Fall back to mock data
3. **Default State**: Show empty/default state
4. **User Notification**: Inform user of issues

### Custom Error Handling

```typescript
import { errorHandlingService } from "./lib/services/ErrorHandlingService";

try {
  const data = await hybridService.getHybridLeaderboard(10, "7d", userId);
  // Use data
} catch (error) {
  const result = await errorHandlingService.handleError(error, {
    component: "Leaderboard",
    operation: "getLeaderboard",
    userId: userId,
  });

  if (result.success) {
    // Use fallback data
    setLeaderboard(result.data);
  } else {
    // Show error state
    setError("Unable to load leaderboard");
  }
}
```

## 📈 Performance Monitoring

### Built-in Metrics

```typescript
import { performanceOptimizationService } from "./lib/services/PerformanceOptimizationService";

// Get performance metrics
const metrics =
  performanceOptimizationService.getPerformanceMetrics("getLeaderboard");
const average =
  performanceOptimizationService.getAveragePerformance("getLeaderboard");

console.log("Average duration:", average.averageDuration);
console.log("Cache hit rate:", average.cacheHitRate);
console.log("Total calls:", average.totalCalls);
```

### Cache Statistics

```typescript
const cacheStats = performanceOptimizationService.getCacheStats();
console.log("Cache size:", cacheStats.size);
console.log("Cache hit rate:", cacheStats.hitRate);
console.log("Total cache size:", cacheStats.totalSize);
```

## 🧪 Testing

### Unit Tests

```typescript
import { HybridDataService } from "./lib/services/HybridDataService";
import { MockDataService } from "./lib/mockData";

describe("HybridDataService", () => {
  let hybridService: HybridDataService;

  beforeEach(() => {
    hybridService = new HybridDataService();
  });

  test("should merge mock and real data", async () => {
    const result = await hybridService.getHybridLeaderboard(
      10,
      "7d",
      "user-123"
    );

    expect(result.entries).toBeDefined();
    expect(result.stats.totalEntries).toBeGreaterThan(0);
    expect(result.stats.dataQuality).toBeDefined();
  });

  test("should fallback to mock data on error", async () => {
    // Mock real-time service to throw error
    const result = await hybridService.getHybridLeaderboard(
      10,
      "7d",
      "user-123"
    );

    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.stats.mockEntries).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { HybridLeaderboard } from "./components/HybridLeaderboard";

test("should render hybrid leaderboard with data quality indicator", async () => {
  render(
    <HybridLeaderboard
      timePeriod="7d"
      limit={10}
      currentUserId="user-123"
      showDataQuality={true}
    />
  );

  await waitFor(() => {
    expect(screen.getByText("Hybrid Leaderboard")).toBeInTheDocument();
    expect(screen.getByText(/Data Quality:/)).toBeInTheDocument();
  });
});
```

## 🔒 Security Considerations

### Data Privacy

- Real user data is only fetched for authenticated users
- Mock data provides privacy-safe demo experience
- Data sources are clearly indicated to users
- No sensitive information is cached

### API Security

- All API requests include authentication tokens
- Rate limiting prevents abuse
- Input validation on all data
- Error messages don't expose sensitive information

## 🚀 Deployment

### Environment Variables

```bash
# .env.local
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_API_KEY=your-api-key
REACT_APP_ENABLE_HYBRID_DATA=true
```

### Production Configuration

```typescript
// Production config
const productionConfig = {
  enableRealTimeData: true,
  enableMockData: false, // Disable mock data in production
  mockDataWeight: 0.0, // No mock data weight
  realDataWeight: 1.0, // Full real data weight
  fallbackToMock: true, // Keep fallback for reliability
  cacheTimeout: 60000, // Longer cache in production
  enableCompression: true, // Enable compression
  maxConcurrentRequests: 10, // Higher concurrency
};
```

## 📊 Monitoring and Analytics

### Performance Metrics

Track these key metrics:

- **Response Time**: Average API response time
- **Cache Hit Rate**: Percentage of requests served from cache
- **Error Rate**: Percentage of failed requests
- **Data Quality**: Ratio of real vs mock data
- **User Engagement**: Time spent on leaderboards/challenges

### Error Tracking

```typescript
// Integrate with error tracking service (e.g., Sentry)
import * as Sentry from "@sentry/react";

errorHandlingService.onError((errorReport) => {
  Sentry.captureException(errorReport.error, {
    tags: {
      component: errorReport.context.component,
      operation: errorReport.context.operation,
      severity: errorReport.severity.level,
    },
    extra: errorReport.context.metadata,
  });
});
```

## 🎯 Best Practices

### 1. Gradual Rollout

- Start with mock data only
- Enable hybrid mode for beta users
- Monitor performance and user feedback
- Gradually increase real data weight

### 2. User Communication

- Clearly indicate data sources
- Show data quality indicators
- Provide fallback explanations
- Handle errors gracefully

### 3. Performance Optimization

- Use caching aggressively
- Implement request throttling
- Monitor memory usage
- Clean up expired data

### 4. Testing Strategy

- Test with both mock and real data
- Simulate network failures
- Test error scenarios
- Validate data integrity

## 🔧 Troubleshooting

### Common Issues

1. **Data Not Loading**

   - Check network connectivity
   - Verify API endpoints
   - Check authentication tokens
   - Review error logs

2. **Performance Issues**

   - Monitor cache hit rates
   - Check request throttling
   - Review memory usage
   - Optimize data queries

3. **Real-Time Updates Not Working**
   - Verify WebSocket connection
   - Check event handlers
   - Review network configuration
   - Test with mock data

### Debug Mode

```typescript
// Enable debug mode in development
if (process.env.NODE_ENV === "development") {
  hybridService.updateConfig({
    enableRealTimeData: true,
    enableMockData: true,
    mockDataWeight: 0.5,
    realDataWeight: 0.5,
  });
}
```

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Component Library](./COMPONENT_LIBRARY.md)
- [Performance Guide](./PERFORMANCE_GUIDE.md)
- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md)

## 🤝 Contributing

When contributing to the hybrid data system:

1. Follow the established patterns
2. Add comprehensive tests
3. Update documentation
4. Consider performance impact
5. Test with both data sources

## 📄 License

This hybrid data system is part of the ReBin project and follows the same licensing terms.
