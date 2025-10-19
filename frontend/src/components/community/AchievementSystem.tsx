import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToastNotifications } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { CommunityService } from "../../lib/services/CommunityService";
import { SupabaseCommunityRepository } from "../../lib/repositories/CommunityRepository";
import type { Achievement } from "../../lib/repositories/CommunityRepository";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { cn } from "../../lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface AchievementSystemProps {
  className?: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  onViewDetails?: (achievementId: string) => void;
}

interface AchievementFiltersProps {
  filter: AchievementFilter;
  sortBy: AchievementSort;
  onFilterChange: (filter: AchievementFilter) => void;
  onSortChange: (sortBy: AchievementSort) => void;
}

interface AchievementStatsProps {
  totalUnlocked: number;
  totalAvailable: number;
  completionRate: number;
  className?: string;
}

type AchievementFilter =
  | "all"
  | "unlocked"
  | "locked"
  | "sorting"
  | "streak"
  | "community"
  | "environmental";
type AchievementSort = "rarity" | "progress" | "name" | "category";

// ============================================================================
// ACHIEVEMENT FILTERS COMPONENT
// ============================================================================

const AchievementFilters: React.FC<AchievementFiltersProps> = ({
  filter,
  sortBy,
  onFilterChange,
  onSortChange,
}) => {
  const filters = [
    { value: "all", label: "All Achievements", icon: Icons.grid },
    { value: "unlocked", label: "Unlocked", icon: Icons.checkCircle },
    { value: "locked", label: "Locked", icon: Icons.lock },
    { value: "sorting", label: "Sorting", icon: Icons.recycle },
    { value: "streak", label: "Streak", icon: Icons.flame },
    { value: "community", label: "Community", icon: Icons.users },
    { value: "environmental", label: "Environmental", icon: Icons.leaf },
  ];

  const sortOptions = [
    { value: "rarity", label: "Rarity" },
    { value: "progress", label: "Progress" },
    { value: "name", label: "Name" },
    { value: "category", label: "Category" },
  ];

  return (
    <div
      className="achievement-filters"
      role="region"
      aria-label="Achievement filters"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter
            </label>
            <div className="flex flex-wrap gap-1">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => onFilterChange(f.value as AchievementFilter)}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    filter === f.value
                      ? "bg-primary-100 text-primary-800 border border-primary-200"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  )}
                  aria-pressed={filter === f.value}
                >
                  <f.icon className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as AchievementSort)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ACHIEVEMENT STATS COMPONENT
// ============================================================================

const AchievementStats: React.FC<AchievementStatsProps> = ({
  totalUnlocked,
  totalAvailable,
  completionRate,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-6",
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Achievement Progress
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600">
            {totalUnlocked}
          </div>
          <div className="text-sm text-gray-600">Unlocked</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-gray-600">
            {totalAvailable}
          </div>
          <div className="text-sm text-gray-600">Total Available</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {completionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span>{completionRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
            role="progressbar"
            aria-valuenow={completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Achievement progress: ${completionRate.toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ACHIEVEMENT CARD COMPONENT
// ============================================================================

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onViewDetails,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(achievement.id);
  }, [onViewDetails, achievement.id]);

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return "border-yellow-400 bg-yellow-50";
      case "epic":
        return "border-purple-400 bg-purple-50";
      case "rare":
        return "border-blue-400 bg-blue-50";
      case "common":
        return "border-gray-400 bg-gray-50";
      default:
        return "border-gray-400 bg-gray-50";
    }
  };

  const getRarityTextColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return "text-yellow-800";
      case "epic":
        return "text-purple-800";
      case "rare":
        return "text-blue-800";
      case "common":
        return "text-gray-800";
      default:
        return "text-gray-800";
    }
  };

  const getCategoryIcon = (category: Achievement["category"]) => {
    switch (category) {
      case "sorting":
        return Icons.recycle;
      case "streak":
        return Icons.flame;
      case "community":
        return Icons.users;
      case "environmental":
        return Icons.leaf;
      default:
        return Icons.trophy;
    }
  };

  const CategoryIcon = getCategoryIcon(achievement.category);

  return (
    <article
      className={cn(
        "achievement-card bg-white border-2 rounded-lg p-6 transition-all duration-200 cursor-pointer",
        getRarityColor(achievement.rarity),
        achievement.unlocked ? "shadow-md hover:shadow-lg" : "opacity-75",
        isHovered && "scale-105"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewDetails}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleViewDetails()}
      aria-label={`${achievement.name} achievement, ${achievement.rarity} rarity, ${achievement.progress}% progress`}
    >
      <header className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                achievement.unlocked ? "bg-white" : "bg-gray-200"
              )}
            >
              {achievement.unlocked ? (
                <CategoryIcon className="w-6 h-6 text-primary-600" />
              ) : (
                <Icons.lock className="w-6 h-6 text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "text-lg font-semibold truncate",
                achievement.unlocked ? "text-gray-900" : "text-gray-500"
              )}
            >
              {achievement.name}
            </h3>
            <p
              className={cn(
                "text-sm capitalize",
                getRarityTextColor(achievement.rarity)
              )}
            >
              {achievement.rarity} Achievement
            </p>
          </div>
        </div>

        {achievement.unlocked && (
          <div className="flex-shrink-0">
            <Icons.checkCircle className="w-6 h-6 text-green-600" />
          </div>
        )}
      </header>

      <div className="mb-4">
        <p
          className={cn(
            "text-sm",
            achievement.unlocked ? "text-gray-700" : "text-gray-500"
          )}
        >
          {achievement.description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{achievement.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              achievement.unlocked
                ? "bg-gradient-to-r from-primary-500 to-green-500"
                : "bg-gray-400"
            )}
            style={{ width: `${achievement.progress}%` }}
            role="progressbar"
            aria-valuenow={achievement.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Achievement progress: ${achievement.progress}%`}
          />
        </div>
      </div>

      {/* Requirements */}
      {achievement.requirements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Requirements
          </h4>
          <div className="space-y-1">
            {achievement.requirements.slice(0, 2).map((requirement) => (
              <div
                key={requirement.id}
                className="flex items-center space-x-2 text-sm"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    requirement.current >= requirement.target
                      ? "bg-green-500"
                      : "bg-gray-300"
                  )}
                />
                <span
                  className={cn(
                    requirement.current >= requirement.target
                      ? "text-green-700"
                      : "text-gray-600"
                  )}
                >
                  {requirement.description}
                </span>
              </div>
            ))}
            {achievement.requirements.length > 2 && (
              <div className="text-xs text-gray-500">
                +{achievement.requirements.length - 2} more requirements
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rewards */}
      {achievement.rewards.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Rewards</h4>
          <div className="flex flex-wrap gap-1">
            {achievement.rewards.slice(0, 3).map((reward) => (
              <span
                key={reward.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                <Icons.gift className="w-3 h-3 mr-1" />
                {reward.description}
              </span>
            ))}
            {achievement.rewards.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{achievement.rewards.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Unlock Date */}
      {achievement.unlocked && achievement.unlockedAt && (
        <div className="text-xs text-gray-500">
          Unlocked on {achievement.unlockedAt.toLocaleDateString()}
        </div>
      )}
    </article>
  );
};

// ============================================================================
// MAIN ACHIEVEMENT SYSTEM COMPONENT
// ============================================================================

const AchievementSystem: React.FC<AchievementSystemProps> = ({ className }) => {
  const { user } = useAuth();
  const { showError } = useToastNotifications();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<AchievementFilter>("all");
  const [sortBy, setSortBy] = useState<AchievementSort>("rarity");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize community service
  const communityService = useMemo(() => {
    if (!user) return null;

    const repository = new SupabaseCommunityRepository(supabase, {
      info: (msg, meta) => console.log(msg, meta),
      error: (msg, meta) => console.error(msg, meta),
      warn: (msg, meta) => console.warn(msg, meta),
      debug: (msg, meta) => console.debug(msg, meta),
    });

    return new CommunityService(
      repository,
      {} as any, // User repository - would be injected in real app
      {} as any, // Achievement service - would be injected in real app
      {} as any, // Notification service - would be injected in real app
      {} as any, // Analytics service - would be injected in real app
      {
        info: (msg, meta) => console.log(msg, meta),
        error: (msg, meta) => console.error(msg, meta),
        warn: (msg, meta) => console.warn(msg, meta),
        debug: (msg, meta) => console.debug(msg, meta),
      }
    );
  }, [user]);

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    if (!communityService || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      const achievementsData = await communityService.getAchievements(user.id);
      setAchievements(achievementsData);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      setError("Failed to load achievements. Please try again.");
      showError("Error", "Failed to load achievements. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [communityService, user, showError]);

  // Handle viewing achievement details
  const handleViewDetails = useCallback((achievementId: string) => {
    // TODO: Navigate to achievement details page
    console.log("View achievement details:", achievementId);
  }, []);

  // Filter and sort achievements
  const filteredAndSortedAchievements = useMemo(() => {
    let filtered = achievements;

    // Apply filter
    if (filter === "unlocked") {
      filtered = filtered.filter((a) => a.unlocked);
    } else if (filter === "locked") {
      filtered = filtered.filter((a) => !a.unlocked);
    } else if (filter !== "all") {
      filtered = filtered.filter((a) => a.category === filter);
    }

    // Apply sort
    switch (sortBy) {
      case "rarity":
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
        filtered = filtered.sort(
          (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]
        );
        break;
      case "progress":
        filtered = filtered.sort((a, b) => b.progress - a.progress);
        break;
      case "name":
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "category":
        filtered = filtered.sort((a, b) =>
          a.category.localeCompare(b.category)
        );
        break;
    }

    return filtered;
  }, [achievements, filter, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalUnlocked = achievements.filter((a) => a.unlocked).length;
    const totalAvailable = achievements.length;
    const completionRate =
      totalAvailable > 0 ? (totalUnlocked / totalAvailable) * 100 : 0;

    return {
      totalUnlocked,
      totalAvailable,
      completionRate,
    };
  }, [achievements]);

  // Real-time subscription for achievement updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("achievements")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Achievement unlocked:", payload);
          // Refresh achievements when new ones are unlocked
          fetchAchievements();
        }
      )
      .subscribe((status) => {
        console.log("Achievement subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAchievements]);

  // Fetch achievements on mount
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  if (!user) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Icons.lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sign in to view achievements
        </h3>
        <p className="text-gray-600">
          Create an account to unlock achievements and track your progress.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Icons.alertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error loading achievements
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchAchievements}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className={cn("achievement-system", className)}>
      <AchievementFilters
        filter={filter}
        sortBy={sortBy}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
      />

      <AchievementStats
        totalUnlocked={stats.totalUnlocked}
        totalAvailable={stats.totalAvailable}
        completionRate={stats.completionRate}
        className="mb-6"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedAchievements.length === 0 ? (
        <div className="text-center py-12">
          <Icons.trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No achievements found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or start sorting items to unlock
            achievements!
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
        >
          {filteredAndSortedAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementSystem;
