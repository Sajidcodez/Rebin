/**
 * Error Handling Service
 * Provides comprehensive error handling, fallback mechanisms, and user feedback
 * Follows best practices for error management and user experience
 */

import { ILogger } from "./CommunityService";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ErrorContext {
  component: string;
  operation: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ErrorSeverity {
  level: "low" | "medium" | "high" | "critical";
  userImpact: "none" | "minor" | "moderate" | "severe";
  recoveryAction: "automatic" | "manual" | "fallback" | "none";
}

export interface FallbackStrategy {
  type:
    | "mock_data"
    | "cached_data"
    | "default_state"
    | "retry"
    | "user_notification";
  priority: number;
  maxAttempts?: number;
  timeout?: number;
  data?: any;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: ErrorSeverity;
  fallbackStrategy?: FallbackStrategy;
  resolved: boolean;
  resolvedAt?: Date;
  userNotified: boolean;
}

// ============================================================================
// ERROR HANDLING SERVICE
// ============================================================================

export class ErrorHandlingService {
  private logger: ILogger;
  private errorReports = new Map<string, ErrorReport>();
  private fallbackStrategies = new Map<string, FallbackStrategy[]>();
  private retryAttempts = new Map<string, number>();
  private maxRetryAttempts = 3;
  private retryDelay = 1000; // 1 second

  constructor(logger?: ILogger) {
    this.logger = logger || this.createDefaultLogger();
    this.initializeFallbackStrategies();
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  async handleError(
    error: Error,
    context: Omit<ErrorContext, "timestamp">,
    fallbackData?: any
  ): Promise<{ success: boolean; data?: any; fallbackUsed?: boolean }> {
    const errorId = this.generateErrorId();
    const fullContext: ErrorContext = {
      ...context,
      timestamp: new Date(),
    };

    // Determine error severity
    const severity = this.assessErrorSeverity(error, fullContext);

    // Create error report
    const errorReport: ErrorReport = {
      id: errorId,
      error,
      context: fullContext,
      severity,
      resolved: false,
      userNotified: false,
    };

    // Log error
    this.logError(errorReport);

    // Store error report
    this.errorReports.set(errorId, errorReport);

    // Attempt fallback strategies
    const fallbackResult = await this.attemptFallbackStrategies(
      errorReport,
      fallbackData
    );

    // Notify user if necessary
    if (severity.userImpact !== "none" && !errorReport.userNotified) {
      this.notifyUser(errorReport);
      errorReport.userNotified = true;
    }

    return {
      success: fallbackResult.success,
      data: fallbackResult.data,
      fallbackUsed: fallbackResult.fallbackUsed,
    };
  }

  // ============================================================================
  // FALLBACK STRATEGIES
  // ============================================================================

  private async attemptFallbackStrategies(
    errorReport: ErrorReport,
    fallbackData?: any
  ): Promise<{ success: boolean; data?: any; fallbackUsed: boolean }> {
    const strategies =
      this.fallbackStrategies.get(errorReport.context.operation) || [];

    // Sort strategies by priority (lower number = higher priority)
    const sortedStrategies = strategies.sort((a, b) => a.priority - b.priority);

    for (const strategy of sortedStrategies) {
      try {
        const result = await this.executeFallbackStrategy(
          strategy,
          errorReport,
          fallbackData
        );
        if (result.success) {
          errorReport.fallbackStrategy = strategy;
          errorReport.resolved = true;
          errorReport.resolvedAt = new Date();

          this.logger.info("Fallback strategy succeeded", {
            errorId: errorReport.id,
            strategy: strategy.type,
            operation: errorReport.context.operation,
          });

          return {
            success: true,
            data: result.data,
            fallbackUsed: true,
          };
        }
      } catch (fallbackError) {
        this.logger.warn("Fallback strategy failed", {
          errorId: errorReport.id,
          strategy: strategy.type,
          fallbackError: fallbackError.message,
        });
      }
    }

    // All fallback strategies failed
    this.logger.error("All fallback strategies failed", {
      errorId: errorReport.id,
      operation: errorReport.context.operation,
    });

    return {
      success: false,
      fallbackUsed: false,
    };
  }

  private async executeFallbackStrategy(
    strategy: FallbackStrategy,
    errorReport: ErrorReport,
    fallbackData?: any
  ): Promise<{ success: boolean; data?: any }> {
    switch (strategy.type) {
      case "mock_data":
        return this.executeMockDataFallback(strategy, errorReport);

      case "cached_data":
        return this.executeCachedDataFallback(strategy, errorReport);

      case "default_state":
        return this.executeDefaultStateFallback(strategy, errorReport);

      case "retry":
        return this.executeRetryFallback(strategy, errorReport);

      case "user_notification":
        return this.executeUserNotificationFallback(strategy, errorReport);

      default:
        return { success: false };
    }
  }

  private async executeMockDataFallback(
    strategy: FallbackStrategy,
    errorReport: ErrorReport
  ): Promise<{ success: boolean; data?: any }> {
    try {
      // Import mock data service dynamically to avoid circular dependencies
      const { MockDataService } = await import("../mockData");

      let mockData: any;

      switch (errorReport.context.operation) {
        case "getLeaderboard":
          mockData = await MockDataService.getLeaderboard(10, "7d");
          break;
        case "getAchievements":
          mockData = await MockDataService.getAchievements(
            errorReport.context.userId || "demo-user-123"
          );
          break;
        case "getChallenges":
          mockData = await MockDataService.getChallenges();
          break;
        case "getUserStats":
          mockData = await MockDataService.getUserStats(
            errorReport.context.userId || "demo-user-123"
          );
          break;
        default:
          return { success: false };
      }

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      this.logger.error("Mock data fallback failed", { error: error.message });
      return { success: false };
    }
  }

  private async executeCachedDataFallback(
    strategy: FallbackStrategy,
    errorReport: ErrorReport
  ): Promise<{ success: boolean; data?: any }> {
    try {
      // Try to get cached data from localStorage or memory cache
      const cacheKey = `cache_${errorReport.context.operation}_${
        errorReport.context.userId || "global"
      }`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsedData.timestamp;

        // Check if cache is still valid (within 5 minutes)
        if (cacheAge < 5 * 60 * 1000) {
          return {
            success: true,
            data: parsedData.data,
          };
        }
      }

      return { success: false };
    } catch (error) {
      this.logger.error("Cached data fallback failed", {
        error: error.message,
      });
      return { success: false };
    }
  }

  private async executeDefaultStateFallback(
    strategy: FallbackStrategy,
    errorReport: ErrorReport
  ): Promise<{ success: boolean; data?: any }> {
    try {
      // Return default/empty state based on operation
      let defaultData: any;

      switch (errorReport.context.operation) {
        case "getLeaderboard":
          defaultData = [];
          break;
        case "getAchievements":
          defaultData = [];
          break;
        case "getChallenges":
          defaultData = [];
          break;
        case "getUserStats":
          defaultData = {
            totalItemsSorted: 0,
            totalCo2Saved: 0,
            totalPoints: 0,
            rankPosition: 0,
            streakDays: 0,
            achievementCount: 0,
          };
          break;
        default:
          defaultData = null;
      }

      return {
        success: true,
        data: defaultData,
      };
    } catch (error) {
      this.logger.error("Default state fallback failed", {
        error: error.message,
      });
      return { success: false };
    }
  }

  private async executeRetryFallback(
    strategy: FallbackStrategy,
    errorReport: ErrorReport
  ): Promise<{ success: boolean; data?: any }> {
    const retryKey = `${errorReport.context.operation}_${
      errorReport.context.userId || "global"
    }`;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;
    const maxAttempts = strategy.maxAttempts || this.maxRetryAttempts;

    if (currentAttempts >= maxAttempts) {
      this.retryAttempts.delete(retryKey);
      return { success: false };
    }

    // Increment retry count
    this.retryAttempts.set(retryKey, currentAttempts + 1);

    // Wait before retry
    const delay =
      strategy.timeout || this.retryDelay * Math.pow(2, currentAttempts);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // This would typically re-execute the original operation
    // For now, we'll return false to indicate retry should be handled by the caller
    return { success: false };
  }

  private async executeUserNotificationFallback(
    strategy: FallbackStrategy,
    errorReport: ErrorReport
  ): Promise<{ success: boolean; data?: any }> {
    // This strategy just notifies the user and returns false
    // The actual notification is handled by the notifyUser method
    return { success: false };
  }

  // ============================================================================
  // ERROR ASSESSMENT
  // ============================================================================

  private assessErrorSeverity(
    error: Error,
    context: ErrorContext
  ): ErrorSeverity {
    // Network errors
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return {
        level: "medium",
        userImpact: "moderate",
        recoveryAction: "fallback",
      };
    }

    // Authentication errors
    if (
      error.message.includes("unauthorized") ||
      error.message.includes("401")
    ) {
      return {
        level: "high",
        userImpact: "severe",
        recoveryAction: "manual",
      };
    }

    // Server errors
    if (error.message.includes("500") || error.message.includes("server")) {
      return {
        level: "high",
        userImpact: "moderate",
        recoveryAction: "fallback",
      };
    }

    // Data validation errors
    if (
      error.message.includes("validation") ||
      error.message.includes("invalid")
    ) {
      return {
        level: "medium",
        userImpact: "minor",
        recoveryAction: "fallback",
      };
    }

    // Default severity
    return {
      level: "medium",
      userImpact: "minor",
      recoveryAction: "fallback",
    };
  }

  // ============================================================================
  // USER NOTIFICATION
  // ============================================================================

  private notifyUser(errorReport: ErrorReport): void {
    const message = this.generateUserFriendlyMessage(errorReport);

    // This would integrate with your toast/notification system
    // For now, we'll just log it
    this.logger.warn("User notification", {
      errorId: errorReport.id,
      message,
      severity: errorReport.severity.userImpact,
    });

    // In a real implementation, you would:
    // 1. Show a toast notification
    // 2. Update the UI state
    // 3. Log to analytics
    // 4. Send to error tracking service (e.g., Sentry)
  }

  private generateUserFriendlyMessage(errorReport: ErrorReport): string {
    const { operation, severity } = errorReport;

    switch (operation) {
      case "getLeaderboard":
        return "Unable to load leaderboard. Showing cached data instead.";
      case "getAchievements":
        return "Unable to load achievements. Please try again later.";
      case "getChallenges":
        return "Unable to load challenges. Showing demo challenges instead.";
      case "getUserStats":
        return "Unable to load your stats. Please refresh the page.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeFallbackStrategies(): void {
    // Leaderboard fallback strategies
    this.fallbackStrategies.set("getLeaderboard", [
      { type: "cached_data", priority: 1 },
      { type: "mock_data", priority: 2 },
      { type: "default_state", priority: 3 },
    ]);

    // Achievements fallback strategies
    this.fallbackStrategies.set("getAchievements", [
      { type: "cached_data", priority: 1 },
      { type: "mock_data", priority: 2 },
      { type: "default_state", priority: 3 },
    ]);

    // Challenges fallback strategies
    this.fallbackStrategies.set("getChallenges", [
      { type: "cached_data", priority: 1 },
      { type: "mock_data", priority: 2 },
      { type: "default_state", priority: 3 },
    ]);

    // User stats fallback strategies
    this.fallbackStrategies.set("getUserStats", [
      { type: "cached_data", priority: 1 },
      { type: "mock_data", priority: 2 },
      { type: "default_state", priority: 3 },
    ]);

    // Join challenge fallback strategies
    this.fallbackStrategies.set("joinChallenge", [
      { type: "retry", priority: 1, maxAttempts: 3, timeout: 1000 },
      { type: "user_notification", priority: 2 },
    ]);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(errorReport: ErrorReport): void {
    const { error, context, severity } = errorReport;

    const logData = {
      errorId: errorReport.id,
      message: error.message,
      stack: error.stack,
      component: context.component,
      operation: context.operation,
      userId: context.userId,
      severity: severity.level,
      userImpact: severity.userImpact,
      recoveryAction: severity.recoveryAction,
      metadata: context.metadata,
    };

    switch (severity.level) {
      case "critical":
        this.logger.error("Critical error occurred", logData);
        break;
      case "high":
        this.logger.error("High severity error occurred", logData);
        break;
      case "medium":
        this.logger.warn("Medium severity error occurred", logData);
        break;
      case "low":
        this.logger.info("Low severity error occurred", logData);
        break;
    }
  }

  private createDefaultLogger(): ILogger {
    return {
      info: (message: string, meta?: any) =>
        console.log(`[ErrorHandlingService] ${message}`, meta || ""),
      error: (message: string, meta?: any) =>
        console.error(`[ErrorHandlingService] ${message}`, meta || ""),
      warn: (message: string, meta?: any) =>
        console.warn(`[ErrorHandlingService] ${message}`, meta || ""),
      debug: (message: string, meta?: any) =>
        console.debug(`[ErrorHandlingService] ${message}`, meta || ""),
    };
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  getErrorReports(): ErrorReport[] {
    return Array.from(this.errorReports.values());
  }

  getErrorReport(errorId: string): ErrorReport | undefined {
    return this.errorReports.get(errorId);
  }

  clearErrorReports(): void {
    this.errorReports.clear();
    this.retryAttempts.clear();
  }

  addFallbackStrategy(operation: string, strategy: FallbackStrategy): void {
    const existing = this.fallbackStrategies.get(operation) || [];
    existing.push(strategy);
    existing.sort((a, b) => a.priority - b.priority);
    this.fallbackStrategies.set(operation, existing);
  }

  removeFallbackStrategy(operation: string, strategyType: string): void {
    const existing = this.fallbackStrategies.get(operation) || [];
    const filtered = existing.filter((s) => s.type !== strategyType);
    this.fallbackStrategies.set(operation, filtered);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const errorHandlingService = new ErrorHandlingService();
