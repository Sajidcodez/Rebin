import React, { useState, useEffect, useCallback, useMemo } from "react";
import { List } from "react-window";
import { useAuth } from "../../contexts/AuthContext";
import { useToastNotifications } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { CommunityService } from "../../lib/services/CommunityService";
import { SupabaseCommunityRepository } from "../../lib/repositories/CommunityRepository";
import type {
  LeaderboardEntry as LeaderboardEntryType,
  LeaderboardFilters as LeaderboardFiltersType,
  LeaderboardStats as LeaderboardStatsType,
} from "../../lib/repositories/CommunityRepository";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { cn } from "../../lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface LeaderboardProps {
  className?: string;
}

interface LeaderboardFiltersProps {
  timeframe: LeaderboardFiltersType["timeframe"];
  category: LeaderboardFiltersType["category"];
  onTimeframeChange: (timeframe: LeaderboardFiltersType["timeframe"]) => void;
  onCategoryChange: (category: LeaderboardFiltersType["category"]) => void;
}

interface LeaderboardEntryProps {
  entry: LeaderboardEntryType;
  position: number;
  isCurrentUser: boolean;
  onClick?: (userId: string) => void;
}

interface LeaderboardStatsProps {
  stats: LeaderboardStatsType;
  className?: string;
}

// ============================================================================
// LEADERBOARD FILTERS COMPONENT
// ============================================================================

const LeaderboardFilters: React.FC<LeaderboardFiltersProps> = ({
  timeframe,
  category,
  onTimeframeChange,
  onCategoryChange,
}) => {
  const timeframes = [
    { value: "day", label: "Today", icon: Icons.calendar },
    { value: "week", label: "This Week", icon: Icons.calendar },
    { value: "month", label: "This Month", icon: Icons.calendar },
    { value: "year", label: "This Year", icon: Icons.calendar },
    { value: "all", label: "All Time", icon: Icons.trophy },
  ];

  const categories = [
    { value: "overall", label: "Overall", icon: Icons.barChart },
    { value: "recycling", label: "Recycling", icon: Icons.recycle },
    { value: "compost", label: "Composting", icon: Icons.leaf },
    { value: "reduction", label: "Reduction", icon: Icons.minus },
  ];

  return (
    <div
      className="leaderboard-filters"
      role="region"
      aria-label="Leaderboard filters"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Community Leaderboard
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Timeframe Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeframe
            </label>
            <div className="flex flex-wrap gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => onTimeframeChange(tf.value as any)}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    timeframe === tf.value
                      ? "bg-primary-100 text-primary-800 border border-primary-200"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  )}
                  aria-pressed={timeframe === tf.value}
                >
                  <tf.icon className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => onCategoryChange(cat.value as any)}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    category === cat.value
                      ? "bg-primary-100 text-primary-800 border border-primary-200"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  )}
                  aria-pressed={category === cat.value}
                >
                  <cat.icon className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// LEADERBOARD STATS COMPONENT
// ============================================================================

const LeaderboardStats: React.FC<LeaderboardStatsProps> = ({
  stats,
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
        Leaderboard Statistics
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {stats.totalParticipants.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Participants</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.averageScore.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Average Score</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.topScore.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Top Score</div>
        </div>

        {stats.userRank > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              #{stats.userRank}
            </div>
            <div className="text-sm text-gray-600">Your Rank</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// LEADERBOARD ENTRY COMPONENT
// ============================================================================

const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({
  entry,
  position,
  isCurrentUser,
  onClick,
}) => {
  const handleClick = useCallback(() => {
    onClick?.(entry.userId);
  }, [onClick, entry.userId]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Icons.trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Icons.trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Icons.trophy className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: LeaderboardEntryType["trend"]) => {
    switch (trend) {
      case "up":
        return <Icons.trendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <Icons.trendingDown className="w-4 h-4 text-red-600" />;
      case "stable":
        return <Icons.minus className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
        isCurrentUser && "bg-primary-50 border-primary-200"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      aria-label={`${entry.username}, rank ${position}, ${entry.score} points`}
    >
      {/* Rank */}
      <div className="flex items-center justify-center w-12 h-12 mr-4">
        {position <= 3 ? (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
            {getRankIcon(position)}
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
            <span className="text-sm font-semibold text-gray-700">
              #{position}
            </span>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center flex-1 min-w-0">
        <div className="flex-shrink-0 mr-3">
          {entry.avatar ? (
            <img
              src={entry.avatar}
              alt={`${entry.username}'s avatar`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Icons.users className="w-5 h-5 text-primary-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {entry.username}
            </h4>
            {isCurrentUser && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                You
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Icons.mapPin className="w-3 h-3" aria-hidden="true" />
            <span className="truncate">{entry.location}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {entry.score.toLocaleString()}
          </div>
          <div className="text-gray-500">Score</div>
        </div>

        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {entry.itemsSorted.toLocaleString()}
          </div>
          <div className="text-gray-500">Items</div>
        </div>

        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {entry.co2Saved.toFixed(1)}kg
          </div>
          <div className="text-gray-500">CO₂</div>
        </div>

        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {entry.achievements}
          </div>
          <div className="text-gray-500">Badges</div>
        </div>
      </div>

      {/* Trend */}
      <div className="flex items-center ml-4">
        {getTrendIcon(entry.trend)}
        {entry.change !== 0 && (
          <span
            className={cn(
              "ml-1 text-xs font-medium",
              entry.trend === "up"
                ? "text-green-600"
                : entry.trend === "down"
                ? "text-red-600"
                : "text-gray-500"
            )}
          >
            {Math.abs(entry.change)}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// VIRTUALIZED LEADERBOARD COMPONENT
// ============================================================================

const VirtualizedLeaderboard: React.FC<{
  entries: LeaderboardEntryType[];
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}> = ({ entries, currentUserId, onUserClick }) => {
  // Memoize sorted entries to prevent unnecessary re-sorting
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.score - a.score);
  }, [entries]);

  // Memoize current user position
  const currentUserPosition = useMemo(() => {
    if (!currentUserId) return -1;
    return (
      sortedEntries.findIndex((entry) => entry.userId === currentUserId) + 1
    );
  }, [sortedEntries, currentUserId]);

  // Optimized row renderer with proper memoization
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const entry = sortedEntries[index];
      const isCurrentUser = entry.userId === currentUserId;

      return (
        <div style={style} className="leaderboard-row">
          <LeaderboardEntry
            entry={entry}
            position={index + 1}
            isCurrentUser={isCurrentUser}
            onClick={onUserClick}
          />
        </div>
      );
    },
    [sortedEntries, currentUserId, onUserClick]
  );

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <Icons.trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No leaderboard data
        </h3>
        <p className="text-gray-600">
          Start sorting items to appear on the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Rankings</h3>
            {currentUserPosition > 0 && (
              <div className="text-sm text-gray-600">
                Your Rank:{" "}
                <span className="font-semibold text-primary-600">
                  #{currentUserPosition}
                </span>
              </div>
            )}
          </div>
        </div>

        <List
          height={600}
          itemCount={sortedEntries.length}
          itemSize={80}
          overscanCount={5}
          className="leaderboard-list"
        >
          {Row as any}
        </List>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN LEADERBOARD COMPONENT
// ============================================================================

const Leaderboard: React.FC<LeaderboardProps> = ({ className }) => {
  const { user } = useAuth();
  const { showError } = useToastNotifications();

  const [entries, setEntries] = useState<LeaderboardEntryType[]>([]);
  const [stats, setStats] = useState<LeaderboardStatsType | null>(null);
  const [filters, setFilters] = useState<LeaderboardFiltersType>({
    timeframe: "week",
    category: "overall",
    limit: 100,
  });
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

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    if (!communityService) return;

    try {
      setIsLoading(true);
      setError(null);

      const [entriesData, statsData] = await Promise.all([
        communityService.getLeaderboard(filters),
        communityService.getLeaderboardStats(filters.timeframe, user?.id),
      ]);

      setEntries(entriesData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setError("Failed to load leaderboard. Please try again.");
      showError("Error", "Failed to load leaderboard. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [communityService, filters, user?.id, showError]);

  // Handle user click
  const handleUserClick = useCallback((userId: string) => {
    // TODO: Navigate to user profile
    console.log("View user profile:", userId);
  }, []);

  // Real-time subscription for leaderboard updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("leaderboard")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sort_events",
        },
        (payload) => {
          console.log("Sort event received:", payload);
          // Refresh leaderboard when new sort events are added
          fetchLeaderboard();
        }
      )
      .subscribe((status) => {
        console.log("Leaderboard subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchLeaderboard]);

  // Fetch leaderboard when filters change
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (!user) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Icons.lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sign in to view leaderboard
        </h3>
        <p className="text-gray-600">
          Create an account to see how you rank against other users.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Icons.alertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error loading leaderboard
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchLeaderboard}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className={cn("leaderboard", className)}>
      <LeaderboardFilters
        timeframe={filters.timeframe}
        category={filters.category}
        onTimeframeChange={(timeframe) =>
          setFilters((prev) => ({ ...prev, timeframe }))
        }
        onCategoryChange={(category) =>
          setFilters((prev) => ({ ...prev, category }))
        }
      />

      {stats && <LeaderboardStats stats={stats} className="mb-6" />}

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 animate-pulse"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/6" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <VirtualizedLeaderboard
          entries={entries}
          currentUserId={user.id}
          onUserClick={handleUserClick}
        />
      )}
    </div>
  );
};

export default Leaderboard;
