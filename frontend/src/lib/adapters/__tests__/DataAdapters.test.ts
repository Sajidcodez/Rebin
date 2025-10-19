/**
 * Data Adapters Tests
 * Comprehensive test suite for data normalization and transformation
 */

import {
  LeaderboardAdapter,
  AchievementAdapter,
  ChallengeAdapter,
  UserStatsAdapter,
  DataAdapterUtils,
  NormalizedLeaderboardEntry,
  NormalizedAchievement,
  NormalizedChallenge,
  NormalizedUserStats,
} from "../DataAdapters";
import {
  MockLeaderboardEntry,
  MockAchievement,
  MockChallenge,
} from "../../mockData";

describe("LeaderboardAdapter", () => {
  describe("normalizeMockEntry", () => {
    it("should normalize mock leaderboard entry correctly", () => {
      const mockEntry: MockLeaderboardEntry = {
        user_id: "user-123",
        user_name: "Test User",
        avatar_url: "https://example.com/avatar.jpg",
        total_items_sorted: 100,
        total_co2_saved: 5.0,
        total_points: 1000,
        rank_position: 1,
      };

      const result = LeaderboardAdapter.normalizeMockEntry(mockEntry);

      expect(result).toEqual({
        id: "user-123",
        name: "Test User",
        avatar: "https://example.com/avatar.jpg",
        totalItemsSorted: 100,
        totalCo2Saved: 5.0,
        totalPoints: 1000,
        rank: 1,
        isRealUser: false,
        dataSource: "mock",
        lastUpdated: expect.any(Date),
        metadata: {
          originalFormat: "mock",
          normalizedAt: expect.any(String),
        },
      });
    });

    it("should handle missing optional fields", () => {
      const mockEntry: MockLeaderboardEntry = {
        user_id: "user-123",
        user_name: "Test User",
        total_items_sorted: 100,
        total_co2_saved: 5.0,
        total_points: 1000,
        rank_position: 1,
      };

      const result = LeaderboardAdapter.normalizeMockEntry(mockEntry);

      expect(result.avatar).toBeUndefined();
      expect(result.name).toBe("Test User");
    });
  });

  describe("normalizeRealEntry", () => {
    it("should normalize real leaderboard entry correctly", () => {
      const realEntry = {
        user_id: "user-456",
        name: "Real User",
        profilePicture: "https://example.com/real-avatar.jpg",
        itemsSorted: 150,
        co2Saved: 7.5,
        score: 1500,
        position: 2,
      };

      const result = LeaderboardAdapter.normalizeRealEntry(realEntry);

      expect(result).toEqual({
        id: "user-456",
        name: "Real User",
        avatar: "https://example.com/real-avatar.jpg",
        totalItemsSorted: 150,
        totalCo2Saved: 7.5,
        totalPoints: 1500,
        rank: 2,
        isRealUser: true,
        dataSource: "real",
        lastUpdated: expect.any(Date),
        metadata: {
          originalFormat: "real",
          normalizedAt: expect.any(String),
          originalData: realEntry,
        },
      });
    });

    it("should handle various real data formats", () => {
      const realEntry = {
        id: "user-789",
        username: "Another User",
        totalItemsSorted: 200,
        totalCo2Saved: 10.0,
        points: 2000,
        rank: 3,
      };

      const result = LeaderboardAdapter.normalizeRealEntry(realEntry);

      expect(result.id).toBe("user-789");
      expect(result.name).toBe("Another User");
      expect(result.totalItemsSorted).toBe(200);
      expect(result.isRealUser).toBe(true);
    });
  });

  describe("createHybridEntry", () => {
    it("should merge mock and real data correctly", () => {
      const mockEntry: MockLeaderboardEntry = {
        user_id: "user-123",
        user_name: "Test User",
        total_items_sorted: 100,
        total_co2_saved: 5.0,
        total_points: 1000,
        rank_position: 1,
      };

      const realEntry = {
        user_id: "user-123",
        name: "Test User",
        itemsSorted: 150,
        co2Saved: 7.5,
        score: 1500,
        position: 1,
      };

      const result = LeaderboardAdapter.createHybridEntry(mockEntry, realEntry);

      expect(result.id).toBe("user-123");
      expect(result.name).toBe("Test User");
      expect(result.totalItemsSorted).toBe(150); // Real data takes precedence
      expect(result.totalCo2Saved).toBe(7.5);
      expect(result.totalPoints).toBe(1500);
      expect(result.isRealUser).toBe(true);
      expect(result.dataSource).toBe("hybrid");
      expect(result.metadata?.hybridCreatedAt).toBeDefined();
    });

    it("should handle mock data only", () => {
      const mockEntry: MockLeaderboardEntry = {
        user_id: "user-123",
        user_name: "Test User",
        total_items_sorted: 100,
        total_co2_saved: 5.0,
        total_points: 1000,
        rank_position: 1,
      };

      const result = LeaderboardAdapter.createHybridEntry(mockEntry);

      expect(result.id).toBe("user-123");
      expect(result.isRealUser).toBe(false);
      expect(result.dataSource).toBe("mock");
    });
  });

  describe("validateEntry", () => {
    it("should validate correct entries", () => {
      const validEntry = {
        id: "user-123",
        name: "Test User",
        totalItemsSorted: 100,
        totalCo2Saved: 5.0,
        totalPoints: 1000,
      };

      expect(LeaderboardAdapter.validateEntry(validEntry)).toBe(true);
    });

    it("should reject invalid entries", () => {
      const invalidEntry = {
        id: "user-123",
        name: "Test User",
        totalItemsSorted: -1, // Invalid negative value
        totalCo2Saved: 5.0,
        totalPoints: 1000,
      };

      expect(LeaderboardAdapter.validateEntry(invalidEntry)).toBe(false);
    });

    it("should reject entries with missing required fields", () => {
      const incompleteEntry = {
        id: "user-123",
        name: "Test User",
        // Missing required fields
      };

      expect(LeaderboardAdapter.validateEntry(incompleteEntry)).toBe(false);
    });
  });

  describe("sortEntries", () => {
    it("should sort entries by points correctly", () => {
      const entries: NormalizedLeaderboardEntry[] = [
        {
          id: "user-1",
          name: "User 1",
          totalItemsSorted: 100,
          totalCo2Saved: 5.0,
          totalPoints: 1000,
          rank: 1,
          isRealUser: false,
          dataSource: "mock",
          lastUpdated: new Date(),
        },
        {
          id: "user-2",
          name: "User 2",
          totalItemsSorted: 150,
          totalCo2Saved: 7.5,
          totalPoints: 1500,
          rank: 2,
          isRealUser: false,
          dataSource: "mock",
          lastUpdated: new Date(),
        },
      ];

      const sorted = LeaderboardAdapter.sortEntries(entries);

      expect(sorted[0].totalPoints).toBe(1500);
      expect(sorted[1].totalPoints).toBe(1000);
    });

    it("should handle tie-breaking correctly", () => {
      const entries: NormalizedLeaderboardEntry[] = [
        {
          id: "user-1",
          name: "User 1",
          totalItemsSorted: 100,
          totalCo2Saved: 5.0,
          totalPoints: 1000,
          rank: 1,
          isRealUser: false,
          dataSource: "mock",
          lastUpdated: new Date(Date.now() - 1000),
        },
        {
          id: "user-2",
          name: "User 2",
          totalItemsSorted: 150,
          totalCo2Saved: 7.5,
          totalPoints: 1000, // Same points
          rank: 2,
          isRealUser: false,
          dataSource: "mock",
          lastUpdated: new Date(),
        },
      ];

      const sorted = LeaderboardAdapter.sortEntries(entries);

      // Should sort by CO2 saved (tie-breaker)
      expect(sorted[0].totalCo2Saved).toBe(7.5);
      expect(sorted[1].totalCo2Saved).toBe(5.0);
    });
  });

  describe("updateRanks", () => {
    it("should update ranks correctly", () => {
      const entries: NormalizedLeaderboardEntry[] = [
        {
          id: "user-1",
          name: "User 1",
          totalItemsSorted: 100,
          totalCo2Saved: 5.0,
          totalPoints: 1500,
          rank: 0, // Will be updated
          isRealUser: false,
          dataSource: "mock",
          lastUpdated: new Date(),
        },
        {
          id: "user-2",
          name: "User 2",
          totalItemsSorted: 150,
          totalCo2Saved: 7.5,
          totalPoints: 1000,
          rank: 0, // Will be updated
          isRealUser: false,
          dataSource: "mock",
          lastUpdated: new Date(),
        },
      ];

      const ranked = LeaderboardAdapter.updateRanks(entries);

      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
    });
  });
});

describe("AchievementAdapter", () => {
  describe("normalizeMockAchievement", () => {
    it("should normalize mock achievement correctly", () => {
      const mockAchievement: MockAchievement = {
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
      };

      const result =
        AchievementAdapter.normalizeMockAchievement(mockAchievement);

      expect(result).toEqual({
        id: "ach-1",
        name: "Test Achievement",
        description: "Test description",
        category: "test",
        rarity: "common",
        progress: 50,
        maxProgress: 100,
        unlocked: false,
        unlockedAt: undefined,
        icon: "🏆",
        points: 100,
        isRealUser: false,
        dataSource: "mock",
        metadata: {
          originalFormat: "mock",
          normalizedAt: expect.any(String),
        },
      });
    });

    it("should handle unlocked achievements", () => {
      const mockAchievement: MockAchievement = {
        id: "ach-1",
        name: "Test Achievement",
        description: "Test description",
        category: "test",
        rarity: "common",
        progress: 100,
        maxProgress: 100,
        unlocked: true,
        unlockedAt: "2024-01-01T00:00:00Z",
        icon: "🏆",
        points: 100,
      };

      const result =
        AchievementAdapter.normalizeMockAchievement(mockAchievement);

      expect(result.unlocked).toBe(true);
      expect(result.unlockedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
    });
  });

  describe("calculateProgressPercentage", () => {
    it("should calculate progress percentage correctly", () => {
      const achievement: NormalizedAchievement = {
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
        isRealUser: false,
        dataSource: "mock",
      };

      const percentage =
        AchievementAdapter.calculateProgressPercentage(achievement);

      expect(percentage).toBe(50);
    });

    it("should handle zero max progress", () => {
      const achievement: NormalizedAchievement = {
        id: "ach-1",
        name: "Test Achievement",
        description: "Test description",
        category: "test",
        rarity: "common",
        progress: 50,
        maxProgress: 0,
        unlocked: false,
        icon: "🏆",
        points: 100,
        isRealUser: false,
        dataSource: "mock",
      };

      const percentage =
        AchievementAdapter.calculateProgressPercentage(achievement);

      expect(percentage).toBe(0);
    });
  });

  describe("isNearCompletion", () => {
    it("should identify achievements near completion", () => {
      const achievement: NormalizedAchievement = {
        id: "ach-1",
        name: "Test Achievement",
        description: "Test description",
        category: "test",
        rarity: "common",
        progress: 85,
        maxProgress: 100,
        unlocked: false,
        icon: "🏆",
        points: 100,
        isRealUser: false,
        dataSource: "mock",
      };

      const isNear = AchievementAdapter.isNearCompletion(achievement, 80);

      expect(isNear).toBe(true);
    });

    it("should not identify achievements far from completion", () => {
      const achievement: NormalizedAchievement = {
        id: "ach-1",
        name: "Test Achievement",
        description: "Test description",
        category: "test",
        rarity: "common",
        progress: 30,
        maxProgress: 100,
        unlocked: false,
        icon: "🏆",
        points: 100,
        isRealUser: false,
        dataSource: "mock",
      };

      const isNear = AchievementAdapter.isNearCompletion(achievement, 80);

      expect(isNear).toBe(false);
    });
  });
});

describe("ChallengeAdapter", () => {
  describe("normalizeMockChallenge", () => {
    it("should normalize mock challenge correctly", () => {
      const mockChallenge: MockChallenge = {
        id: 1,
        title: "Test Challenge",
        description: "Test description",
        challengeType: "recycling",
        targetItems: 100,
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z",
        isActive: true,
        isFeatured: false,
        difficultyLevel: "easy",
        rewardPoints: 100,
        participants: 10,
      };

      const result = ChallengeAdapter.normalizeMockChallenge(mockChallenge);

      expect(result).toEqual({
        id: "1",
        title: "Test Challenge",
        description: "Test description",
        challengeType: "recycling",
        targetItems: 100,
        targetCo2: undefined,
        targetParticipants: undefined,
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate: new Date("2024-01-31T23:59:59Z"),
        isActive: true,
        isFeatured: false,
        difficultyLevel: "easy",
        rewardPoints: 100,
        participants: 10,
        progress: undefined,
        joined: undefined,
        completed: undefined,
        isRealUser: false,
        dataSource: "mock",
        metadata: {
          originalFormat: "mock",
          normalizedAt: expect.any(String),
        },
      });
    });
  });

  describe("isCurrentlyActive", () => {
    it("should identify active challenges", () => {
      const now = new Date();
      const challenge: NormalizedChallenge = {
        id: "1",
        title: "Test Challenge",
        description: "Test description",
        challengeType: "recycling",
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day from now
        isActive: true,
        isFeatured: false,
        difficultyLevel: "easy",
        rewardPoints: 100,
        participants: 10,
        isRealUser: false,
        dataSource: "mock",
      };

      const isActive = ChallengeAdapter.isCurrentlyActive(challenge);

      expect(isActive).toBe(true);
    });

    it("should identify inactive challenges", () => {
      const now = new Date();
      const challenge: NormalizedChallenge = {
        id: "1",
        title: "Test Challenge",
        description: "Test description",
        challengeType: "recycling",
        startDate: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
        endDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago (expired)
        isActive: true,
        isFeatured: false,
        difficultyLevel: "easy",
        rewardPoints: 100,
        participants: 10,
        isRealUser: false,
        dataSource: "mock",
      };

      const isActive = ChallengeAdapter.isCurrentlyActive(challenge);

      expect(isActive).toBe(false);
    });
  });

  describe("getTimeRemaining", () => {
    it("should calculate time remaining correctly", () => {
      const now = new Date();
      const challenge: NormalizedChallenge = {
        id: "1",
        title: "Test Challenge",
        description: "Test description",
        challengeType: "recycling",
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        isActive: true,
        isFeatured: false,
        difficultyLevel: "easy",
        rewardPoints: 100,
        participants: 10,
        isRealUser: false,
        dataSource: "mock",
      };

      const timeRemaining = ChallengeAdapter.getTimeRemaining(challenge);

      expect(timeRemaining.days).toBeGreaterThan(0);
      expect(timeRemaining.isExpired).toBe(false);
    });

    it("should identify expired challenges", () => {
      const now = new Date();
      const challenge: NormalizedChallenge = {
        id: "1",
        title: "Test Challenge",
        description: "Test description",
        challengeType: "recycling",
        startDate: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
        endDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        isActive: true,
        isFeatured: false,
        difficultyLevel: "easy",
        rewardPoints: 100,
        participants: 10,
        isRealUser: false,
        dataSource: "mock",
      };

      const timeRemaining = ChallengeAdapter.getTimeRemaining(challenge);

      expect(timeRemaining.isExpired).toBe(true);
      expect(timeRemaining.days).toBe(0);
    });
  });
});

describe("UserStatsAdapter", () => {
  describe("normalizeMockStats", () => {
    it("should normalize mock user stats correctly", () => {
      const mockStats = {
        totalItemsSorted: 100,
        totalCo2Saved: 5.0,
        totalPoints: 1000,
        rankPosition: 1,
        streakDays: 5,
        achievementCount: 3,
      };

      const result = UserStatsAdapter.normalizeMockStats(mockStats);

      expect(result).toEqual({
        totalItemsSorted: 100,
        totalCo2Saved: 5.0,
        totalPoints: 1000,
        rankPosition: 1,
        streakDays: 5,
        achievementCount: 3,
        isRealUser: false,
        dataSource: "mock",
        lastUpdated: expect.any(Date),
        metadata: {
          originalFormat: "mock",
          normalizedAt: expect.any(String),
        },
      });
    });
  });

  describe("calculateEnvironmentalImpact", () => {
    it("should calculate environmental impact correctly", () => {
      const stats: NormalizedUserStats = {
        totalItemsSorted: 100,
        totalCo2Saved: 10.0,
        totalPoints: 1000,
        rankPosition: 1,
        streakDays: 5,
        achievementCount: 3,
        isRealUser: false,
        dataSource: "mock",
        lastUpdated: new Date(),
      };

      const impact = UserStatsAdapter.calculateEnvironmentalImpact(stats);

      expect(impact.treesEquivalent).toBe(1); // 10 * 0.1
      expect(impact.energySaved).toBe(25); // 10 * 2.5
      expect(impact.waterSaved).toBe(1000); // 10 * 100
    });
  });
});

describe("DataAdapterUtils", () => {
  describe("validateDataIntegrity", () => {
    it("should validate leaderboard data integrity", () => {
      const validData = [
        {
          id: "user-1",
          name: "User 1",
          totalItemsSorted: 100,
          totalCo2Saved: 5.0,
          totalPoints: 1000,
        },
      ];

      expect(
        DataAdapterUtils.validateDataIntegrity(validData, "leaderboard")
      ).toBe(true);
    });

    it("should reject invalid leaderboard data", () => {
      const invalidData = [
        {
          id: "user-1",
          name: "User 1",
          totalItemsSorted: -1, // Invalid
          totalCo2Saved: 5.0,
          totalPoints: 1000,
        },
      ];

      expect(
        DataAdapterUtils.validateDataIntegrity(invalidData, "leaderboard")
      ).toBe(false);
    });

    it("should validate achievement data integrity", () => {
      const validData = [
        {
          id: "ach-1",
          name: "Achievement 1",
          progress: 50,
        },
      ];

      expect(
        DataAdapterUtils.validateDataIntegrity(validData, "achievement")
      ).toBe(true);
    });

    it("should validate challenge data integrity", () => {
      const validData = [
        {
          id: "challenge-1",
          title: "Challenge 1",
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      expect(
        DataAdapterUtils.validateDataIntegrity(validData, "challenge")
      ).toBe(true);
    });

    it("should validate stats data integrity", () => {
      const validData = [
        {
          totalItemsSorted: 100,
          totalCo2Saved: 5.0,
        },
      ];

      expect(DataAdapterUtils.validateDataIntegrity(validData, "stats")).toBe(
        true
      );
    });
  });

  describe("mergeNormalizedData", () => {
    it("should merge data correctly", () => {
      const mockData = [
        { id: "1", name: "Mock Item", dataSource: "mock" },
        { id: "2", name: "Mock Item 2", dataSource: "mock" },
      ];

      const realData = [
        { id: "1", name: "Real Item", dataSource: "real" },
        { id: "3", name: "Real Item 3", dataSource: "real" },
      ];

      const merged = DataAdapterUtils.mergeNormalizedData(mockData, realData);

      expect(merged).toHaveLength(3);
      expect(merged.find((item) => item.id === "1")?.dataSource).toBe("hybrid");
      expect(merged.find((item) => item.id === "2")?.dataSource).toBe("mock");
      expect(merged.find((item) => item.id === "3")?.dataSource).toBe("real");
    });
  });

  describe("sortByRelevance", () => {
    it("should sort by relevance correctly", () => {
      const data = [
        { id: "1", name: "Mock Item", dataSource: "mock", isRealUser: false },
        { id: "2", name: "Real Item", dataSource: "real", isRealUser: true },
        {
          id: "3",
          name: "Hybrid Item",
          dataSource: "hybrid",
          isRealUser: true,
        },
      ];

      const sorted = DataAdapterUtils.sortByRelevance(data);

      expect(sorted[0].dataSource).toBe("real");
      expect(sorted[1].dataSource).toBe("hybrid");
      expect(sorted[2].dataSource).toBe("mock");
    });
  });
});
