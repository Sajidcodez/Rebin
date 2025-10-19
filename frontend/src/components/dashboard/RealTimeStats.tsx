import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Button, Spinner } from "../ui/button";
import { Icons } from "../ui/icons";

// ============================================================================
// TYPES
// ============================================================================

interface StatsData {
  totalItems: number;
  totalCO2: number;
  currentStreak: number;
  achievementsUnlocked: number;
  itemsTrend: number;
  co2Trend: number;
  streakTrend: number;
  achievementsTrend: number;
  lastUpdate: Date;
}

interface SortEvent {
  id: number;
  user_id: string;
  items_json: string[];
  decision: string;
  co2e_saved: number;
  created_at: string;
}

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  color: "primary" | "green" | "orange" | "purple";
  loading?: boolean;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = React.memo(
  ({ title, value, trend, icon, color, loading = false, onClick }) => {
    const formattedValue = useMemo(() => {
      if (loading) return "---";
      return typeof value === "number" ? value.toLocaleString() : value;
    }, [value, loading]);

    const trendColor = useMemo(() => {
      if (!trend) return "text-gray-500";
      return trend > 0 ? "text-green-600" : "text-red-600";
    }, [trend]);

    const trendIcon = useMemo(() => {
      if (!trend) return null;
      return trend > 0 ? (
        <Icons.trendingUp className="w-4 h-4" />
      ) : (
        <Icons.trendingDown className="w-4 h-4" />
      );
    }, [trend]);

    const colorClasses = useMemo(() => {
      switch (color) {
        case "primary":
          return "bg-primary-50 border-primary-200 text-primary-800";
        case "green":
          return "bg-green-50 border-green-200 text-green-800";
        case "orange":
          return "bg-orange-50 border-orange-200 text-orange-800";
        case "purple":
          return "bg-purple-50 border-purple-200 text-purple-800";
        default:
          return "bg-gray-50 border-gray-200 text-gray-800";
      }
    }, [color]);

    return (
      <div
        className={`${colorClasses} border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick?.()}
        aria-label={`${title}: ${formattedValue}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium opacity-75 mb-1">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">
                {loading ? <Spinner size="sm" /> : formattedValue}
              </p>
              {trend !== undefined && !loading && (
                <div className={`flex items-center space-x-1 ${trendColor}`}>
                  {trendIcon}
                  <span className="text-sm font-medium">
                    {Math.abs(trend)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">{icon}</div>
        </div>
      </div>
    );
  }
);

StatsCard.displayName = "StatsCard";

// ============================================================================
// REAL-TIME STATS COMPONENT
// ============================================================================

export const RealTimeStats: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats from events
  const calculateStatsFromEvents = useCallback(
    (events: SortEvent[]): StatsData => {
      const totalItems = events.length;
      const totalCO2 = events.reduce((sum, event) => sum + event.co2e_saved, 0);

      // Calculate current streak (consecutive days with sorting activity)
      const sortedEvents = events.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 30; i++) {
        // Check last 30 days
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);

        const hasActivity = sortedEvents.some((event) => {
          const eventDate = new Date(event.created_at);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() === checkDate.getTime();
        });

        if (hasActivity) {
          currentStreak++;
        } else if (i > 0) {
          // Don't break streak on first day if no activity
          break;
        }
      }

      // Mock achievements (in real app, this would come from database)
      const achievementsUnlocked = Math.min(Math.floor(totalItems / 10), 20);

      // Calculate trends (mock data for now)
      const itemsTrend =
        totalItems > 0 ? Math.floor(Math.random() * 20) - 10 : 0;
      const co2Trend = totalCO2 > 0 ? Math.floor(Math.random() * 15) - 5 : 0;
      const streakTrend =
        currentStreak > 0 ? Math.floor(Math.random() * 10) : 0;
      const achievementsTrend =
        achievementsUnlocked > 0 ? Math.floor(Math.random() * 25) : 0;

      return {
        totalItems,
        totalCO2,
        currentStreak,
        achievementsUnlocked,
        itemsTrend,
        co2Trend,
        streakTrend,
        achievementsTrend,
        lastUpdate: new Date(),
      };
    },
    []
  );

  // Update stats with new event
  const updateStatsWithEvent = useCallback(
    (prevStats: StatsData | null, event: SortEvent): StatsData => {
      if (!prevStats) {
        return calculateStatsFromEvents([event]);
      }

      return {
        ...prevStats,
        totalItems: prevStats.totalItems + 1,
        totalCO2: prevStats.totalCO2 + event.co2e_saved,
        lastUpdate: new Date(),
      };
    },
    [calculateStatsFromEvents]
  );

  // Fetch initial stats
  const fetchInitialStats = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("sort_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch stats: ${error.message}`);
      }

      const calculatedStats = calculateStatsFromEvents(data || []);
      setStats(calculatedStats);
    } catch (error) {
      console.error("Failed to fetch initial stats:", error);
      setError(error instanceof Error ? error.message : "Failed to load stats");
    } finally {
      setIsLoading(false);
    }
  }, [user, calculateStatsFromEvents]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("user-stats")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sort_events",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Real-time update received:", payload);

          if (payload.eventType === "INSERT" && payload.new) {
            const newEvent = payload.new as SortEvent;
            setStats((prevStats) => updateStatsWithEvent(prevStats, newEvent));
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, updateStatsWithEvent]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialStats();
  }, [fetchInitialStats]);

  // Format relative time
  const formatRelativeTime = useCallback((date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  // Handle card click
  const handleCardClick = useCallback((title: string) => {
    console.log(`Clicked on ${title} card`);
    // TODO: Navigate to detailed view or show more information
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your impact stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Icons.alertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Failed to Load Stats
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchInitialStats} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <Icons.barChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Data Yet
          </h3>
          <p className="text-gray-600">
            Start sorting waste to see your impact stats here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Impact Dashboard
            </h1>
            <p className="text-gray-600">
              Track your environmental impact in real-time
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
                aria-label={`Real-time updates ${
                  isConnected ? "active" : "inactive"
                }`}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>

            <div className="text-sm text-gray-500">
              Updated {formatRelativeTime(stats.lastUpdate)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Items Sorted"
          value={stats.totalItems}
          trend={stats.itemsTrend}
          icon={<Icons.recycle className="w-8 h-8" />}
          color="primary"
          onClick={() => handleCardClick("Items Sorted")}
        />

        <StatsCard
          title="CO₂ Saved"
          value={`${stats.totalCO2.toFixed(1)}kg`}
          trend={stats.co2Trend}
          icon={<Icons.leaf className="w-8 h-8" />}
          color="green"
          onClick={() => handleCardClick("CO₂ Saved")}
        />

        <StatsCard
          title="Streak Days"
          value={stats.currentStreak}
          trend={stats.streakTrend}
          icon={<Icons.flame className="w-8 h-8" />}
          color="orange"
          onClick={() => handleCardClick("Streak Days")}
        />

        <StatsCard
          title="Achievements"
          value={stats.achievementsUnlocked}
          trend={stats.achievementsTrend}
          icon={<Icons.trophy className="w-8 h-8" />}
          color="purple"
          onClick={() => handleCardClick("Achievements")}
        />
      </div>

      {/* Additional Stats Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="text-center text-gray-500">
          <Icons.activity className="w-8 h-8 mx-auto mb-2" />
          <p>Recent sorting activity will appear here</p>
        </div>
      </div>
    </div>
  );
};
