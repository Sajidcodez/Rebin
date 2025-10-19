import { useState, useEffect, useCallback } from "react";
import { MockDataService } from "../lib/mockData";
import { StatsPanel } from "./StatsPanel";

interface StatsData {
  totalItems: number;
  totalCo2Saved: number;
  totalUsers: number;
  recyclingRate: number;
  recentActivity: any[];
}

interface RealTimeStatsProps {
  userId?: string;
  zipCode?: string;
}

export function RealTimeStats({ userId, zipCode }: RealTimeStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isConnected, setIsConnected] = useState(true); // Mock as always connected
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use mock user ID if none provided (for demo purposes)
  const effectiveUserId = userId || "demo-user-123";

  // Fetch initial stats
  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get mock user stats
      const userStats = await MockDataService.getUserStats(effectiveUserId);

      // Create mock stats data
      setStats({
        totalItems: userStats.totalItemsSorted,
        totalCo2Saved: userStats.totalCo2Saved,
        totalUsers: 1247, // Mock community size
        recyclingRate: 78.5, // Mock recycling rate
        recentActivity: [
          { date: "2024-03-20", items: 12, co2: 0.8 },
          { date: "2024-03-19", items: 8, co2: 0.6 },
          { date: "2024-03-18", items: 15, co2: 1.1 },
          { date: "2024-03-17", items: 6, co2: 0.4 },
          { date: "2024-03-16", items: 10, co2: 0.7 },
          { date: "2024-03-15", items: 14, co2: 1.0 },
          { date: "2024-03-14", items: 9, co2: 0.6 },
        ],
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setError("Failed to load stats. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  // Mock real-time updates (simulate periodic refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates every 60 seconds
      fetchStats();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  // Fetch initial stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading stats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Stats
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Stats Available
        </h3>
        <p className="text-gray-600">
          Start sorting items to see your statistics!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Live Statistics</h2>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-sm text-gray-600">
            {isConnected ? "Live" : "Offline"}
          </span>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Stats Panel */}
      <StatsPanel
        totalItems={stats.totalItems}
        totalCo2Saved={stats.totalCo2Saved}
        totalUsers={stats.totalUsers}
        recyclingRate={stats.recyclingRate}
        isRealTime={true}
      />

      {/* Recent Activity Indicator */}
      {stats.recentActivity.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-green-800">
              {stats.recentActivity.length} activities in the last 7 days
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
