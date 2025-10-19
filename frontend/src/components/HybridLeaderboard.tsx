/**
 * Hybrid Leaderboard Component
 * Combines mock and real-time data for a rich, competitive experience
 * Follows best practices for performance, error handling, and user experience
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  HybridDataService,
  HybridLeaderboardEntry,
  HybridDataStats,
} from "../lib/services/HybridDataService";
import {
  LeaderboardAdapter,
  NormalizedLeaderboardEntry,
} from "../lib/adapters/DataAdapters";
import { realTimeDataService } from "../lib/services/RealTimeDataService";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface HybridLeaderboardProps {
  timePeriod?: "1d" | "7d" | "30d" | "all";
  limit?: number;
  showCurrentUser?: boolean;
  currentUserId?: string;
  enableRealTimeUpdates?: boolean;
  showDataQuality?: boolean;
  className?: string;
}

interface LeaderboardState {
  entries: NormalizedLeaderboardEntry[];
  stats: HybridDataStats;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  realTimeEnabled: boolean;
}

// ============================================================================
// HYBRID LEADERBOARD COMPONENT
// ============================================================================

export function HybridLeaderboard({
  timePeriod = "7d",
  limit = 10,
  showCurrentUser = true,
  currentUserId,
  enableRealTimeUpdates = true,
  showDataQuality = true,
  className = "",
}: HybridLeaderboardProps) {
  // State management
  const [state, setState] = useState<LeaderboardState>({
    entries: [],
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

  // Use mock user ID if none provided (for demo purposes)
  const effectiveUserId = currentUserId || "demo-user-123";

  // Initialize services
  const hybridService = useMemo(() => new HybridDataService(), []);
  const realTimeService = useMemo(() => realTimeDataService, []);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchLeaderboard = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch hybrid data
      const result = await hybridService.getHybridLeaderboard(
        limit,
        timePeriod,
        effectiveUserId
      );

      // Normalize entries using adapter
      const normalizedEntries = result.entries.map((entry) =>
        LeaderboardAdapter.normalizeMockEntry(entry as any)
      );

      // Sort and update ranks
      const sortedEntries = LeaderboardAdapter.sortEntries(normalizedEntries);
      const rankedEntries = LeaderboardAdapter.updateRanks(sortedEntries);

      setState((prev) => ({
        ...prev,
        entries: rankedEntries,
        stats: result.stats,
        isLoading: false,
        lastUpdate: new Date(),
        isConnected: true,
      }));
    } catch (error) {
      console.error("Failed to fetch hybrid leaderboard:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load leaderboard. Please try again.",
        isConnected: false,
      }));
    }
  }, [hybridService, limit, timePeriod, effectiveUserId]);

  // ============================================================================
  // REAL-TIME UPDATES
  // ============================================================================

  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    // Set up real-time leaderboard updates
    const handleLeaderboardUpdate = (data: any[]) => {
      console.log("Real-time leaderboard update received:", data);

      // Update the leaderboard with new data
      setState((prev) => ({
        ...prev,
        lastUpdate: new Date(),
        isConnected: true,
      }));

      // Optionally refresh data
      fetchLeaderboard();
    };

    // Register real-time handlers
    realTimeService.onLeaderboardUpdate(handleLeaderboardUpdate);

    // Initialize real-time service
    realTimeService.initialize().catch((error) => {
      console.warn("Failed to initialize real-time service:", error);
      setState((prev) => ({ ...prev, realTimeEnabled: false }));
    });

    // Cleanup
    return () => {
      realTimeService.disconnect();
    };
  }, [enableRealTimeUpdates, realTimeService, fetchLeaderboard]);

  // ============================================================================
  // PERIODIC REFRESH
  // ============================================================================

  useEffect(() => {
    const interval = setInterval(() => {
      if (state.realTimeEnabled) {
        fetchLeaderboard();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchLeaderboard, state.realTimeEnabled]);

  // ============================================================================
  // INITIAL DATA LOAD
  // ============================================================================

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 border-yellow-300";
      case 2:
        return "bg-gray-100 border-gray-300";
      case 3:
        return "bg-orange-100 border-orange-300";
      default:
        return "bg-white border-gray-200";
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
        <span className="ml-2 text-gray-600">
          Loading hybrid leaderboard...
        </span>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Leaderboard
        </h3>
        <p className="text-gray-600 mb-4">{state.error}</p>
        <button
          onClick={fetchLeaderboard}
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

  const renderLeaderboardEntry = (entry: NormalizedLeaderboardEntry) => {
    const isCurrentUser = effectiveUserId && entry.id === effectiveUserId;

    return (
      <div
        key={entry.id}
        className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${getRankColor(
          entry.rank
        )} ${isCurrentUser ? "ring-2 ring-green-500 ring-opacity-50" : ""}`}
      >
        {/* Rank */}
        <div className="flex-shrink-0 w-12 text-center">
          <span className="text-lg font-bold text-gray-700">
            {getRankIcon(entry.rank)}
          </span>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0 ml-4">
          {entry.avatar ? (
            <img
              src={entry.avatar}
              alt={entry.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {entry.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-grow ml-4">
          <div className="flex items-center">
            <h3 className="font-semibold text-gray-900">{entry.name}</h3>
            {isCurrentUser && (
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                You
              </span>
            )}
            <span
              className="ml-2 text-xs"
              title={`Data source: ${entry.dataSource}`}
            >
              {getDataSourceIcon(entry.dataSource)}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {entry.totalItemsSorted} items sorted
          </p>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-bold text-green-600">
            {entry.totalPoints.toLocaleString()} pts
          </div>
          <div className="text-sm text-gray-600">
            {entry.totalCo2Saved.toFixed(2)} kg CO₂
          </div>
        </div>
      </div>
    );
  };

  const renderTimePeriodSelector = () => (
    <div className="mt-6 flex justify-center">
      <div className="bg-gray-100 rounded-lg p-1 flex">
        {["1d", "7d", "30d", "all"].map((period) => (
          <button
            key={period}
            onClick={() => {
              // This would trigger a re-fetch with new time period
              // For now, we'll just show the current selection
            }}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              timePeriod === period
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {period === "all" ? "All Time" : period}
          </button>
        ))}
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
            Hybrid Leaderboard
          </h2>
          <p className="text-sm text-gray-600">
            Top performers in the last{" "}
            {timePeriod === "all" ? "all time" : timePeriod}
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

      {/* Leaderboard List */}
      <div className="space-y-3">
        {state.entries.map(renderLeaderboardEntry)}
      </div>

      {/* Empty State */}
      {state.entries.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🏆</div>
          <p className="text-gray-600">
            No data available for this time period
          </p>
        </div>
      )}

      {/* Time Period Selector */}
      {renderTimePeriodSelector()}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Debug Info:</strong>
          <br />
          Total Entries: {state.stats.totalEntries}
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

export default HybridLeaderboard;
