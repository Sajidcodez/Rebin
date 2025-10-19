/**
 * Hybrid Data Service
 * Combines mock data with real-time user data for seamless experience
 * Follows best practices for data management, error handling, and performance
 */

import {
  MockDataService,
  MockLeaderboardEntry,
  MockAchievement,
  MockChallenge,
} from "../mockData";
import { CommunityService } from "./CommunityService";
import { ILogger } from "./CommunityService";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface HybridLeaderboardEntry {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  total_items_sorted: number;
  total_co2_saved: number;
  total_points: number;
  rank_position: number;
  is_real_user: boolean;
  data_source: "mock" | "real" | "hybrid";
  last_updated: Date;
}

export interface HybridAchievement {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
  points: number;
  is_real_user: boolean;
  data_source: "mock" | "real" | "hybrid";
}

export interface HybridChallenge {
  id: number;
  title: string;
  description: string;
  challengeType: string;
  targetItems?: number;
  targetCo2?: number;
  targetParticipants?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFeatured: boolean;
  difficultyLevel: "easy" | "medium" | "hard";
  rewardPoints: number;
  participants: number;
  progress?: number;
  joined?: boolean;
  completed?: boolean;
  is_real_user: boolean;
  data_source: "mock" | "real" | "hybrid";
}

export interface DataSourceConfig {
  enableRealTimeData: boolean;
  enableMockData: boolean;
  mockDataWeight: number; // 0-1, how much mock data to include
  realDataWeight: number; // 0-1, how much real data to include
  fallbackToMock: boolean;
  cacheTimeout: number; // milliseconds
}

export interface HybridDataStats {
  totalEntries: number;
  mockEntries: number;
  realEntries: number;
  hybridEntries: number;
  lastUpdated: Date;
  dataQuality: "excellent" | "good" | "fair" | "poor";
}

// ============================================================================
// HYBRID DATA SERVICE
// ============================================================================

export class HybridDataService {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private realTimeService: CommunityService | null = null;
  private logger: ILogger;
  private config: DataSourceConfig;

  constructor(
    realTimeService?: CommunityService,
    logger?: ILogger,
    config?: Partial<DataSourceConfig>
  ) {
    this.realTimeService = realTimeService || null;
    this.logger = logger || this.createDefaultLogger();
    this.config = {
      enableRealTimeData: true,
      enableMockData: false, // Disable mock data for real-time experience
      mockDataWeight: 0.0, // No mock data
      realDataWeight: 1.0, // 100% real data
      fallbackToMock: false, // Don't fallback to mock data
      cacheTimeout: 30000, // 30 seconds
      ...config,
    };
  }

  // ============================================================================
  // LEADERBOARD METHODS
  // ============================================================================

  async getHybridLeaderboard(
    limit: number = 10,
    timePeriod: string = "7d",
    userId?: string
  ): Promise<{
    entries: HybridLeaderboardEntry[];
    stats: HybridDataStats;
  }> {
    try {
      this.logger.info("Fetching hybrid leaderboard", {
        limit,
        timePeriod,
        userId,
      });

      const cacheKey = `leaderboard_${limit}_${timePeriod}_${userId || "all"}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch data from both sources in parallel
      const [mockData, realData] = await Promise.allSettled([
        this.getMockLeaderboard(limit, timePeriod),
        this.getRealLeaderboard(limit, timePeriod, userId),
      ]);

      // Process and merge data
      const hybridEntries = this.mergeLeaderboardData(
        mockData.status === "fulfilled" ? mockData.value : [],
        realData.status === "fulfilled" ? realData.value : [],
        limit
      );

      // Calculate stats
      const stats = this.calculateDataStats(hybridEntries);

      const result = { entries: hybridEntries, stats };
      this.setCachedData(cacheKey, result);

      this.logger.info("Hybrid leaderboard fetched successfully", {
        totalEntries: hybridEntries.length,
        mockEntries: stats.mockEntries,
        realEntries: stats.realEntries,
      });

      return result;
    } catch (error) {
      this.logger.error("Failed to fetch hybrid leaderboard", { error });

      // Fallback to mock data if configured
      if (this.config.fallbackToMock) {
        this.logger.warn("Falling back to mock data for leaderboard");
        const mockData = await this.getMockLeaderboard(limit, timePeriod);
        const hybridEntries = mockData.map((entry) =>
          this.convertToHybridEntry(entry, "mock")
        );
        const stats = this.calculateDataStats(hybridEntries);
        return { entries: hybridEntries, stats };
      }

      throw error;
    }
  }

  // ============================================================================
  // ACHIEVEMENT METHODS
  // ============================================================================

  async getHybridAchievements(userId: string): Promise<{
    achievements: HybridAchievement[];
    stats: HybridDataStats;
  }> {
    try {
      this.logger.info("Fetching hybrid achievements", { userId });

      const cacheKey = `achievements_${userId}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch data from both sources
      const [mockData, realData] = await Promise.allSettled([
        this.getMockAchievements(userId),
        this.getRealAchievements(userId),
      ]);

      // Process and merge data
      const hybridAchievements = this.mergeAchievementData(
        mockData.status === "fulfilled" ? mockData.value : [],
        realData.status === "fulfilled" ? realData.value : []
      );

      const stats = this.calculateDataStats(hybridAchievements);
      const result = { achievements: hybridAchievements, stats };

      this.setCachedData(cacheKey, result);

      this.logger.info("Hybrid achievements fetched successfully", {
        totalAchievements: hybridAchievements.length,
        unlockedCount: hybridAchievements.filter((a) => a.unlocked).length,
      });

      return result;
    } catch (error) {
      this.logger.error("Failed to fetch hybrid achievements", { error });

      if (this.config.fallbackToMock) {
        this.logger.warn("Falling back to mock data for achievements");
        const mockData = await this.getMockAchievements(userId);
        const hybridAchievements = mockData.map((achievement) =>
          this.convertToHybridAchievement(achievement, "mock")
        );
        const stats = this.calculateDataStats(hybridAchievements);
        return { achievements: hybridAchievements, stats };
      }

      throw error;
    }
  }

  // ============================================================================
  // CHALLENGE METHODS
  // ============================================================================

  async getHybridChallenges(
    featuredOnly: boolean = false,
    userId?: string
  ): Promise<{
    challenges: HybridChallenge[];
    stats: HybridDataStats;
  }> {
    try {
      this.logger.info("Fetching hybrid challenges", { featuredOnly, userId });

      const cacheKey = `challenges_${featuredOnly}_${userId || "all"}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch data from both sources
      const [mockData, realData] = await Promise.allSettled([
        this.getMockChallenges(featuredOnly),
        this.getRealChallenges(featuredOnly, userId),
      ]);

      // Process and merge data
      const hybridChallenges = this.mergeChallengeData(
        mockData.status === "fulfilled" ? mockData.value : [],
        realData.status === "fulfilled" ? realData.value : []
      );

      const stats = this.calculateDataStats(hybridChallenges);
      const result = { challenges: hybridChallenges, stats };

      this.setCachedData(cacheKey, result);

      this.logger.info("Hybrid challenges fetched successfully", {
        totalChallenges: hybridChallenges.length,
        activeChallenges: hybridChallenges.filter((c) => c.isActive).length,
      });

      return result;
    } catch (error) {
      this.logger.error("Failed to fetch hybrid challenges", { error });

      if (this.config.fallbackToMock) {
        this.logger.warn("Falling back to mock data for challenges");
        const mockData = await this.getMockChallenges(featuredOnly);
        const hybridChallenges = mockData.map((challenge) =>
          this.convertToHybridChallenge(challenge, "mock")
        );
        const stats = this.calculateDataStats(hybridChallenges);
        return { challenges: hybridChallenges, stats };
      }

      throw error;
    }
  }

  // ============================================================================
  // USER STATS METHODS
  // ============================================================================

  async getHybridUserStats(userId: string): Promise<{
    stats: any;
    isRealUser: boolean;
    dataSource: "mock" | "real" | "hybrid";
  }> {
    try {
      this.logger.info("Fetching hybrid user stats", { userId });

      const cacheKey = `user_stats_${userId}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Try to get real user stats first
      if (this.config.enableRealTimeData && this.realTimeService) {
        try {
          const realStats = await this.getRealUserStats(userId);
          if (realStats) {
            const result = {
              stats: realStats,
              isRealUser: true,
              dataSource: "real" as const,
            };
            this.setCachedData(cacheKey, result);
            return result;
          }
        } catch (error) {
          this.logger.warn(
            "Failed to fetch real user stats, falling back to mock",
            { error }
          );
        }
      }

      // Fallback to mock data
      const mockStats = await this.getMockUserStats(userId);
      const result = {
        stats: mockStats,
        isRealUser: false,
        dataSource: "mock" as const,
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error("Failed to fetch hybrid user stats", { error });
      throw error;
    }
  }

  // ============================================================================
  // DATA MERGING AND PROCESSING
  // ============================================================================

  private mergeLeaderboardData(
    mockData: MockLeaderboardEntry[],
    realData: any[],
    limit: number
  ): HybridLeaderboardEntry[] {
    // Convert mock data to hybrid format
    const mockHybrid = mockData.map((entry) =>
      this.convertToHybridEntry(entry, "mock")
    );

    // Convert real data to hybrid format
    const realHybrid = realData.map((entry) =>
      this.convertToHybridEntry(entry, "real")
    );

    // Merge and deduplicate
    const allEntries = [...mockHybrid, ...realHybrid];
    const uniqueEntries = this.deduplicateEntries(allEntries);

    // Sort by points and apply weights
    const sortedEntries = this.applyDataWeights(uniqueEntries);

    // Limit results
    return sortedEntries.slice(0, limit);
  }

  private mergeAchievementData(
    mockData: MockAchievement[],
    realData: any[]
  ): HybridAchievement[] {
    // Convert mock data
    const mockHybrid = mockData.map((achievement) =>
      this.convertToHybridAchievement(achievement, "mock")
    );

    // Convert real data
    const realHybrid = realData.map((achievement) =>
      this.convertToHybridAchievement(achievement, "real")
    );

    // Merge and deduplicate
    const allAchievements = [...mockHybrid, ...realHybrid];
    return this.deduplicateAchievements(allAchievements);
  }

  private mergeChallengeData(
    mockData: MockChallenge[],
    realData: any[]
  ): HybridChallenge[] {
    // Convert mock data
    const mockHybrid = mockData.map((challenge) =>
      this.convertToHybridChallenge(challenge, "mock")
    );

    // Convert real data
    const realHybrid = realData.map((challenge) =>
      this.convertToHybridChallenge(challenge, "real")
    );

    // Merge and deduplicate
    const allChallenges = [...mockHybrid, ...realHybrid];
    return this.deduplicateChallenges(allChallenges);
  }

  // ============================================================================
  // DATA CONVERSION METHODS
  // ============================================================================

  private convertToHybridEntry(
    entry: MockLeaderboardEntry | any,
    source: "mock" | "real"
  ): HybridLeaderboardEntry {
    return {
      user_id: entry.user_id || entry.id,
      user_name: entry.user_name || entry.name || "Anonymous",
      avatar_url: entry.avatar_url || entry.avatar,
      total_items_sorted:
        entry.total_items_sorted || entry.totalItemsSorted || 0,
      total_co2_saved: entry.total_co2_saved || entry.totalCo2Saved || 0,
      total_points: entry.total_points || entry.totalPoints || 0,
      rank_position: entry.rank_position || entry.rank || 0,
      is_real_user: source === "real",
      data_source: source,
      last_updated: new Date(),
    };
  }

  private convertToHybridAchievement(
    achievement: MockAchievement | any,
    source: "mock" | "real"
  ): HybridAchievement {
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      rarity: achievement.rarity,
      progress: achievement.progress,
      maxProgress: achievement.maxProgress,
      unlocked: achievement.unlocked,
      unlockedAt: achievement.unlockedAt,
      icon: achievement.icon,
      points: achievement.points,
      is_real_user: source === "real",
      data_source: source,
    };
  }

  private convertToHybridChallenge(
    challenge: MockChallenge | any,
    source: "mock" | "real"
  ): HybridChallenge {
    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      challengeType: challenge.challengeType || challenge.challenge_type,
      targetItems: challenge.targetItems || challenge.target_items,
      targetCo2: challenge.targetCo2 || challenge.target_co2,
      targetParticipants:
        challenge.targetParticipants || challenge.target_participants,
      startDate: challenge.startDate || challenge.start_date,
      endDate: challenge.endDate || challenge.end_date,
      isActive: challenge.isActive || challenge.is_active,
      isFeatured: challenge.isFeatured || challenge.is_featured,
      difficultyLevel: challenge.difficultyLevel || challenge.difficulty_level,
      rewardPoints: challenge.rewardPoints || challenge.reward_points,
      participants: challenge.participants,
      progress: challenge.progress,
      joined: challenge.joined,
      completed: challenge.completed,
      is_real_user: source === "real",
      data_source: source,
    };
  }

  // ============================================================================
  // DEDUPLICATION AND WEIGHTING
  // ============================================================================

  private deduplicateEntries(
    entries: HybridLeaderboardEntry[]
  ): HybridLeaderboardEntry[] {
    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = entry.user_id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private deduplicateAchievements(
    achievements: HybridAchievement[]
  ): HybridAchievement[] {
    const seen = new Set<string>();
    return achievements.filter((achievement) => {
      const key = achievement.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private deduplicateChallenges(
    challenges: HybridChallenge[]
  ): HybridChallenge[] {
    const seen = new Set<number>();
    return challenges.filter((challenge) => {
      const key = challenge.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private applyDataWeights(
    entries: HybridLeaderboardEntry[]
  ): HybridLeaderboardEntry[] {
    // Apply weights to balance mock and real data
    const weightedEntries = entries.map((entry) => {
      let weight = 1;

      if (entry.data_source === "mock") {
        weight = this.config.mockDataWeight;
      } else if (entry.data_source === "real") {
        weight = this.config.realDataWeight;
      }

      return {
        ...entry,
        total_points: Math.round(entry.total_points * weight),
      };
    });

    // Sort by weighted points
    return weightedEntries.sort((a, b) => b.total_points - a.total_points);
  }

  // ============================================================================
  // DATA SOURCE METHODS
  // ============================================================================

  private async getMockLeaderboard(
    limit: number,
    timePeriod: string
  ): Promise<MockLeaderboardEntry[]> {
    return MockDataService.getLeaderboard(limit, timePeriod);
  }

  private async getRealLeaderboard(
    _limit: number,
    _timePeriod: string,
    _userId?: string
  ): Promise<any[]> {
    if (!this.realTimeService) {
      throw new Error("Real-time service not available");
    }

    // This would integrate with your real CommunityService
    // For now, return empty array as placeholder
    return [];
  }

  private async getMockAchievements(
    userId: string
  ): Promise<MockAchievement[]> {
    return MockDataService.getAchievements(userId);
  }

  private async getRealAchievements(_userId: string): Promise<any[]> {
    if (!this.realTimeService) {
      throw new Error("Real-time service not available");
    }

    // This would integrate with your real CommunityService
    return [];
  }

  private async getMockChallenges(
    featuredOnly: boolean
  ): Promise<MockChallenge[]> {
    return MockDataService.getChallenges(featuredOnly);
  }

  private async getRealChallenges(
    _featuredOnly: boolean,
    _userId?: string
  ): Promise<any[]> {
    if (!this.realTimeService) {
      throw new Error("Real-time service not available");
    }

    // This would integrate with your real CommunityService
    return [];
  }

  private async getMockUserStats(userId: string): Promise<any> {
    return MockDataService.getUserStats(userId);
  }

  private async getRealUserStats(_userId: string): Promise<any> {
    if (!this.realTimeService) {
      throw new Error("Real-time service not available");
    }

    // This would integrate with your real CommunityService
    return null;
  }

  // ============================================================================
  // CACHING AND UTILITIES
  // ============================================================================

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTimeout,
    });
  }

  private calculateDataStats(entries: any[]): HybridDataStats {
    const mockEntries = entries.filter((e) => e.data_source === "mock").length;
    const realEntries = entries.filter((e) => e.data_source === "real").length;
    const hybridEntries = entries.filter(
      (e) => e.data_source === "hybrid"
    ).length;

    const totalEntries = entries.length;
    let dataQuality: "excellent" | "good" | "fair" | "poor" = "poor";

    if (totalEntries > 0) {
      const realDataRatio = realEntries / totalEntries;
      if (realDataRatio > 0.7) dataQuality = "excellent";
      else if (realDataRatio > 0.4) dataQuality = "good";
      else if (realDataRatio > 0.1) dataQuality = "fair";
    }

    return {
      totalEntries,
      mockEntries,
      realEntries,
      hybridEntries,
      lastUpdated: new Date(),
      dataQuality,
    };
  }

  private createDefaultLogger(): ILogger {
    return {
      info: (message: string, meta?: any) =>
        console.log(`[HybridDataService] ${message}`, meta || ""),
      error: (message: string, meta?: any) =>
        console.error(`[HybridDataService] ${message}`, meta || ""),
      warn: (message: string, meta?: any) =>
        console.warn(`[HybridDataService] ${message}`, meta || ""),
      debug: (message: string, meta?: any) =>
        console.debug(`[HybridDataService] ${message}`, meta || ""),
    };
  }

  // ============================================================================
  // CONFIGURATION METHODS
  // ============================================================================

  updateConfig(newConfig: Partial<DataSourceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info("Configuration updated", this.config);
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.info("Cache cleared");
  }

  getConfig(): DataSourceConfig {
    return { ...this.config };
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const hybridDataService = new HybridDataService();
