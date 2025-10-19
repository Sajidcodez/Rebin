import { useState, useEffect, useCallback } from "react";
import { MockDataService, MockLeaderboardEntry } from "../lib/mockData";
import { HybridDataService } from "../lib/services/HybridDataService";
import {
  LeaderboardAdapter,
  NormalizedLeaderboardEntry,
} from "../lib/adapters/DataAdapters";

interface LeaderboardProps {
  timePeriod?: "1d" | "7d" | "30d" | "all";
  limit?: number;
  showCurrentUser?: boolean;
  currentUserId?: string;
  useHybridData?: boolean; // New prop to enable hybrid data
  showDataQuality?: boolean; // Show data quality indicators
}

export function Leaderboard({
  timePeriod = "7d",
  limit = 10,
  showCurrentUser: _showCurrentUser = true,
  currentUserId,
  useHybridData = false,
  showDataQuality = false,
}: LeaderboardProps) {
  // State management - support both mock and hybrid data
  const [leaderboard, setLeaderboard] = useState<MockLeaderboardEntry[]>([]);
  const [hybridLeaderboard, setHybridLeaderboard] = useState<
    NormalizedLeaderboardEntry[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataQuality, setDataQuality] = useState<string>("poor");

  // Use mock user ID if none provided (for demo purposes)
  const effectiveUserId = currentUserId || "demo-user-123";

  // Initialize hybrid service
  const hybridService = useHybridData ? new HybridDataService() : null;

  // Fetch leaderboard data - supports both mock and hybrid modes
  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (useHybridData && hybridService) {
        // Use hybrid data service
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

        setHybridLeaderboard(rankedEntries);
        setDataQuality(result.stats.dataQuality);
        setIsConnected(true);
      } else {
        // Use traditional mock data service
        const data = await MockDataService.getLeaderboard(limit, timePeriod);
        setLeaderboard(data);
        setDataQuality("mock");
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setError("Failed to load leaderboard. Please try again.");
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [limit, timePeriod, useHybridData, hybridService, effectiveUserId]);

  // Mock real-time updates (simulate periodic refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates every 30 seconds
      fetchLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  // Fetch initial data
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

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
      case "mock":
        return "text-purple-600 bg-purple-100";
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-2 text-gray-600">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Leaderboard
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {useHybridData ? "Hybrid Leaderboard" : "Leaderboard"}
          </h2>
          <p className="text-sm text-gray-600">
            Top performers in the last{" "}
            {timePeriod === "all" ? "all time" : timePeriod}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-xs text-gray-500">
            {isConnected ? "Live" : "Offline"}
          </span>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Data Quality Indicator */}
      {showDataQuality && (
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm text-gray-600">Data Quality:</span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getDataQualityColor(
              dataQuality
            )}`}
          >
            {dataQuality.toUpperCase()}
          </span>
          {useHybridData && (
            <span className="text-xs text-gray-500">(Hybrid mode enabled)</span>
          )}
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-3">
        {(useHybridData ? hybridLeaderboard : leaderboard).map((entry) => {
          const isCurrentUser =
            effectiveUserId &&
            (useHybridData
              ? (entry as NormalizedLeaderboardEntry).id === effectiveUserId
              : (entry as MockLeaderboardEntry).user_id === effectiveUserId);

          // Handle both data types
          const entryData = useHybridData
            ? (entry as NormalizedLeaderboardEntry)
            : (entry as MockLeaderboardEntry);

          const rank = useHybridData
            ? (entryData as NormalizedLeaderboardEntry).rank
            : (entryData as MockLeaderboardEntry).rank_position;

          const name = useHybridData
            ? (entryData as NormalizedLeaderboardEntry).name
            : (entryData as MockLeaderboardEntry).user_name;

          const avatar = useHybridData
            ? (entryData as NormalizedLeaderboardEntry).avatar
            : (entryData as MockLeaderboardEntry).avatar_url;

          const itemsSorted = useHybridData
            ? (entryData as NormalizedLeaderboardEntry).totalItemsSorted
            : (entryData as MockLeaderboardEntry).total_items_sorted;

          const points = useHybridData
            ? (entryData as NormalizedLeaderboardEntry).totalPoints
            : (entryData as MockLeaderboardEntry).total_points;

          const co2Saved = useHybridData
            ? (entryData as NormalizedLeaderboardEntry).totalCo2Saved
            : (entryData as MockLeaderboardEntry).total_co2_saved;

          const dataSource = useHybridData
            ? (entryData as NormalizedLeaderboardEntry).dataSource
            : "mock";

          return (
            <div
              key={
                useHybridData
                  ? (entryData as NormalizedLeaderboardEntry).id
                  : (entryData as MockLeaderboardEntry).user_id
              }
              className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${getRankColor(
                rank
              )} ${
                isCurrentUser ? "ring-2 ring-green-500 ring-opacity-50" : ""
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 text-center">
                <span className="text-lg font-bold text-gray-700">
                  {getRankIcon(rank)}
                </span>
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0 ml-4">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-grow ml-4">
                <div className="flex items-center">
                  <h3 className="font-semibold text-gray-900">{name}</h3>
                  {isCurrentUser && (
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      You
                    </span>
                  )}
                  {useHybridData && (
                    <span
                      className="ml-2 text-xs"
                      title={`Data source: ${dataSource}`}
                    >
                      {getDataSourceIcon(dataSource)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {itemsSorted} items sorted
                </p>
              </div>

              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold text-green-600">
                  {points.toLocaleString()} pts
                </div>
                <div className="text-sm text-gray-600">
                  {co2Saved.toFixed(2)} kg CO₂
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {(useHybridData
        ? hybridLeaderboard.length === 0
        : leaderboard.length === 0) && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🏆</div>
          <p className="text-gray-600">
            No data available for this time period
          </p>
        </div>
      )}

      {/* Time Period Selector */}
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
    </div>
  );
}
