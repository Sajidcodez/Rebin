/**
 * Hybrid Achievement System Component
 * Combines mock and real-time achievement data for comprehensive tracking
 * Follows best practices for performance, error handling, and user experience
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  HybridDataService,
  HybridAchievement,
  HybridDataStats,
} from "../lib/services/HybridDataService";
import {
  AchievementAdapter,
  NormalizedAchievement,
} from "../lib/adapters/DataAdapters";
import { realTimeDataService } from "../lib/services/RealTimeDataService";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface HybridAchievementSystemProps {
  userId?: string;
  className?: string;
  useHybridData?: boolean;
  showDataQuality?: boolean;
  enableRealTimeUpdates?: boolean;
  showProgressBars?: boolean;
  showRarityIndicators?: boolean;
}

interface AchievementState {
  achievements: NormalizedAchievement[];
  stats: HybridDataStats;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  realTimeEnabled: boolean;
}

type FilterType = "all" | "unlocked" | "locked" | "near_completion" | string;
type SortType = "rarity" | "progress" | "name" | "category" | "unlocked_at";

// ============================================================================
// HYBRID ACHIEVEMENT SYSTEM COMPONENT
// ============================================================================

export function HybridAchievementSystem({
  userId,
  className = "",
  useHybridData = true,
  showDataQuality = true,
  enableRealTimeUpdates = true,
  showProgressBars = true,
  showRarityIndicators = true,
}: HybridAchievementSystemProps) {
  // State management
  const [state, setState] = useState<AchievementState>({
    achievements: [],
    stats: {
      totalEntries: 0,
      mockEntries: 0,
      realEntries: 0,
      hybridEntries: 0,
      lastUpdated: new Date(),
      dataQuality: "poor",
    },
    isLoading: true,
    error: null,
    isConnected: false,
    lastUpdate: null,
    realTimeEnabled: enableRealTimeUpdates,
  });

  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("rarity");

  // Use mock user ID if none provided (for demo purposes)
  const effectiveUserId = userId || "demo-user-123";

  // Initialize services
  const hybridService = useMemo(() => new HybridDataService(), []);
  const realTimeService = useMemo(() => realTimeDataService, []);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchAchievements = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch hybrid data
      const result = await hybridService.getHybridAchievements(effectiveUserId);

      // Normalize achievements using adapter
      const normalizedAchievements = result.achievements.map((achievement) =>
        AchievementAdapter.normalizeMockAchievement(achievement as any)
      );

      setState((prev) => ({
        ...prev,
        achievements: normalizedAchievements,
        stats: result.stats,
        isLoading: false,
        lastUpdate: new Date(),
        isConnected: true,
      }));
    } catch (error) {
      console.error("Failed to fetch hybrid achievements:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load achievements. Please try again.",
        isConnected: false,
      }));
    }
  }, [hybridService, effectiveUserId]);

  // ============================================================================
  // REAL-TIME UPDATES
  // ============================================================================

  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    // Set up real-time achievement updates
    const handleAchievementUnlocked = (data: any) => {
      console.log("Real-time achievement unlocked:", data);

      // Update the achievements with new data
      setState((prev) => ({
        ...prev,
        lastUpdate: new Date(),
        isConnected: true,
      }));

      // Optionally refresh data
      fetchAchievements();
    };

    // Register real-time handlers
    realTimeService.onAchievementUnlocked(handleAchievementUnlocked);

    // Initialize real-time service
    realTimeService.initialize().catch((error) => {
      console.warn("Failed to initialize real-time service:", error);
      setState((prev) => ({ ...prev, realTimeEnabled: false }));
    });

    // Cleanup
    return () => {
      realTimeService.disconnect();
    };
  }, [enableRealTimeUpdates, realTimeService, fetchAchievements]);

  // ============================================================================
  // PERIODIC REFRESH
  // ============================================================================

  useEffect(() => {
    const interval = setInterval(() => {
      if (state.realTimeEnabled) {
        fetchAchievements();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [fetchAchievements, state.realTimeEnabled]);

  // ============================================================================
  // INITIAL DATA LOAD
  // ============================================================================

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // ============================================================================
  // FILTERING AND SORTING
  // ============================================================================

  const filteredAndSortedAchievements = useMemo(() => {
    let filtered = state.achievements.filter((achievement) => {
      switch (filter) {
        case "unlocked":
          return achievement.unlocked;
        case "locked":
          return !achievement.unlocked;
        case "near_completion":
          return (
            !achievement.unlocked &&
            AchievementAdapter.calculateProgressPercentage(achievement) >= 80
          );
        case "all":
        default:
          return true;
      }
    });

    // Sort achievements
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rarity":
          const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
          return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        case "progress":
          return b.progress - a.progress;
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return a.category.localeCompare(b.category);
        case "unlocked_at":
          if (a.unlockedAt && b.unlockedAt) {
            return b.unlockedAt.getTime() - a.unlockedAt.getTime();
          }
          return a.unlocked ? -1 : 1;
        default:
          return 0;
      }
    });

    return filtered;
  }, [state.achievements, filter, sortBy]);

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "text-purple-600 bg-purple-100 border-purple-200";
      case "epic":
        return "text-blue-600 bg-blue-100 border-blue-200";
      case "rare":
        return "text-green-600 bg-green-100 border-green-200";
      case "common":
        return "text-gray-600 bg-gray-100 border-gray-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "👑";
      case "epic":
        return "💎";
      case "rare":
        return "⭐";
      case "common":
        return "🏆";
      default:
        return "🏆";
    }
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-600 bg-green-100";
      case "good":
        return "text-blue-600 bg-blue-100";
      case "fair":
        return "text-yellow-600 bg-yellow-100";
      case "poor":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getDataSourceIcon = (dataSource: string) => {
    switch (dataSource) {
      case "real":
        return "👤";
      case "mock":
        return "🎭";
      case "hybrid":
        return "🔄";
      default:
        return "❓";
    }
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderLoadingState = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading achievements...</span>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Achievements
        </h3>
        <p className="text-gray-600 mb-4">{state.error}</p>
        <button
          onClick={fetchAchievements}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const renderDataQualityIndicator = () => {
    if (!showDataQuality) return null;

    return (
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm text-gray-600">Data Quality:</span>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${getDataQualityColor(
            state.stats.dataQuality
          )}`}
        >
          {state.stats.dataQuality.toUpperCase()}
        </span>
        <span className="text-xs text-gray-500">
          ({state.stats.realEntries} real, {state.stats.mockEntries} mock)
        </span>
      </div>
    );
  };

  const renderAchievementCard = (achievement: NormalizedAchievement) => {
    const progressPercentage =
      AchievementAdapter.calculateProgressPercentage(achievement);
    const isNearCompletion = AchievementAdapter.isNearCompletion(achievement);

    return (
      <div
        key={achievement.id}
        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
          achievement.unlocked
            ? "bg-green-50 border-green-200"
            : "bg-white border-gray-200"
        } ${isNearCompletion ? "ring-2 ring-yellow-400 ring-opacity-50" : ""}`}
      >
        <div className="flex items-start space-x-4">
          {/* Achievement Icon */}
          <div className="flex-shrink-0">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                achievement.unlocked ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              {achievement.unlocked ? achievement.icon : "🔒"}
            </div>
          </div>

          {/* Achievement Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3
                className={`font-semibold ${
                  achievement.unlocked ? "text-green-900" : "text-gray-900"
                }`}
              >
                {achievement.name}
              </h3>
              {showRarityIndicators && (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${getRarityColor(
                    achievement.rarity
                  )}`}
                >
                  {getRarityIcon(achievement.rarity)} {achievement.rarity}
                </span>
              )}
              <span
                className="text-xs"
                title={`Data source: ${achievement.dataSource}`}
              >
                {getDataSourceIcon(achievement.dataSource)}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              {achievement.description}
            </p>

            {/* Progress Bar */}
            {showProgressBars && !achievement.unlocked && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>
                    {achievement.progress}/{achievement.maxProgress}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isNearCompletion ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {progressPercentage}% complete
                </div>
              </div>
            )}

            {/* Achievement Details */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Category: {achievement.category}</span>
                <span>Points: {achievement.points}</span>
              </div>
              {achievement.unlocked && achievement.unlockedAt && (
                <span className="text-xs text-green-600">
                  Unlocked {achievement.unlockedAt.toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFiltersAndSorting = () => (
    <div className="mb-6 space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        {["all", "unlocked", "locked", "near_completion"].map(
          (filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as FilterType)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === filterOption
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filterOption
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          )
        )}
      </div>

      {/* Sorting */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
        {["rarity", "progress", "name", "category", "unlocked_at"].map(
          (sortOption) => (
            <button
              key={sortOption}
              onClick={() => setSortBy(sortOption as SortType)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                sortBy === sortOption
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {sortOption
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          )
        )}
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (state.isLoading) {
    return renderLoadingState();
  }

  if (state.error) {
    return renderErrorState();
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {useHybridData ? "Hybrid Achievement System" : "Achievement System"}
          </h2>
          <p className="text-sm text-gray-600">
            Track your progress and unlock rewards
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              state.isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-xs text-gray-500">
            {state.isConnected ? "Live" : "Offline"}
          </span>
          {state.lastUpdate && (
            <span className="text-xs text-gray-500">
              {state.lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Data Quality Indicator */}
      {renderDataQualityIndicator()}

      {/* Filters and Sorting */}
      {renderFiltersAndSorting()}

      {/* Achievement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {state.achievements.filter((a) => a.unlocked).length}
          </div>
          <div className="text-sm text-green-700">Unlocked</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-600">
            {state.achievements.filter((a) => !a.unlocked).length}
          </div>
          <div className="text-sm text-gray-700">Locked</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {
              state.achievements.filter((a) =>
                AchievementAdapter.isNearCompletion(a)
              ).length
            }
          </div>
          <div className="text-sm text-yellow-700">Near Completion</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {state.achievements.reduce((sum, a) => sum + a.points, 0)}
          </div>
          <div className="text-sm text-blue-700">Total Points</div>
        </div>
      </div>

      {/* Achievement List */}
      <div className="space-y-4">
        {filteredAndSortedAchievements.map(renderAchievementCard)}
      </div>

      {/* Empty State */}
      {filteredAndSortedAchievements.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🏆</div>
          <p className="text-gray-600">
            No achievements found for the selected filter
          </p>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Debug Info:</strong>
          <br />
          Total Achievements: {state.stats.totalEntries}
          <br />
          Real Entries: {state.stats.realEntries}
          <br />
          Mock Entries: {state.stats.mockEntries}
          <br />
          Hybrid Entries: {state.stats.hybridEntries}
          <br />
          Data Quality: {state.stats.dataQuality}
          <br />
          Real-time Enabled: {state.realTimeEnabled ? "Yes" : "No"}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default HybridAchievementSystem;
