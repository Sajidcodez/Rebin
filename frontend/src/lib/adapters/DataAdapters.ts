/**
 * Data Adapters
 * Normalize data formats between mock and real-time sources
 * Ensures consistent data structure across the application
 */

import {
  MockLeaderboardEntry,
  MockAchievement,
  MockChallenge,
} from "../mockData";

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface NormalizedLeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  totalItemsSorted: number;
  totalCo2Saved: number;
  totalPoints: number;
  rank: number;
  isRealUser: boolean;
  dataSource: "mock" | "real" | "hybrid";
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

export interface NormalizedAchievement {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  icon: string;
  points: number;
  isRealUser: boolean;
  dataSource: "mock" | "real" | "hybrid";
  metadata?: Record<string, any>;
}

export interface NormalizedChallenge {
  id: string;
  title: string;
  description: string;
  challengeType: string;
  targetItems?: number;
  targetCo2?: number;
  targetParticipants?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isFeatured: boolean;
  difficultyLevel: "easy" | "medium" | "hard";
  rewardPoints: number;
  participants: number;
  progress?: number;
  joined?: boolean;
  completed?: boolean;
  isRealUser: boolean;
  dataSource: "mock" | "real" | "hybrid";
  metadata?: Record<string, any>;
}

export interface NormalizedUserStats {
  totalItemsSorted: number;
  totalCo2Saved: number;
  totalPoints: number;
  rankPosition: number;
  streakDays: number;
  achievementCount: number;
  isRealUser: boolean;
  dataSource: "mock" | "real" | "hybrid";
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// LEADERBOARD ADAPTER
// ============================================================================

export class LeaderboardAdapter {
  /**
   * Normalize mock leaderboard entry to standard format
   */
  static normalizeMockEntry(
    entry: MockLeaderboardEntry
  ): NormalizedLeaderboardEntry {
    return {
      id: entry.user_id,
      name: entry.user_name,
      avatar: entry.avatar_url,
      totalItemsSorted: entry.total_items_sorted,
      totalCo2Saved: entry.total_co2_saved,
      totalPoints: entry.total_points,
      rank: entry.rank_position,
      isRealUser: false,
      dataSource: "mock",
      lastUpdated: new Date(),
      metadata: {
        originalFormat: "mock",
        normalizedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Normalize real leaderboard entry to standard format
   */
  static normalizeRealEntry(entry: any): NormalizedLeaderboardEntry {
    return {
      id: entry.user_id || entry.id || entry.userId,
      name: entry.user_name || entry.name || entry.username || "Anonymous",
      avatar: entry.avatar_url || entry.avatar || entry.profilePicture,
      totalItemsSorted:
        entry.total_items_sorted ||
        entry.totalItemsSorted ||
        entry.itemsSorted ||
        0,
      totalCo2Saved:
        entry.total_co2_saved || entry.totalCo2Saved || entry.co2Saved || 0,
      totalPoints:
        entry.total_points ||
        entry.totalPoints ||
        entry.score ||
        entry.points ||
        0,
      rank: entry.rank_position || entry.rank || entry.position || 0,
      isRealUser: true,
      dataSource: "real",
      lastUpdated: new Date(),
      metadata: {
        originalFormat: "real",
        normalizedAt: new Date().toISOString(),
        originalData: entry,
      },
    };
  }

  /**
   * Create hybrid entry from multiple sources
   */
  static createHybridEntry(
    mockEntry: MockLeaderboardEntry,
    realEntry?: any
  ): NormalizedLeaderboardEntry {
    const baseEntry = this.normalizeMockEntry(mockEntry);

    if (realEntry) {
      const realNormalized = this.normalizeRealEntry(realEntry);

      // Merge data, prioritizing real data where available
      return {
        ...baseEntry,
        id: realNormalized.id,
        name: realNormalized.name,
        avatar: realNormalized.avatar || baseEntry.avatar,
        totalItemsSorted: Math.max(
          baseEntry.totalItemsSorted,
          realNormalized.totalItemsSorted
        ),
        totalCo2Saved: Math.max(
          baseEntry.totalCo2Saved,
          realNormalized.totalCo2Saved
        ),
        totalPoints: Math.max(
          baseEntry.totalPoints,
          realNormalized.totalPoints
        ),
        rank: realNormalized.rank || baseEntry.rank,
        isRealUser: true,
        dataSource: "hybrid",
        metadata: {
          ...baseEntry.metadata,
          ...realNormalized.metadata,
          hybridCreatedAt: new Date().toISOString(),
          mockData: baseEntry,
          realData: realNormalized,
        },
      };
    }

    return baseEntry;
  }

  /**
   * Validate and sanitize leaderboard entry
   */
  static validateEntry(entry: any): boolean {
    const requiredFields = [
      "id",
      "name",
      "totalItemsSorted",
      "totalCo2Saved",
      "totalPoints",
    ];
    return requiredFields.every(
      (field) =>
        entry[field] !== undefined &&
        entry[field] !== null &&
        (typeof entry[field] === "number" ? entry[field] >= 0 : true)
    );
  }

  /**
   * Sort entries by points with tie-breaking
   */
  static sortEntries(
    entries: NormalizedLeaderboardEntry[]
  ): NormalizedLeaderboardEntry[] {
    return entries.sort((a, b) => {
      // Primary sort: total points
      if (a.totalPoints !== b.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      // Secondary sort: CO2 saved
      if (a.totalCo2Saved !== b.totalCo2Saved) {
        return b.totalCo2Saved - a.totalCo2Saved;
      }

      // Tertiary sort: items sorted
      if (a.totalItemsSorted !== b.totalItemsSorted) {
        return b.totalItemsSorted - a.totalItemsSorted;
      }

      // Final sort: last updated (most recent first)
      return b.lastUpdated.getTime() - a.lastUpdated.getTime();
    });
  }

  /**
   * Update ranks after sorting
   */
  static updateRanks(
    entries: NormalizedLeaderboardEntry[]
  ): NormalizedLeaderboardEntry[] {
    return entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }
}

// ============================================================================
// ACHIEVEMENT ADAPTER
// ============================================================================

export class AchievementAdapter {
  /**
   * Normalize mock achievement to standard format
   */
  static normalizeMockAchievement(
    achievement: MockAchievement
  ): NormalizedAchievement {
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      rarity: achievement.rarity,
      progress: achievement.progress,
      maxProgress: achievement.maxProgress,
      unlocked: achievement.unlocked,
      unlockedAt: achievement.unlockedAt
        ? new Date(achievement.unlockedAt)
        : undefined,
      icon: achievement.icon,
      points: achievement.points,
      isRealUser: false,
      dataSource: "mock",
      metadata: {
        originalFormat: "mock",
        normalizedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Normalize real achievement to standard format
   */
  static normalizeRealAchievement(achievement: any): NormalizedAchievement {
    return {
      id: achievement.id || achievement.achievement_id,
      name: achievement.name || achievement.title,
      description: achievement.description || achievement.desc,
      category: achievement.category || achievement.type || "general",
      rarity: this.normalizeRarity(achievement.rarity || achievement.level),
      progress: achievement.progress || achievement.current_progress || 0,
      maxProgress:
        achievement.maxProgress ||
        achievement.target_progress ||
        achievement.target ||
        1,
      unlocked: achievement.unlocked || achievement.is_unlocked || false,
      unlockedAt:
        achievement.unlockedAt || achievement.unlocked_at
          ? new Date(achievement.unlockedAt || achievement.unlocked_at)
          : undefined,
      icon: achievement.icon || achievement.emoji || "🏆",
      points: achievement.points || achievement.reward_points || 0,
      isRealUser: true,
      dataSource: "real",
      metadata: {
        originalFormat: "real",
        normalizedAt: new Date().toISOString(),
        originalData: achievement,
      },
    };
  }

  /**
   * Create hybrid achievement from multiple sources
   */
  static createHybridAchievement(
    mockAchievement: MockAchievement,
    realAchievement?: any
  ): NormalizedAchievement {
    const baseAchievement = this.normalizeMockAchievement(mockAchievement);

    if (realAchievement) {
      const realNormalized = this.normalizeRealAchievement(realAchievement);

      // Merge data, prioritizing real data for user-specific fields
      return {
        ...baseAchievement,
        progress: realNormalized.progress,
        unlocked: realNormalized.unlocked,
        unlockedAt: realNormalized.unlockedAt,
        isRealUser: true,
        dataSource: "hybrid",
        metadata: {
          ...baseAchievement.metadata,
          ...realNormalized.metadata,
          hybridCreatedAt: new Date().toISOString(),
          mockData: baseAchievement,
          realData: realNormalized,
        },
      };
    }

    return baseAchievement;
  }

  /**
   * Normalize rarity string to standard format
   */
  private static normalizeRarity(
    rarity: any
  ): "common" | "rare" | "epic" | "legendary" {
    if (!rarity) return "common";

    const rarityStr = rarity.toString().toLowerCase();
    if (rarityStr.includes("legendary")) return "legendary";
    if (rarityStr.includes("epic")) return "epic";
    if (rarityStr.includes("rare")) return "rare";
    return "common";
  }

  /**
   * Calculate achievement progress percentage
   */
  static calculateProgressPercentage(
    achievement: NormalizedAchievement
  ): number {
    if (achievement.maxProgress <= 0) return 0;
    return Math.min(
      100,
      Math.round((achievement.progress / achievement.maxProgress) * 100)
    );
  }

  /**
   * Check if achievement is close to completion
   */
  static isNearCompletion(
    achievement: NormalizedAchievement,
    threshold: number = 80
  ): boolean {
    return this.calculateProgressPercentage(achievement) >= threshold;
  }
}

// ============================================================================
// CHALLENGE ADAPTER
// ============================================================================

export class ChallengeAdapter {
  /**
   * Normalize mock challenge to standard format
   */
  static normalizeMockChallenge(challenge: MockChallenge): NormalizedChallenge {
    return {
      id: challenge.id.toString(),
      title: challenge.title,
      description: challenge.description,
      challengeType: challenge.challengeType,
      targetItems: challenge.targetItems,
      targetCo2: challenge.targetCo2,
      targetParticipants: challenge.targetParticipants,
      startDate: new Date(challenge.startDate),
      endDate: new Date(challenge.endDate),
      isActive: challenge.isActive,
      isFeatured: challenge.isFeatured,
      difficultyLevel: challenge.difficultyLevel,
      rewardPoints: challenge.rewardPoints,
      participants: challenge.participants,
      progress: challenge.progress,
      joined: challenge.joined,
      completed: challenge.completed,
      isRealUser: false,
      dataSource: "mock",
      metadata: {
        originalFormat: "mock",
        normalizedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Normalize real challenge to standard format
   */
  static normalizeRealChallenge(challenge: any): NormalizedChallenge {
    return {
      id: challenge.id || challenge.challenge_id,
      title: challenge.title || challenge.name,
      description: challenge.description || challenge.desc,
      challengeType:
        challenge.challengeType || challenge.challenge_type || challenge.type,
      targetItems: challenge.targetItems || challenge.target_items,
      targetCo2: challenge.targetCo2 || challenge.target_co2,
      targetParticipants:
        challenge.targetParticipants || challenge.target_participants,
      startDate: new Date(
        challenge.startDate || challenge.start_date || challenge.created_at
      ),
      endDate: new Date(
        challenge.endDate || challenge.end_date || challenge.expires_at
      ),
      isActive: challenge.isActive || challenge.is_active || challenge.active,
      isFeatured:
        challenge.isFeatured || challenge.is_featured || challenge.featured,
      difficultyLevel: this.normalizeDifficulty(
        challenge.difficultyLevel ||
          challenge.difficulty_level ||
          challenge.difficulty
      ),
      rewardPoints:
        challenge.rewardPoints ||
        challenge.reward_points ||
        challenge.points ||
        0,
      participants: challenge.participants || challenge.participant_count || 0,
      progress: challenge.progress || challenge.user_progress,
      joined: challenge.joined || challenge.is_joined || challenge.user_joined,
      completed:
        challenge.completed ||
        challenge.is_completed ||
        challenge.user_completed,
      isRealUser: true,
      dataSource: "real",
      metadata: {
        originalFormat: "real",
        normalizedAt: new Date().toISOString(),
        originalData: challenge,
      },
    };
  }

  /**
   * Create hybrid challenge from multiple sources
   */
  static createHybridChallenge(
    mockChallenge: MockChallenge,
    realChallenge?: any
  ): NormalizedChallenge {
    const baseChallenge = this.normalizeMockChallenge(mockChallenge);

    if (realChallenge) {
      const realNormalized = this.normalizeRealChallenge(realChallenge);

      // Merge data, prioritizing real data for user-specific fields
      return {
        ...baseChallenge,
        participants: Math.max(
          baseChallenge.participants,
          realNormalized.participants
        ),
        progress: realNormalized.progress,
        joined: realNormalized.joined,
        completed: realNormalized.completed,
        isRealUser: true,
        dataSource: "hybrid",
        metadata: {
          ...baseChallenge.metadata,
          ...realNormalized.metadata,
          hybridCreatedAt: new Date().toISOString(),
          mockData: baseChallenge,
          realData: realNormalized,
        },
      };
    }

    return baseChallenge;
  }

  /**
   * Normalize difficulty level to standard format
   */
  private static normalizeDifficulty(
    difficulty: any
  ): "easy" | "medium" | "hard" {
    if (!difficulty) return "medium";

    const difficultyStr = difficulty.toString().toLowerCase();
    if (difficultyStr.includes("easy") || difficultyStr.includes("beginner"))
      return "easy";
    if (difficultyStr.includes("hard") || difficultyStr.includes("expert"))
      return "hard";
    return "medium";
  }

  /**
   * Check if challenge is currently active
   */
  static isCurrentlyActive(challenge: NormalizedChallenge): boolean {
    const now = new Date();
    return (
      challenge.isActive &&
      challenge.startDate <= now &&
      challenge.endDate >= now
    );
  }

  /**
   * Calculate challenge progress percentage
   */
  static calculateProgressPercentage(challenge: NormalizedChallenge): number {
    if (!challenge.progress) return 0;
    return Math.min(100, Math.max(0, challenge.progress));
  }

  /**
   * Get time remaining for challenge
   */
  static getTimeRemaining(challenge: NormalizedChallenge): {
    days: number;
    hours: number;
    minutes: number;
    isExpired: boolean;
  } {
    const now = new Date();
    const endTime = challenge.endDate.getTime();
    const timeDiff = endTime - now.getTime();

    const isExpired = timeDiff <= 0;
    const days = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
    const hours = Math.max(
      0,
      Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    );
    const minutes = Math.max(
      0,
      Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    );

    return { days, hours, minutes, isExpired };
  }
}

// ============================================================================
// USER STATS ADAPTER
// ============================================================================

export class UserStatsAdapter {
  /**
   * Normalize mock user stats to standard format
   */
  static normalizeMockStats(stats: any): NormalizedUserStats {
    return {
      totalItemsSorted: stats.totalItemsSorted || 0,
      totalCo2Saved: stats.totalCo2Saved || 0,
      totalPoints: stats.totalPoints || 0,
      rankPosition: stats.rankPosition || 0,
      streakDays: stats.streakDays || 0,
      achievementCount: stats.achievementCount || 0,
      isRealUser: false,
      dataSource: "mock",
      lastUpdated: new Date(),
      metadata: {
        originalFormat: "mock",
        normalizedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Normalize real user stats to standard format
   */
  static normalizeRealStats(stats: any): NormalizedUserStats {
    return {
      totalItemsSorted:
        stats.total_items_sorted ||
        stats.totalItemsSorted ||
        stats.items_sorted ||
        0,
      totalCo2Saved:
        stats.total_co2_saved || stats.totalCo2Saved || stats.co2_saved || 0,
      totalPoints:
        stats.total_points ||
        stats.totalPoints ||
        stats.score ||
        stats.points ||
        0,
      rankPosition:
        stats.rank_position || stats.rankPosition || stats.rank || 0,
      streakDays:
        stats.streak_days || stats.streakDays || stats.current_streak || 0,
      achievementCount:
        stats.achievement_count ||
        stats.achievementCount ||
        stats.achievements_unlocked ||
        0,
      isRealUser: true,
      dataSource: "real",
      lastUpdated: new Date(),
      metadata: {
        originalFormat: "real",
        normalizedAt: new Date().toISOString(),
        originalData: stats,
      },
    };
  }

  /**
   * Create hybrid user stats from multiple sources
   */
  static createHybridStats(
    mockStats: any,
    realStats?: any
  ): NormalizedUserStats {
    const baseStats = this.normalizeMockStats(mockStats);

    if (realStats) {
      const realNormalized = this.normalizeRealStats(realStats);

      // Merge data, prioritizing real data
      return {
        ...baseStats,
        totalItemsSorted: realNormalized.totalItemsSorted,
        totalCo2Saved: realNormalized.totalCo2Saved,
        totalPoints: realNormalized.totalPoints,
        rankPosition: realNormalized.rankPosition,
        streakDays: realNormalized.streakDays,
        achievementCount: realNormalized.achievementCount,
        isRealUser: true,
        dataSource: "hybrid",
        metadata: {
          ...baseStats.metadata,
          ...realNormalized.metadata,
          hybridCreatedAt: new Date().toISOString(),
          mockData: baseStats,
          realData: realNormalized,
        },
      };
    }

    return baseStats;
  }

  /**
   * Calculate environmental impact metrics
   */
  static calculateEnvironmentalImpact(stats: NormalizedUserStats): {
    treesEquivalent: number;
    energySaved: number;
    waterSaved: number;
  } {
    const co2Saved = stats.totalCo2Saved;

    return {
      treesEquivalent: Math.round(co2Saved * 0.1), // Rough estimate
      energySaved: Math.round(co2Saved * 2.5), // kWh
      waterSaved: Math.round(co2Saved * 100), // Liters
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export class DataAdapterUtils {
  /**
   * Validate data integrity across all adapters
   */
  static validateDataIntegrity(
    data: any[],
    type: "leaderboard" | "achievement" | "challenge" | "stats"
  ): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;

    return data.every((item) => {
      switch (type) {
        case "leaderboard":
          return LeaderboardAdapter.validateEntry(item);
        case "achievement":
          return item.id && item.name && typeof item.progress === "number";
        case "challenge":
          return item.id && item.title && item.startDate && item.endDate;
        case "stats":
          return (
            typeof item.totalItemsSorted === "number" &&
            typeof item.totalCo2Saved === "number"
          );
        default:
          return false;
      }
    });
  }

  /**
   * Merge arrays of normalized data, removing duplicates
   */
  static mergeNormalizedData<T extends { id: string; dataSource: string }>(
    mockData: T[],
    realData: T[]
  ): T[] {
    const merged = new Map<string, T>();

    // Add mock data first
    mockData.forEach((item) => {
      merged.set(item.id, item);
    });

    // Add or update with real data
    realData.forEach((item) => {
      const existing = merged.get(item.id);
      if (existing) {
        // Create hybrid entry
        merged.set(item.id, {
          ...existing,
          ...item,
          dataSource: "hybrid" as any,
          metadata: {
            ...existing.metadata,
            ...item.metadata,
            hybridCreatedAt: new Date().toISOString(),
          },
        });
      } else {
        merged.set(item.id, item);
      }
    });

    return Array.from(merged.values());
  }

  /**
   * Sort data by relevance and quality
   */
  static sortByRelevance<T extends { dataSource: string; isRealUser: boolean }>(
    data: T[]
  ): T[] {
    return data.sort((a, b) => {
      // Real users first
      if (a.isRealUser && !b.isRealUser) return -1;
      if (!a.isRealUser && b.isRealUser) return 1;

      // Then by data source quality
      const sourceOrder = { real: 3, hybrid: 2, mock: 1 };
      const aOrder = sourceOrder[a.dataSource as keyof typeof sourceOrder] || 0;
      const bOrder = sourceOrder[b.dataSource as keyof typeof sourceOrder] || 0;

      return bOrder - aOrder;
    });
  }
}
