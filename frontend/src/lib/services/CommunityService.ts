import {
  ICommunityRepository,
  Challenge,
  ChallengeParticipation,
  LeaderboardEntry,
  Achievement,
  Notification,
  ChallengeFilters,
  LeaderboardFilters,
  RepositoryError,
  NotFoundError,
  BusinessError,
} from "../repositories/CommunityRepository";

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  updateStats(userId: string, stats: UserStats): Promise<void>;
}

export interface IAchievementService {
  checkChallengeAchievements(userId: string): Promise<void>;
  checkStreakAchievements(userId: string): Promise<void>;
  checkSortingAchievements(userId: string): Promise<void>;
  checkCommunityAchievements(userId: string): Promise<void>;
}

export interface INotificationService {
  sendNotification(
    notification: Omit<Notification, "id" | "createdAt">
  ): Promise<void>;
  sendBulkNotifications(
    notifications: Omit<Notification, "id" | "createdAt">[]
  ): Promise<void>;
}

export interface IAnalyticsService {
  track(event: string, properties: Record<string, any>): Promise<void>;
  identify(userId: string, traits: Record<string, any>): Promise<void>;
}

export interface ILogger {
  info(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  location?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  totalItemsSorted: number;
  totalCO2Saved: number;
  currentStreak: number;
  longestStreak: number;
  achievementsUnlocked: number;
  challengesCompleted: number;
  totalScore: number;
}

export interface ChallengeJoinResult {
  success: boolean;
  participation: ChallengeParticipation;
  message: string;
  rewards?: any[];
}

export interface LeaderboardStats {
  totalParticipants: number;
  averageScore: number;
  topScore: number;
  userRank: number;
  userScore: number;
  userTrend: "up" | "down" | "stable";
}

export interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  isUnlocked: boolean;
  requirements: {
    type: string;
    current: number;
    target: number;
    description: string;
  }[];
}

// ============================================================================
// COMMUNITY SERVICE
// ============================================================================

export class CommunityService {
  constructor(
    private communityRepo: ICommunityRepository,
    private userRepo: IUserRepository,
    private achievementService: IAchievementService,
    private notificationService: INotificationService,
    private analyticsService: IAnalyticsService,
    private logger: ILogger
  ) {}

  // ============================================================================
  // CHALLENGE METHODS
  // ============================================================================

  async getChallenges(filters?: ChallengeFilters): Promise<Challenge[]> {
    try {
      this.logger.info("Getting challenges", { filters });

      const challenges = await this.communityRepo.getChallenges(filters);

      // Sort challenges by relevance and activity
      const sortedChallenges = this.sortChallengesByRelevance(challenges);

      this.logger.info("Challenges retrieved successfully", {
        count: sortedChallenges.length,
      });
      return sortedChallenges;
    } catch (error) {
      this.logger.error("Failed to get challenges", { filters, error });
      throw new ServiceError("Failed to retrieve challenges", error);
    }
  }

  async getChallengeById(id: string): Promise<Challenge | null> {
    try {
      this.logger.info("Getting challenge by ID", { id });

      const challenge = await this.communityRepo.getChallengeById(id);

      if (challenge) {
        this.logger.info("Challenge retrieved successfully", {
          id,
          title: challenge.title,
        });
      } else {
        this.logger.warn("Challenge not found", { id });
      }

      return challenge;
    } catch (error) {
      this.logger.error("Failed to get challenge by ID", { id, error });
      throw new ServiceError("Failed to retrieve challenge", error);
    }
  }

  async joinChallenge(
    challengeId: string,
    userId: string
  ): Promise<ChallengeJoinResult> {
    try {
      this.logger.info("User attempting to join challenge", {
        userId,
        challengeId,
      });

      // Business logic validation
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (!user.isActive) {
        throw new BusinessError("User account is not active");
      }

      const challenge = await this.communityRepo.getChallengeById(challengeId);
      if (!challenge) {
        throw new NotFoundError("Challenge not found");
      }

      if (!challenge.isActive) {
        throw new BusinessError("Challenge is not active");
      }

      // Check if challenge has started
      const now = new Date();
      if (now < challenge.startDate) {
        throw new BusinessError("Challenge has not started yet");
      }

      if (now > challenge.endDate) {
        throw new BusinessError("Challenge has ended");
      }

      // Check if user already joined
      const existingParticipation =
        await this.communityRepo.getUserParticipation(userId, challengeId);
      if (existingParticipation) {
        throw new BusinessError("User already joined this challenge");
      }

      // Join challenge
      const participation = await this.communityRepo.joinChallenge(
        challengeId,
        userId
      );

      // Check for achievements
      await this.achievementService.checkChallengeAchievements(userId);

      // Send notification
      await this.notificationService.sendNotification({
        userId,
        type: "challenge",
        title: "Challenge Joined!",
        message: `You've successfully joined "${challenge.title}". Good luck!`,
        action: {
          type: "navigate",
          data: { path: `/challenges/${challengeId}` },
        },
        read: false,
      });

      // Track analytics
      await this.analyticsService.track("challenge_joined", {
        challengeId,
        challengeTitle: challenge.title,
        challengeCategory: challenge.category,
        userId,
      });

      this.logger.info("User successfully joined challenge", {
        userId,
        challengeId,
      });

      return {
        success: true,
        participation,
        message: `Successfully joined "${challenge.title}"!`,
        rewards: challenge.rewards,
      };
    } catch (error) {
      this.logger.error("Failed to join challenge", {
        challengeId,
        userId,
        error,
      });

      if (error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }

      throw new ServiceError("Failed to join challenge", error);
    }
  }

  async leaveChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      this.logger.info("User attempting to leave challenge", {
        userId,
        challengeId,
      });

      // Check if user is participating
      const participation = await this.communityRepo.getUserParticipation(
        userId,
        challengeId
      );
      if (!participation) {
        throw new BusinessError("User is not participating in this challenge");
      }

      // Check if challenge allows leaving (e.g., not completed)
      if (participation.isCompleted) {
        throw new BusinessError("Cannot leave a completed challenge");
      }

      // Leave challenge
      await this.communityRepo.leaveChallenge(challengeId, userId);

      // Send notification
      await this.notificationService.sendNotification({
        userId,
        type: "challenge",
        title: "Challenge Left",
        message:
          "You have left the challenge. You can rejoin anytime before it ends.",
        read: false,
      });

      // Track analytics
      await this.analyticsService.track("challenge_left", {
        challengeId,
        userId,
        participationDuration: Date.now() - participation.joinedAt.getTime(),
      });

      this.logger.info("User successfully left challenge", {
        userId,
        challengeId,
      });
    } catch (error) {
      this.logger.error("Failed to leave challenge", {
        challengeId,
        userId,
        error,
      });

      if (error instanceof BusinessError) {
        throw error;
      }

      throw new ServiceError("Failed to leave challenge", error);
    }
  }

  async getUserChallenges(userId: string): Promise<ChallengeParticipation[]> {
    try {
      this.logger.info("Getting user challenges", { userId });

      const participations = await this.communityRepo.getUserChallenges(userId);

      // Sort by most recent first
      const sortedParticipations = participations.sort(
        (a, b) => b.joinedAt.getTime() - a.joinedAt.getTime()
      );

      this.logger.info("User challenges retrieved successfully", {
        userId,
        count: sortedParticipations.length,
      });

      return sortedParticipations;
    } catch (error) {
      this.logger.error("Failed to get user challenges", { userId, error });
      throw new ServiceError("Failed to retrieve user challenges", error);
    }
  }

  async updateChallengeProgress(
    challengeId: string,
    userId: string,
    newProgress: number
  ): Promise<void> {
    try {
      this.logger.info("Updating challenge progress", {
        challengeId,
        userId,
        newProgress,
      });

      // Validate progress
      if (newProgress < 0 || newProgress > 100) {
        throw new BusinessError("Progress must be between 0 and 100");
      }

      // Get current participation
      const participation = await this.communityRepo.getUserParticipation(
        userId,
        challengeId
      );
      if (!participation) {
        throw new BusinessError("User is not participating in this challenge");
      }

      // Update progress
      await this.communityRepo.updateChallengeProgress(
        challengeId,
        userId,
        newProgress
      );

      // Check if challenge is completed
      if (newProgress >= 100 && !participation.isCompleted) {
        await this.handleChallengeCompletion(challengeId, userId);
      }

      // Check for achievements
      await this.achievementService.checkChallengeAchievements(userId);

      this.logger.info("Challenge progress updated successfully", {
        challengeId,
        userId,
        newProgress,
      });
    } catch (error) {
      this.logger.error("Failed to update challenge progress", {
        challengeId,
        userId,
        newProgress,
        error,
      });

      if (error instanceof BusinessError) {
        throw error;
      }

      throw new ServiceError("Failed to update challenge progress", error);
    }
  }

  // ============================================================================
  // LEADERBOARD METHODS
  // ============================================================================

  async getLeaderboard(
    filters: LeaderboardFilters
  ): Promise<LeaderboardEntry[]> {
    try {
      this.logger.info("Getting leaderboard", { filters });

      const entries = await this.communityRepo.getLeaderboard(filters);

      // Apply additional business logic (e.g., anonymize certain users)
      const processedEntries = this.processLeaderboardEntries(entries);

      this.logger.info("Leaderboard retrieved successfully", {
        count: processedEntries.length,
        filters,
      });

      return processedEntries;
    } catch (error) {
      this.logger.error("Failed to get leaderboard", { filters, error });
      throw new ServiceError("Failed to retrieve leaderboard", error);
    }
  }

  async getLeaderboardStats(
    timeframe: string,
    userId?: string
  ): Promise<LeaderboardStats> {
    try {
      this.logger.info("Getting leaderboard stats", { timeframe, userId });

      const [stats, userRank] = await Promise.all([
        this.communityRepo.getLeaderboardStats(timeframe),
        userId
          ? this.communityRepo.getUserRank(userId, timeframe)
          : Promise.resolve(-1),
      ]);

      // Get user's current score if provided
      let userScore = 0;
      let userTrend: "up" | "down" | "stable" = "stable";

      if (userId) {
        const userEntries = await this.communityRepo.getLeaderboard({
          timeframe: timeframe as any,
          category: "overall",
          limit: 1,
        });

        const userEntry = userEntries.find((entry) => entry.userId === userId);
        if (userEntry) {
          userScore = userEntry.score;
          userTrend = userEntry.trend;
        }
      }

      const result: LeaderboardStats = {
        totalParticipants: stats.totalParticipants,
        averageScore: stats.averageScore,
        topScore: stats.topScore,
        userRank,
        userScore,
        userTrend,
      };

      this.logger.info("Leaderboard stats retrieved successfully", result);
      return result;
    } catch (error) {
      this.logger.error("Failed to get leaderboard stats", {
        timeframe,
        userId,
        error,
      });
      throw new ServiceError("Failed to retrieve leaderboard stats", error);
    }
  }

  // ============================================================================
  // ACHIEVEMENT METHODS
  // ============================================================================

  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      this.logger.info("Getting user achievements", { userId });

      const achievements = await this.communityRepo.getAchievements(userId);

      // Sort by rarity and unlock status
      const sortedAchievements = this.sortAchievementsByRelevance(achievements);

      this.logger.info("User achievements retrieved successfully", {
        userId,
        count: sortedAchievements.length,
        unlocked: sortedAchievements.filter((a) => a.unlocked).length,
      });

      return sortedAchievements;
    } catch (error) {
      this.logger.error("Failed to get achievements", { userId, error });
      throw new ServiceError("Failed to retrieve achievements", error);
    }
  }

  async getAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<AchievementProgress> {
    try {
      this.logger.info("Getting achievement progress", {
        userId,
        achievementId,
      });

      const [achievement, progress] = await Promise.all([
        this.communityRepo.getAchievementById(achievementId),
        this.communityRepo.checkAchievementProgress(userId, achievementId),
      ]);

      if (!achievement) {
        throw new NotFoundError("Achievement not found");
      }

      const result: AchievementProgress = {
        achievement,
        progress,
        isUnlocked: achievement.unlocked,
        requirements: achievement.requirements.map((req) => ({
          type: req.type,
          current: req.current,
          target: req.target,
          description: req.description,
        })),
      };

      this.logger.info("Achievement progress retrieved successfully", {
        userId,
        achievementId,
        progress: result.progress,
      });

      return result;
    } catch (error) {
      this.logger.error("Failed to get achievement progress", {
        userId,
        achievementId,
        error,
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new ServiceError("Failed to retrieve achievement progress", error);
    }
  }

  async unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<void> {
    try {
      this.logger.info("Unlocking achievement", { userId, achievementId });

      // Check if achievement exists
      const achievement = await this.communityRepo.getAchievementById(
        achievementId
      );
      if (!achievement) {
        throw new NotFoundError("Achievement not found");
      }

      // Check if already unlocked
      if (achievement.unlocked) {
        throw new BusinessError("Achievement already unlocked");
      }

      // Unlock achievement
      await this.communityRepo.unlockAchievement(userId, achievementId);

      // Send notification
      await this.notificationService.sendNotification({
        userId,
        type: "achievement",
        title: "Achievement Unlocked!",
        message: `Congratulations! You've unlocked "${achievement.name}". ${achievement.description}`,
        action: {
          type: "view_achievement",
          data: { achievementId },
        },
        read: false,
      });

      // Track analytics
      await this.analyticsService.track("achievement_unlocked", {
        achievementId,
        achievementName: achievement.name,
        achievementCategory: achievement.category,
        achievementRarity: achievement.rarity,
        userId,
      });

      this.logger.info("Achievement unlocked successfully", {
        userId,
        achievementId,
      });
    } catch (error) {
      this.logger.error("Failed to unlock achievement", {
        userId,
        achievementId,
        error,
      });

      if (error instanceof NotFoundError || error instanceof BusinessError) {
        throw error;
      }

      throw new ServiceError("Failed to unlock achievement", error);
    }
  }

  // ============================================================================
  // NOTIFICATION METHODS
  // ============================================================================

  async getNotifications(
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> {
    try {
      this.logger.info("Getting user notifications", { userId, limit });

      const notifications = await this.communityRepo.getNotifications(
        userId,
        limit
      );

      // Sort by most recent first
      const sortedNotifications = notifications.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      this.logger.info("User notifications retrieved successfully", {
        userId,
        count: sortedNotifications.length,
      });

      return sortedNotifications;
    } catch (error) {
      this.logger.error("Failed to get notifications", {
        userId,
        limit,
        error,
      });
      throw new ServiceError("Failed to retrieve notifications", error);
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      this.logger.info("Marking notification as read", { notificationId });

      await this.communityRepo.markNotificationAsRead(notificationId);

      this.logger.info("Notification marked as read successfully", {
        notificationId,
      });
    } catch (error) {
      this.logger.error("Failed to mark notification as read", {
        notificationId,
        error,
      });
      throw new ServiceError("Failed to mark notification as read", error);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      this.logger.info("Marking all notifications as read", { userId });

      await this.communityRepo.markAllNotificationsAsRead(userId);

      this.logger.info("All notifications marked as read successfully", {
        userId,
      });
    } catch (error) {
      this.logger.error("Failed to mark all notifications as read", {
        userId,
        error,
      });
      throw new ServiceError("Failed to mark all notifications as read", error);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async handleChallengeCompletion(
    challengeId: string,
    userId: string
  ): Promise<void> {
    try {
      this.logger.info("Handling challenge completion", {
        challengeId,
        userId,
      });

      // Get challenge details
      const challenge = await this.communityRepo.getChallengeById(challengeId);
      if (!challenge) {
        throw new NotFoundError("Challenge not found");
      }

      // Send completion notification
      await this.notificationService.sendNotification({
        userId,
        type: "challenge",
        title: "Challenge Completed!",
        message: `Congratulations! You've completed "${challenge.title}". You've earned ${challenge.rewards.length} rewards!`,
        action: {
          type: "navigate",
          data: { path: `/challenges/${challengeId}/rewards` },
        },
        read: false,
      });

      // Check for completion achievements
      await this.achievementService.checkChallengeAchievements(userId);

      // Track analytics
      await this.analyticsService.track("challenge_completed", {
        challengeId,
        challengeTitle: challenge.title,
        challengeCategory: challenge.category,
        userId,
      });

      this.logger.info("Challenge completion handled successfully", {
        challengeId,
        userId,
      });
    } catch (error) {
      this.logger.error("Failed to handle challenge completion", {
        challengeId,
        userId,
        error,
      });
      // Don't throw here as this is a side effect
    }
  }

  private sortChallengesByRelevance(challenges: Challenge[]): Challenge[] {
    return challenges.sort((a, b) => {
      // Active challenges first
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;

      // Then by participant count (popularity)
      if (a.participantCount !== b.participantCount) {
        return b.participantCount - a.participantCount;
      }

      // Finally by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  private sortAchievementsByRelevance(
    achievements: Achievement[]
  ): Achievement[] {
    return achievements.sort((a, b) => {
      // Unlocked achievements first
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;

      // Then by rarity (legendary first)
      const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
      const aRarity = rarityOrder[a.rarity];
      const bRarity = rarityOrder[b.rarity];

      if (aRarity !== bRarity) {
        return bRarity - aRarity;
      }

      // Finally by progress (highest first)
      return b.progress - a.progress;
    });
  }

  private processLeaderboardEntries(
    entries: LeaderboardEntry[]
  ): LeaderboardEntry[] {
    // Apply business logic to leaderboard entries
    // For example, anonymize certain users or apply privacy settings
    return entries.map((entry) => ({
      ...entry,
      // Add any processing logic here
    }));
  }
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class ServiceError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = "ServiceError";
  }
}
