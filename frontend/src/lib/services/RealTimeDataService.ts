/**
 * Real-Time Data Service
 * Handles communication with backend APIs for real user data
 * Provides real-time updates and WebSocket connections
 */

import { ILogger } from "./CommunityService";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface RealTimeConfig {
  baseUrl: string;
  apiKey?: string;
  enableWebSocket: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  requestTimeout: number;
}

export interface WebSocketMessage {
  type:
    | "leaderboard_update"
    | "achievement_unlocked"
    | "challenge_progress"
    | "user_stats_update";
  data: any;
  timestamp: string;
  userId?: string;
}

export interface RealTimeLeaderboardEntry {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  total_items_sorted: number;
  total_co2_saved: number;
  total_points: number;
  rank_position: number;
  last_updated: string;
}

export interface RealTimeAchievement {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  progress: number;
  max_progress: number;
  unlocked: boolean;
  unlocked_at?: string;
  icon: string;
  points: number;
}

export interface RealTimeChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_items?: number;
  target_co2?: number;
  target_participants?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_featured: boolean;
  difficulty_level: string;
  reward_points: number;
  participants: number;
  user_progress?: number;
  user_joined?: boolean;
  user_completed?: boolean;
}

export interface RealTimeUserStats {
  total_items_sorted: number;
  total_co2_saved: number;
  total_points: number;
  rank_position: number;
  streak_days: number;
  achievement_count: number;
  last_updated: string;
}

// ============================================================================
// REAL-TIME DATA SERVICE
// ============================================================================

export class RealTimeDataService {
  private config: RealTimeConfig;
  private logger: ILogger;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers = new Map<string, (data: any) => void>();
  private isConnected = false;

  constructor(config: RealTimeConfig, logger?: ILogger) {
    this.config = config;
    this.logger = logger || this.createDefaultLogger();
  }

  // ============================================================================
  // INITIALIZATION AND CONNECTION
  // ============================================================================

  async initialize(): Promise<void> {
    try {
      this.logger.info("Initializing RealTimeDataService", {
        config: this.config,
      });

      if (this.config.enableWebSocket) {
        await this.connectWebSocket();
      }

      this.logger.info("RealTimeDataService initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize RealTimeDataService", { error });
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.config.baseUrl.replace("http", "ws") + "/ws";
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.logger.info("WebSocket connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.ws.onclose = () => {
          this.logger.warn("WebSocket disconnected");
          this.isConnected = false;
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          this.logger.error("WebSocket error", { error });
          reject(error);
        };
      } catch (error) {
        this.logger.error("Failed to create WebSocket connection", { error });
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.logger.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    this.logger.info(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket().catch((error) => {
        this.logger.error("Reconnection failed", { error });
      });
    }, this.config.reconnectInterval);
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.logger.debug("Received WebSocket message", { type: message.type });

      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message.data);
      }
    } catch (error) {
      this.logger.error("Failed to parse WebSocket message", { error });
    }
  }

  // ============================================================================
  // MESSAGE HANDLERS
  // ============================================================================

  onLeaderboardUpdate(
    handler: (data: RealTimeLeaderboardEntry[]) => void
  ): void {
    this.messageHandlers.set("leaderboard_update", handler);
  }

  onAchievementUnlocked(handler: (data: RealTimeAchievement) => void): void {
    this.messageHandlers.set("achievement_unlocked", handler);
  }

  onChallengeProgress(handler: (data: RealTimeChallenge) => void): void {
    this.messageHandlers.set("challenge_progress", handler);
  }

  onUserStatsUpdate(handler: (data: RealTimeUserStats) => void): void {
    this.messageHandlers.set("user_stats_update", handler);
  }

  // ============================================================================
  // API METHODS
  // ============================================================================

  async getLeaderboard(
    limit: number = 50,
    timePeriod: string = "all"
  ): Promise<RealTimeLeaderboardEntry[]> {
    try {
      this.logger.info("Fetching real-time leaderboard", { limit, timePeriod });

      const response = await this.makeRequest(
        `/analytics/leaderboard?limit=${limit}&time_period=${timePeriod}`,
        "GET"
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.logger.info("Real-time leaderboard fetched successfully", {
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logger.error("Failed to fetch real-time leaderboard", { error });
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<RealTimeUserStats | null> {
    try {
      this.logger.info("Fetching real-time user stats", { userId });

      const response = await this.makeRequest(`/users/stats/${userId}`, "GET");

      if (response.status === 404) {
        this.logger.warn("User stats not found", { userId });
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.logger.info("Real-time user stats fetched successfully", { userId });

      return data;
    } catch (error) {
      this.logger.error("Failed to fetch real-time user stats", {
        error,
        userId,
      });
      throw error;
    }
  }

  async getAchievements(userId: string): Promise<RealTimeAchievement[]> {
    try {
      this.logger.info("Fetching real-time achievements", { userId });

      const response = await this.makeRequest(
        `/users/achievements/${userId}`,
        "GET"
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.logger.info("Real-time achievements fetched successfully", {
        userId,
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logger.error("Failed to fetch real-time achievements", {
        error,
        userId,
      });
      throw error;
    }
  }

  async getChallenges(
    featuredOnly: boolean = false,
    userId?: string
  ): Promise<RealTimeChallenge[]> {
    try {
      this.logger.info("Fetching real-time challenges", {
        featuredOnly,
        userId,
      });

      let url = "/users/challenges";
      const params = new URLSearchParams();

      if (featuredOnly) {
        params.append("featured", "true");
      }
      if (userId) {
        params.append("user_id", userId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await this.makeRequest(url, "GET");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.logger.info("Real-time challenges fetched successfully", {
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logger.error("Failed to fetch real-time challenges", { error });
      throw error;
    }
  }

  async joinChallenge(challengeId: string, userId: string): Promise<boolean> {
    try {
      this.logger.info("Joining challenge", { challengeId, userId });

      const response = await this.makeRequest(
        `/users/challenges/${challengeId}/join`,
        "POST",
        { user_id: userId }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.info("Successfully joined challenge", {
        challengeId,
        userId,
      });
      return true;
    } catch (error) {
      this.logger.error("Failed to join challenge", {
        error,
        challengeId,
        userId,
      });
      throw error;
    }
  }

  async updateChallengeProgress(
    challengeId: string,
    userId: string,
    progress: number
  ): Promise<void> {
    try {
      this.logger.info("Updating challenge progress", {
        challengeId,
        userId,
        progress,
      });

      const response = await this.makeRequest(
        `/users/challenges/${challengeId}/progress`,
        "PUT",
        { user_id: userId, progress }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.info("Challenge progress updated successfully", {
        challengeId,
        userId,
        progress,
      });
    } catch (error) {
      this.logger.error("Failed to update challenge progress", {
        error,
        challengeId,
        userId,
        progress,
      });
      throw error;
    }
  }

  async trackEvent(
    eventType: string,
    eventData: Record<string, any>,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      this.logger.debug("Tracking event", { eventType, userId, sessionId });

      const response = await this.makeRequest(
        "/analytics/track-event",
        "POST",
        {
          event_type: eventType,
          event_data: eventData,
          user_id: userId,
          session_id: sessionId,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.debug("Event tracked successfully", { eventType });
    } catch (error) {
      this.logger.error("Failed to track event", { error, eventType });
      // Don't throw here as event tracking is not critical
    }
  }

  // ============================================================================
  // HTTP REQUEST HELPERS
  // ============================================================================

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.requestTimeout),
    };

    if (body && (method === "POST" || method === "PUT")) {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);
      return response;
    } catch (error) {
      this.logger.error("HTTP request failed", { url, method, error });
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  isWebSocketConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    maxAttempts: number;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
    };
  }

  updateConfig(newConfig: Partial<RealTimeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info("RealTimeDataService config updated", this.config);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.logger.info("RealTimeDataService disconnected");
  }

  private createDefaultLogger(): ILogger {
    return {
      info: (message: string, meta?: any) =>
        console.log(`[RealTimeDataService] ${message}`, meta || ""),
      error: (message: string, meta?: any) =>
        console.error(`[RealTimeDataService] ${message}`, meta || ""),
      warn: (message: string, meta?: any) =>
        console.warn(`[RealTimeDataService] ${message}`, meta || ""),
      debug: (message: string, meta?: any) =>
        console.debug(`[RealTimeDataService] ${message}`, meta || ""),
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createRealTimeDataService(
  baseUrl: string,
  options?: {
    apiKey?: string;
    enableWebSocket?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    requestTimeout?: number;
    logger?: ILogger;
  }
): RealTimeDataService {
  const config: RealTimeConfig = {
    baseUrl,
    apiKey: options?.apiKey,
    enableWebSocket: options?.enableWebSocket ?? true,
    reconnectInterval: options?.reconnectInterval ?? 5000,
    maxReconnectAttempts: options?.maxReconnectAttempts ?? 5,
    requestTimeout: options?.requestTimeout ?? 10000,
  };

  return new RealTimeDataService(config, options?.logger);
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

// This will be configured based on environment variables
export const realTimeDataService = createRealTimeDataService(
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000",
  {
    enableWebSocket: process.env.REACT_APP_ENABLE_WEBSOCKET !== "false",
    apiKey: process.env.REACT_APP_API_KEY,
  }
);
