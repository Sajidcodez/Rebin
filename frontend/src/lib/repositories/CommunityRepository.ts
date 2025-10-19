import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  SecuritySchemas,
  XSSProtection,
  RateLimiter,
  SecurityError,
  ValidationError,
  SecurityValidator,
} from "../security";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: "recycling" | "compost" | "reduction" | "education";
  targetItems: number;
  targetCO2: number;
  duration: number; // days
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  participantCount: number;
  progress: number;
  rewards: ChallengeReward[];
  rules: ChallengeRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeReward {
  id: string;
  type: "points" | "badge" | "discount" | "recognition";
  value: number;
  description: string;
  icon?: string;
}

export interface ChallengeRule {
  id: string;
  description: string;
  required: boolean;
}

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: Date;
  progress: number;
  itemsSorted: number;
  co2Saved: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  location: string;
  score: number;
  itemsSorted: number;
  co2Saved: number;
  achievements: number;
  rank: number;
  trend: "up" | "down" | "stable";
  change: number;
  timeframe: "day" | "week" | "month" | "year" | "all";
}

export interface LeaderboardStats {
  totalParticipants: number;
  averageScore: number;
  topScore: number;
  userRank: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "sorting" | "streak" | "community" | "environmental";
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  unlocked: boolean;
  progress: number;
  unlockedAt?: Date;
}

export interface AchievementProgress {
  achievementId: string;
  userId: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
}

export interface AchievementRequirement {
  id: string;
  type: "items_sorted" | "co2_saved" | "streak_days" | "challenges_completed";
  target: number;
  current: number;
  description: string;
}

export interface AchievementReward {
  id: string;
  type: "points" | "badge" | "title" | "special_access";
  value: number;
  description: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "achievement" | "challenge" | "leaderboard" | "community" | "system";
  title: string;
  message: string;
  action?: {
    type: "navigate" | "join_challenge" | "view_achievement";
    data: Record<string, any>;
  };
  read: boolean;
  createdAt: Date;
}

export interface ChallengeFilters {
  category?: Challenge["category"];
  status?: "active" | "upcoming" | "completed";
  difficulty?: "easy" | "medium" | "hard";
  timeframe?: "week" | "month" | "all";
}

export interface LeaderboardFilters {
  timeframe: "day" | "week" | "month" | "year" | "all";
  category: "overall" | "recycling" | "compost" | "reduction";
  limit?: number;
  offset?: number;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ChallengeJoinSchema = z.object({
  challengeId: z.string().uuid("Invalid challenge ID"),
  userId: z.string().uuid("Invalid user ID"),
  timestamp: z.date(),
});

const ChallengeCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description too long"),
  category: z.enum(["recycling", "compost", "reduction", "education"]),
  targetItems: z.number().min(1, "Target items must be at least 1"),
  targetCO2: z.number().min(0.1, "Target CO2 must be at least 0.1kg"),
  duration: z
    .number()
    .min(1, "Duration must be at least 1 day")
    .max(365, "Duration cannot exceed 365 days"),
  startDate: z.date(),
  endDate: z.date(),
});

const LeaderboardQuerySchema = z.object({
  timeframe: z.enum(["day", "week", "month", "year", "all"]),
  category: z.enum(["overall", "recycling", "compost", "reduction"]),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface ICommunityRepository {
  // Challenge methods
  getChallenges(filters?: ChallengeFilters): Promise<Challenge[]>;
  getChallengeById(id: string): Promise<Challenge | null>;
  joinChallenge(
    challengeId: string,
    userId: string
  ): Promise<ChallengeParticipation>;
  leaveChallenge(challengeId: string, userId: string): Promise<void>;
  getUserParticipation(
    userId: string,
    challengeId: string
  ): Promise<ChallengeParticipation | null>;
  getUserChallenges(userId: string): Promise<ChallengeParticipation[]>;
  updateChallengeProgress(
    challengeId: string,
    userId: string,
    progress: number
  ): Promise<void>;

  // Leaderboard methods
  getLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardEntry[]>;
  getUserRank(userId: string, timeframe: string): Promise<number>;
  getLeaderboardStats(timeframe: string): Promise<{
    totalParticipants: number;
    averageScore: number;
    topScore: number;
  }>;

  // Achievement methods
  getAchievements(userId: string): Promise<Achievement[]>;
  getAchievementById(id: string): Promise<Achievement | null>;
  unlockAchievement(userId: string, achievementId: string): Promise<void>;
  checkAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<number>;

  // Notification methods
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  createNotification(
    notification: Omit<Notification, "id" | "createdAt">
  ): Promise<Notification>;
}

// ============================================================================
// SUPABASE COMMUNITY REPOSITORY
// ============================================================================

export class SupabaseCommunityRepository implements ICommunityRepository {
  constructor(private supabase: SupabaseClient, private logger: ILogger) {}

  // ============================================================================
  // CHALLENGE METHODS
  // ============================================================================

  async getChallenges(filters?: ChallengeFilters): Promise<Challenge[]> {
    try {
      // Validate filters
      if (filters) {
        this.validateChallengeFilters(filters);
      }

      let query = this.supabase
        .from("challenges")
        .select(
          `
          *,
          participants:challenge_participants(count),
          rewards:challenge_rewards(*),
          rules:challenge_rules(*)
        `
        )
        .eq("is_active", true);

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.status === "active") {
        const now = new Date();
        query = query
          .lte("start_date", now.toISOString())
          .gte("end_date", now.toISOString());
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        throw new DatabaseError(`Failed to fetch challenges: ${error.message}`);
      }

      this.logger.info("Challenges retrieved", {
        count: data?.length,
        filters,
      });
      return data?.map(this.mapChallengeFromDatabase) || [];
    } catch (error) {
      this.logger.error("Failed to get challenges", { filters, error });
      throw new RepositoryError("Failed to retrieve challenges", error);
    }
  }

  async getChallengeById(id: string): Promise<Challenge | null> {
    try {
      // Validate and sanitize input
      const sanitizedId = XSSProtection.sanitizeText(id);
      if (!SecurityValidator.validateUUID(sanitizedId)) {
        throw new ValidationError("Invalid challenge ID format");
      }

      const { data, error } = await this.supabase
        .from("challenges")
        .select(
          `
          *,
          participants:challenge_participants(count),
          rewards:challenge_rewards(*),
          rules:challenge_rules(*)
        `
        )
        .eq("id", sanitizedId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Not found
        }
        throw new DatabaseError(`Failed to fetch challenge: ${error.message}`);
      }

      return this.mapChallengeFromDatabase(data);
    } catch (error) {
      this.logger.error("Failed to get challenge by ID", { id, error });
      throw new RepositoryError("Failed to retrieve challenge", error);
    }
  }

  async joinChallenge(
    challengeId: string,
    userId: string
  ): Promise<ChallengeParticipation> {
    try {
      // Rate limiting for community actions
      if (!RateLimiter.checkLimit("community_action", userId)) {
        const retryAfter = RateLimiter.getTimeUntilReset(
          "community_action",
          userId
        );
        throw new RateLimitError(
          `Too many community actions. Please try again in ${Math.ceil(
            retryAfter / 60000
          )} minutes.`,
          retryAfter
        );
      }

      // Validate and sanitize inputs
      const validatedData = ChallengeJoinSchema.parse({
        challengeId: XSSProtection.sanitizeText(challengeId),
        userId: XSSProtection.sanitizeText(userId),
        timestamp: new Date(),
      });

      // Check if challenge exists and is active
      const challenge = await this.getChallengeById(validatedData.challengeId);
      if (!challenge) {
        throw new NotFoundError("Challenge not found");
      }

      if (!challenge.isActive) {
        throw new BusinessError("Challenge is not active");
      }

      // Check if user already joined
      const existingParticipation = await this.getUserParticipation(
        validatedData.userId,
        validatedData.challengeId
      );
      if (existingParticipation) {
        throw new BusinessError("User already joined this challenge");
      }

      // Join challenge
      const { data, error } = await this.supabase
        .from("challenge_participants")
        .insert({
          challenge_id: validatedData.challengeId,
          user_id: validatedData.userId,
          joined_at: validatedData.timestamp.toISOString(),
          progress: 0,
          items_sorted: 0,
          co2_saved: 0,
          is_completed: false,
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to join challenge: ${error.message}`);
      }

      this.logger.info("User joined challenge", {
        userId: validatedData.userId,
        challengeId: validatedData.challengeId,
      });
      return this.mapParticipationFromDatabase(data);
    } catch (error) {
      this.logger.error("Failed to join challenge", {
        challengeId,
        userId,
        error,
      });
      throw new RepositoryError("Failed to join challenge", error);
    }
  }

  async leaveChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      // Validate and sanitize inputs
      const sanitizedChallengeId = XSSProtection.sanitizeText(challengeId);
      const sanitizedUserId = XSSProtection.sanitizeText(userId);

      const { error } = await this.supabase
        .from("challenge_participants")
        .delete()
        .eq("challenge_id", sanitizedChallengeId)
        .eq("user_id", sanitizedUserId);

      if (error) {
        throw new DatabaseError(`Failed to leave challenge: ${error.message}`);
      }

      this.logger.info("User left challenge", {
        userId: sanitizedUserId,
        challengeId: sanitizedChallengeId,
      });
    } catch (error) {
      this.logger.error("Failed to leave challenge", {
        challengeId,
        userId,
        error,
      });
      throw new RepositoryError("Failed to leave challenge", error);
    }
  }

  async getUserParticipation(
    userId: string,
    challengeId: string
  ): Promise<ChallengeParticipation | null> {
    try {
      const sanitizedUserId = XSSProtection.sanitizeText(userId);
      const sanitizedChallengeId = XSSProtection.sanitizeText(challengeId);

      const { data, error } = await this.supabase
        .from("challenge_participants")
        .select("*")
        .eq("user_id", sanitizedUserId)
        .eq("challenge_id", sanitizedChallengeId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Not found
        }
        throw new DatabaseError(
          `Failed to fetch participation: ${error.message}`
        );
      }

      return this.mapParticipationFromDatabase(data);
    } catch (error) {
      this.logger.error("Failed to get user participation", {
        userId,
        challengeId,
        error,
      });
      throw new RepositoryError("Failed to retrieve participation", error);
    }
  }

  async getUserChallenges(userId: string): Promise<ChallengeParticipation[]> {
    try {
      const sanitizedUserId = XSSProtection.sanitizeText(userId);

      const { data, error } = await this.supabase
        .from("challenge_participants")
        .select("*")
        .eq("user_id", sanitizedUserId)
        .order("joined_at", { ascending: false });

      if (error) {
        throw new DatabaseError(
          `Failed to fetch user challenges: ${error.message}`
        );
      }

      return data?.map(this.mapParticipationFromDatabase) || [];
    } catch (error) {
      this.logger.error("Failed to get user challenges", { userId, error });
      throw new RepositoryError("Failed to retrieve user challenges", error);
    }
  }

  async updateChallengeProgress(
    challengeId: string,
    userId: string,
    progress: number
  ): Promise<void> {
    try {
      const sanitizedChallengeId = XSSProtection.sanitizeText(challengeId);
      const sanitizedUserId = XSSProtection.sanitizeText(userId);

      if (progress < 0 || progress > 100) {
        throw new ValidationError("Progress must be between 0 and 100");
      }

      const { error } = await this.supabase
        .from("challenge_participants")
        .update({
          progress,
          updated_at: new Date().toISOString(),
        })
        .eq("challenge_id", sanitizedChallengeId)
        .eq("user_id", sanitizedUserId);

      if (error) {
        throw new DatabaseError(`Failed to update progress: ${error.message}`);
      }

      this.logger.info("Challenge progress updated", {
        challengeId: sanitizedChallengeId,
        userId: sanitizedUserId,
        progress,
      });
    } catch (error) {
      this.logger.error("Failed to update challenge progress", {
        challengeId,
        userId,
        progress,
        error,
      });
      throw new RepositoryError("Failed to update progress", error);
    }
  }

  // ============================================================================
  // LEADERBOARD METHODS
  // ============================================================================

  async getLeaderboard(
    filters: LeaderboardFilters
  ): Promise<LeaderboardEntry[]> {
    try {
      // Validate filters
      const validatedFilters = LeaderboardQuerySchema.parse(filters);

      let query = this.supabase
        .from("user_stats")
        .select(
          `
          user_id,
          username,
          avatar_url,
          location,
          score,
          items_sorted,
          co2_saved,
          achievements_count,
          rank,
          trend,
          change
        `
        )
        .eq("timeframe", validatedFilters.timeframe)
        .eq("category", validatedFilters.category)
        .order("rank", { ascending: true });

      if (validatedFilters.limit) {
        query = query.limit(validatedFilters.limit);
      }

      if (validatedFilters.offset) {
        query = query.range(
          validatedFilters.offset,
          validatedFilters.offset + (validatedFilters.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(
          `Failed to fetch leaderboard: ${error.message}`
        );
      }

      this.logger.info("Leaderboard retrieved", {
        count: data?.length,
        filters: validatedFilters,
      });
      return data?.map(this.mapLeaderboardEntryFromDatabase) || [];
    } catch (error) {
      this.logger.error("Failed to get leaderboard", { filters, error });
      throw new RepositoryError("Failed to retrieve leaderboard", error);
    }
  }

  async getUserRank(userId: string, timeframe: string): Promise<number> {
    try {
      const sanitizedUserId = XSSProtection.sanitizeText(userId);
      const sanitizedTimeframe = XSSProtection.sanitizeText(timeframe);

      const { data, error } = await this.supabase
        .from("user_stats")
        .select("rank")
        .eq("user_id", sanitizedUserId)
        .eq("timeframe", sanitizedTimeframe)
        .eq("category", "overall")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return -1; // Not found
        }
        throw new DatabaseError(`Failed to fetch user rank: ${error.message}`);
      }

      return data.rank;
    } catch (error) {
      this.logger.error("Failed to get user rank", {
        userId,
        timeframe,
        error,
      });
      throw new RepositoryError("Failed to retrieve user rank", error);
    }
  }

  async getLeaderboardStats(timeframe: string): Promise<{
    totalParticipants: number;
    averageScore: number;
    topScore: number;
  }> {
    try {
      const sanitizedTimeframe = XSSProtection.sanitizeText(timeframe);

      const { data, error } = await this.supabase
        .from("leaderboard_stats")
        .select("total_participants, average_score, top_score")
        .eq("timeframe", sanitizedTimeframe)
        .eq("category", "overall")
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to fetch leaderboard stats: ${error.message}`
        );
      }

      return {
        totalParticipants: data.total_participants,
        averageScore: data.average_score,
        topScore: data.top_score,
      };
    } catch (error) {
      this.logger.error("Failed to get leaderboard stats", {
        timeframe,
        error,
      });
      throw new RepositoryError("Failed to retrieve leaderboard stats", error);
    }
  }

  // ============================================================================
  // ACHIEVEMENT METHODS
  // ============================================================================

  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      const sanitizedUserId = XSSProtection.sanitizeText(userId);

      const { data, error } = await this.supabase
        .from("achievements")
        .select(
          `
          *,
          user_achievements!left(
            unlocked,
            progress,
            unlocked_at
          )
        `
        )
        .eq("user_achievements.user_id", sanitizedUserId);

      if (error) {
        throw new DatabaseError(
          `Failed to fetch achievements: ${error.message}`
        );
      }

      return data?.map(this.mapAchievementFromDatabase) || [];
    } catch (error) {
      this.logger.error("Failed to get achievements", { userId, error });
      throw new RepositoryError("Failed to retrieve achievements", error);
    }
  }

  async getAchievementById(id: string): Promise<Achievement | null> {
    try {
      const sanitizedId = XSSProtection.sanitizeText(id);

      const { data, error } = await this.supabase
        .from("achievements")
        .select("*")
        .eq("id", sanitizedId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Not found
        }
        throw new DatabaseError(
          `Failed to fetch achievement: ${error.message}`
        );
      }

      return this.mapAchievementFromDatabase(data);
    } catch (error) {
      this.logger.error("Failed to get achievement by ID", { id, error });
      throw new RepositoryError("Failed to retrieve achievement", error);
    }
  }

  async unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<void> {
    try {
      const sanitizedUserId = XSSProtection.sanitizeText(userId);
      const sanitizedAchievementId = XSSProtection.sanitizeText(achievementId);

      const { error } = await this.supabase.from("user_achievements").upsert({
        user_id: sanitizedUserId,
        achievement_id: sanitizedAchievementId,
        unlocked: true,
        progress: 100,
        unlocked_at: new Date().toISOString(),
      });

      if (error) {
        throw new DatabaseError(
          `Failed to unlock achievement: ${error.message}`
        );
      }

      this.logger.info("Achievement unlocked", {
        userId: sanitizedUserId,
        achievementId: sanitizedAchievementId,
      });
    } catch (error) {
      this.logger.error("Failed to unlock achievement", {
        userId,
        achievementId,
        error,
      });
      throw new RepositoryError("Failed to unlock achievement", error);
    }
  }

  async checkAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<number> {
    try {
      const sanitizedUserId = XSSProtection.sanitizeText(userId);
      const sanitizedAchievementId = XSSProtection.sanitizeText(achievementId);

      const { data, error } = await this.supabase
        .from("user_achievements")
        .select("progress")
        .eq("user_id", sanitizedUserId)
        .eq("achievement_id", sanitizedAchievementId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return 0; // Not found, no progress
        }
        throw new DatabaseError(
          `Failed to fetch achievement progress: ${error.message}`
        );
      }

      return data.progress;
    } catch (error) {
      this.logger.error("Failed to check achievement progress", {
        userId,
        achievementId,
        error,
      });
      throw new RepositoryError("Failed to check achievement progress", error);
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
      const sanitizedUserId = XSSProtection.sanitizeText(userId);

      const { data, error } = await this.supabase
        .from("notifications")
        .select("*")
        .eq("user_id", sanitizedUserId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new DatabaseError(
          `Failed to fetch notifications: ${error.message}`
        );
      }

      return data?.map(this.mapNotificationFromDatabase) || [];
    } catch (error) {
      this.logger.error("Failed to get notifications", {
        userId,
        limit,
        error,
      });
      throw new RepositoryError("Failed to retrieve notifications", error);
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const sanitizedId = XSSProtection.sanitizeText(notificationId);

      const { error } = await this.supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", sanitizedId);

      if (error) {
        throw new DatabaseError(
          `Failed to mark notification as read: ${error.message}`
        );
      }

      this.logger.info("Notification marked as read", {
        notificationId: sanitizedId,
      });
    } catch (error) {
      this.logger.error("Failed to mark notification as read", {
        notificationId,
        error,
      });
      throw new RepositoryError("Failed to mark notification as read", error);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const sanitizedUserId = XSSProtection.sanitizeText(userId);

      const { error } = await this.supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", sanitizedUserId)
        .eq("read", false);

      if (error) {
        throw new DatabaseError(
          `Failed to mark all notifications as read: ${error.message}`
        );
      }

      this.logger.info("All notifications marked as read", {
        userId: sanitizedUserId,
      });
    } catch (error) {
      this.logger.error("Failed to mark all notifications as read", {
        userId,
        error,
      });
      throw new RepositoryError(
        "Failed to mark all notifications as read",
        error
      );
    }
  }

  async createNotification(
    notification: Omit<Notification, "id" | "createdAt">
  ): Promise<Notification> {
    try {
      const { data, error } = await this.supabase
        .from("notifications")
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: XSSProtection.sanitizeText(notification.title),
          message: XSSProtection.sanitizeText(notification.message),
          action: notification.action,
          read: notification.read,
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to create notification: ${error.message}`
        );
      }

      this.logger.info("Notification created", {
        notificationId: data.id,
        userId: notification.userId,
      });
      return this.mapNotificationFromDatabase(data);
    } catch (error) {
      this.logger.error("Failed to create notification", {
        notification,
        error,
      });
      throw new RepositoryError("Failed to create notification", error);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private validateChallengeFilters(filters: ChallengeFilters): void {
    if (
      filters.category &&
      !["recycling", "compost", "reduction", "education"].includes(
        filters.category
      )
    ) {
      throw new ValidationError("Invalid challenge category");
    }
    if (
      filters.status &&
      !["active", "upcoming", "completed"].includes(filters.status)
    ) {
      throw new ValidationError("Invalid challenge status");
    }
    if (
      filters.difficulty &&
      !["easy", "medium", "hard"].includes(filters.difficulty)
    ) {
      throw new ValidationError("Invalid challenge difficulty");
    }
  }

  private mapChallengeFromDatabase(data: any): Challenge {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      targetItems: data.target_items,
      targetCO2: data.target_co2,
      duration: data.duration,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      isActive: data.is_active,
      participantCount: data.participants?.[0]?.count || 0,
      progress: data.progress || 0,
      rewards: data.rewards?.map(this.mapRewardFromDatabase) || [],
      rules: data.rules?.map(this.mapRuleFromDatabase) || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapParticipationFromDatabase(data: any): ChallengeParticipation {
    return {
      id: data.id,
      challengeId: data.challenge_id,
      userId: data.user_id,
      joinedAt: new Date(data.joined_at),
      progress: data.progress,
      itemsSorted: data.items_sorted,
      co2Saved: data.co2_saved,
      isCompleted: data.is_completed,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    };
  }

  private mapLeaderboardEntryFromDatabase(data: any): LeaderboardEntry {
    return {
      userId: data.user_id,
      username: data.username,
      avatar: data.avatar_url,
      location: data.location,
      score: data.score,
      itemsSorted: data.items_sorted,
      co2Saved: data.co2_saved,
      achievements: data.achievements_count,
      rank: data.rank,
      trend: data.trend,
      change: data.change,
      timeframe: data.timeframe,
    };
  }

  private mapAchievementFromDatabase(data: any): Achievement {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      icon: data.icon,
      rarity: data.rarity,
      requirements:
        data.requirements?.map(this.mapRequirementFromDatabase) || [],
      rewards: data.rewards?.map(this.mapAchievementRewardFromDatabase) || [],
      unlocked: data.user_achievements?.[0]?.unlocked || false,
      progress: data.user_achievements?.[0]?.progress || 0,
      unlockedAt: data.user_achievements?.[0]?.unlocked_at
        ? new Date(data.user_achievements[0].unlocked_at)
        : undefined,
    };
  }

  private mapNotificationFromDatabase(data: any): Notification {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      action: data.action,
      read: data.read,
      createdAt: new Date(data.created_at),
    };
  }

  private mapRewardFromDatabase(data: any): ChallengeReward {
    return {
      id: data.id,
      type: data.type,
      value: data.value,
      description: data.description,
      icon: data.icon,
    };
  }

  private mapRuleFromDatabase(data: any): ChallengeRule {
    return {
      id: data.id,
      description: data.description,
      required: data.required,
    };
  }

  private mapRequirementFromDatabase(data: any): AchievementRequirement {
    return {
      id: data.id,
      type: data.type,
      target: data.target,
      current: data.current,
      description: data.description,
    };
  }

  private mapAchievementRewardFromDatabase(data: any): AchievementReward {
    return {
      id: data.id,
      type: data.type,
      value: data.value,
      description: data.description,
    };
  }
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class RepositoryError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = "RepositoryError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessError";
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
  }
}

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface ILogger {
  info(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}
