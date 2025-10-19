/**
 * Hybrid Data Service Tests
 * Comprehensive test suite for the hybrid data system
 */

import {
  HybridDataService,
  HybridLeaderboardEntry,
  HybridDataStats,
} from "../HybridDataService";
import { MockDataService } from "../../mockData";
import { LeaderboardAdapter } from "../../adapters/DataAdapters";

// Mock the dependencies
jest.mock("../../mockData");
jest.mock("../../adapters/DataAdapters");

describe("HybridDataService", () => {
  let hybridService: HybridDataService;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    hybridService = new HybridDataService(undefined, mockLogger, {
      enableRealTimeData: true,
      enableMockData: true,
      mockDataWeight: 0.6,
      realDataWeight: 0.4,
      fallbackToMock: true,
      cacheTimeout: 30000,
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("getHybridLeaderboard", () => {
    it("should fetch and merge mock and real data", async () => {
      // Mock data
      const mockLeaderboard = [
        {
          user_id: "user-1",
          user_name: "Mock User 1",
          total_items_sorted: 100,
          total_co2_saved: 5.0,
          total_points: 1000,
          rank_position: 1,
        },
      ];

      const realLeaderboard = [
        {
          user_id: "user-2",
          user_name: "Real User 1",
          total_items_sorted: 150,
          total_co2_saved: 7.5,
          total_points: 1500,
          rank_position: 1,
        },
      ];

      // Mock the services
      (MockDataService.getLeaderboard as jest.Mock).mockResolvedValue(
        mockLeaderboard
      );

      // Mock the adapter
      (LeaderboardAdapter.normalizeMockEntry as jest.Mock).mockImplementation(
        (entry) => ({
          id: entry.user_id,
          name: entry.user_name,
          totalItemsSorted: entry.total_items_sorted,
          totalCo2Saved: entry.total_co2_saved,
          totalPoints: entry.total_points,
          rank: entry.rank_position,
          isRealUser: false,
          dataSource: "mock",
          lastUpdated: new Date(),
        })
      );

      (LeaderboardAdapter.sortEntries as jest.Mock).mockImplementation(
        (entries) => entries
      );
      (LeaderboardAdapter.updateRanks as jest.Mock).mockImplementation(
        (entries) => entries
      );

      // Execute
      const result = await hybridService.getHybridLeaderboard(
        10,
        "7d",
        "user-123"
      );

      // Assertions
      expect(result.entries).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.totalEntries).toBeGreaterThan(0);
      expect(MockDataService.getLeaderboard).toHaveBeenCalledWith(10, "7d");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Fetching hybrid leaderboard",
        { limit: 10, timePeriod: "7d", userId: "user-123" }
      );
    });

    it("should fallback to mock data on error", async () => {
      // Mock error
      (MockDataService.getLeaderboard as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      // Execute
      const result = await hybridService.getHybridLeaderboard(
        10,
        "7d",
        "user-123"
      );

      // Should still return data due to fallback
      expect(result.entries).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Falling back to mock data for leaderboard"
      );
    });

    it("should handle empty data gracefully", async () => {
      // Mock empty data
      (MockDataService.getLeaderboard as jest.Mock).mockResolvedValue([]);

      // Execute
      const result = await hybridService.getHybridLeaderboard(
        10,
        "7d",
        "user-123"
      );

      // Assertions
      expect(result.entries).toEqual([]);
      expect(result.stats.totalEntries).toBe(0);
    });

    it("should respect cache timeout", async () => {
      // Mock data
      const mockData = [{ user_id: "user-1", user_name: "Test User" }];
      (MockDataService.getLeaderboard as jest.Mock).mockResolvedValue(mockData);

      // First call
      await hybridService.getHybridLeaderboard(10, "7d", "user-123");

      // Second call should use cache
      await hybridService.getHybridLeaderboard(10, "7d", "user-123");

      // Should only call mock service once due to caching
      expect(MockDataService.getLeaderboard).toHaveBeenCalledTimes(1);
    });
  });

  describe("getHybridAchievements", () => {
    it("should fetch and merge achievement data", async () => {
      // Mock data
      const mockAchievements = [
        {
          id: "ach-1",
          name: "Test Achievement",
          description: "Test description",
          category: "test",
          rarity: "common",
          progress: 50,
          maxProgress: 100,
          unlocked: false,
          icon: "🏆",
          points: 100,
        },
      ];

      (MockDataService.getAchievements as jest.Mock).mockResolvedValue(
        mockAchievements
      );

      // Execute
      const result = await hybridService.getHybridAchievements("user-123");

      // Assertions
      expect(result.achievements).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(MockDataService.getAchievements).toHaveBeenCalledWith("user-123");
    });

    it("should handle achievement errors gracefully", async () => {
      // Mock error
      (MockDataService.getAchievements as jest.Mock).mockRejectedValue(
        new Error("API error")
      );

      // Execute
      const result = await hybridService.getHybridAchievements("user-123");

      // Should fallback to mock data
      expect(result.achievements).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Falling back to mock data for achievements"
      );
    });
  });

  describe("getHybridChallenges", () => {
    it("should fetch and merge challenge data", async () => {
      // Mock data
      const mockChallenges = [
        {
          id: 1,
          title: "Test Challenge",
          description: "Test description",
          challengeType: "recycling",
          isActive: true,
          isFeatured: false,
          difficultyLevel: "easy",
          rewardPoints: 100,
          participants: 10,
        },
      ];

      (MockDataService.getChallenges as jest.Mock).mockResolvedValue(
        mockChallenges
      );

      // Execute
      const result = await hybridService.getHybridChallenges(false, "user-123");

      // Assertions
      expect(result.challenges).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(MockDataService.getChallenges).toHaveBeenCalledWith(false);
    });
  });

  describe("getHybridUserStats", () => {
    it("should fetch user stats with fallback", async () => {
      // Mock data
      const mockStats = {
        totalItemsSorted: 100,
        totalCo2Saved: 5.0,
        totalPoints: 1000,
        rankPosition: 1,
        streakDays: 5,
        achievementCount: 3,
      };

      (MockDataService.getUserStats as jest.Mock).mockResolvedValue(mockStats);

      // Execute
      const result = await hybridService.getHybridUserStats("user-123");

      // Assertions
      expect(result.stats).toBeDefined();
      expect(result.isRealUser).toBe(false);
      expect(result.dataSource).toBe("mock");
      expect(MockDataService.getUserStats).toHaveBeenCalledWith("user-123");
    });
  });

  describe("configuration", () => {
    it("should update configuration", () => {
      const newConfig = {
        mockDataWeight: 0.8,
        realDataWeight: 0.2,
      };

      hybridService.updateConfig(newConfig);
      const config = hybridService.getConfig();

      expect(config.mockDataWeight).toBe(0.8);
      expect(config.realDataWeight).toBe(0.2);
    });

    it("should clear cache", () => {
      hybridService.clearCache();
      expect(mockLogger.info).toHaveBeenCalledWith("Cache cleared");
    });
  });

  describe("error handling", () => {
    it("should handle network errors", async () => {
      // Mock network error
      (MockDataService.getLeaderboard as jest.Mock).mockRejectedValue(
        new Error("Network request failed")
      );

      // Execute
      const result = await hybridService.getHybridLeaderboard(
        10,
        "7d",
        "user-123"
      );

      // Should still return data due to fallback
      expect(result.entries).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to fetch hybrid leaderboard",
        expect.any(Object)
      );
    });

    it("should handle invalid data gracefully", async () => {
      // Mock invalid data
      (MockDataService.getLeaderboard as jest.Mock).mockResolvedValue(null);

      // Execute
      const result = await hybridService.getHybridLeaderboard(
        10,
        "7d",
        "user-123"
      );

      // Should handle gracefully
      expect(result.entries).toBeDefined();
    });
  });

  describe("data quality assessment", () => {
    it("should calculate data quality correctly", async () => {
      // Mock data with mixed sources
      const mockData = [
        { user_id: "user-1", user_name: "Mock User", data_source: "mock" },
        { user_id: "user-2", user_name: "Real User", data_source: "real" },
      ];

      (MockDataService.getLeaderboard as jest.Mock).mockResolvedValue(mockData);

      // Execute
      const result = await hybridService.getHybridLeaderboard(
        10,
        "7d",
        "user-123"
      );

      // Assertions
      expect(result.stats.dataQuality).toBeDefined();
      expect(result.stats.mockEntries).toBeGreaterThan(0);
      expect(result.stats.realEntries).toBeGreaterThanOrEqual(0);
    });
  });

  describe("performance", () => {
    it("should handle concurrent requests", async () => {
      // Mock data
      const mockData = [{ user_id: "user-1", user_name: "Test User" }];
      (MockDataService.getLeaderboard as jest.Mock).mockResolvedValue(mockData);

      // Execute concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() => hybridService.getHybridLeaderboard(10, "7d", "user-123"));

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.entries).toBeDefined();
        expect(result.stats).toBeDefined();
      });
    });

    it("should respect cache timeout", async () => {
      const startTime = Date.now();

      // Mock data
      const mockData = [{ user_id: "user-1", user_name: "Test User" }];
      (MockDataService.getLeaderboard as jest.Mock).mockResolvedValue(mockData);

      // First call
      await hybridService.getHybridLeaderboard(10, "7d", "user-123");

      // Second call should be faster due to cache
      const secondStartTime = Date.now();
      await hybridService.getHybridLeaderboard(10, "7d", "user-123");
      const secondDuration = Date.now() - secondStartTime;

      // Second call should be much faster (cached)
      expect(secondDuration).toBeLessThan(100); // Should be almost instant
    });
  });
});
