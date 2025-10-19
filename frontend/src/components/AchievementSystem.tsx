import { useState, useEffect, useCallback } from "react";
import { MockDataService, MockAchievement } from "../lib/mockData";

interface AchievementSystemProps {
  userId?: string;
  className?: string;
}

export function AchievementSystem({
  userId,
  className = "",
}: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<MockAchievement[]>([]);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked" | string>(
    "all"
  );
  const [sortBy, setSortBy] = useState<
    "rarity" | "progress" | "name" | "category"
  >("rarity");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use mock user ID if none provided (for demo purposes)
  const effectiveUserId = userId || "demo-user-123";

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await MockDataService.getAchievements(effectiveUserId);
      setAchievements(data);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      setError("Failed to load achievements. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  // Fetch initial data
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Filter and sort achievements
  const filteredAndSortedAchievements = achievements
    .filter((achievement) => {
      if (filter === "unlocked") return achievement.unlocked;
      if (filter === "locked") return !achievement.unlocked;
      if (filter === "all") return true;
      return achievement.category === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rarity":
          const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        case "progress":
          return b.progress - a.progress;
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  // Calculate stats
  const stats = {
    total: achievements.length,
    unlocked: achievements.filter((a) => a.unlocked).length,
    locked: achievements.filter((a) => !a.unlocked).length,
    totalPoints: achievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0),
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "epic":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rare":
        return "bg-green-100 text-green-800 border-green-200";
      case "common":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "milestone":
        return "🎯";
      case "recycling":
        return "♻️";
      case "compost":
        return "🌱";
      case "environmental":
        return "🌍";
      case "consistency":
        return "🔥";
      default:
        return "🏆";
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-2 text-gray-600">Loading achievements...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Achievements
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAchievements}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
          <p className="text-sm text-gray-600">
            Track your progress and unlock rewards
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {stats.unlocked}/{stats.total}
          </div>
          <div className="text-sm text-gray-600">Unlocked</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.unlocked}
          </div>
          <div className="text-sm text-gray-600">Unlocked</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalPoints}
          </div>
          <div className="text-sm text-gray-600">Points</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            filter === "all"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter("unlocked")}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            filter === "unlocked"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Unlocked ({stats.unlocked})
        </button>
        <button
          onClick={() => setFilter("locked")}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            filter === "locked"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Locked ({stats.locked})
        </button>
        <button
          onClick={() => setFilter("milestone")}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            filter === "milestone"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Milestones
        </button>
        <button
          onClick={() => setFilter("recycling")}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            filter === "recycling"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Recycling
        </button>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-600">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="rarity">Rarity</option>
          <option value="progress">Progress</option>
          <option value="name">Name</option>
          <option value="category">Category</option>
        </select>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`border-2 rounded-lg p-4 transition-all duration-200 ${
              achievement.unlocked
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{achievement.icon}</div>
              <div className="text-right">
                <span
                  className={`px-2 py-1 text-xs rounded-full border ${getRarityColor(
                    achievement.rarity
                  )}`}
                >
                  {achievement.rarity}
                </span>
                <div className="text-sm font-semibold text-gray-900 mt-1">
                  {achievement.points} pts
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">
              {achievement.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {achievement.description}
            </p>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <span className="text-sm">
                  {getCategoryIcon(achievement.category)}
                </span>
                <span className="text-xs text-gray-600 capitalize">
                  {achievement.category}
                </span>
              </div>
              {achievement.unlocked && (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Unlocked
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>
                  {achievement.progress}/{achievement.maxProgress}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    achievement.unlocked ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (achievement.progress / achievement.maxProgress) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {achievement.unlocked && achievement.unlockedAt && (
              <div className="text-xs text-gray-500">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedAchievements.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No achievements found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or start sorting items to unlock
            achievements!
          </p>
        </div>
      )}
    </div>
  );
}
