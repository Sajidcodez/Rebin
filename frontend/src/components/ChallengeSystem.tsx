import { useState, useEffect, useCallback } from "react";
import { MockDataService, MockChallenge } from "../lib/mockData";

interface ChallengeSystemProps {
  userId?: string;
  onJoinChallenge?: (challengeId: number) => void;
}

export function ChallengeSystem({
  userId,
  onJoinChallenge,
}: ChallengeSystemProps) {
  const [challenges, setChallenges] = useState<MockChallenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<MockChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true); // Mock as always connected
  const [activeTab, setActiveTab] = useState<"available" | "participating">(
    "available"
  );

  // Use mock user ID if none provided (for demo purposes)
  const effectiveUserId = userId || "demo-user-123";

  // Fetch challenges
  const fetchChallenges = useCallback(async () => {
    try {
      setError(null);
      const data = await MockDataService.getChallenges(false);
      setChallenges(data);
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
      setError("Failed to load challenges. Please try again.");
    }
  }, []);

  // Fetch user's participating challenges
  const fetchUserChallenges = useCallback(async () => {
    try {
      const data = await MockDataService.getUserChallenges(effectiveUserId);
      setUserChallenges(data);
    } catch (error) {
      console.error("Failed to fetch user challenges:", error);
    }
  }, [effectiveUserId]);

  // Join a challenge
  const joinChallenge = async (challengeId: number) => {
    try {
      const success = await MockDataService.joinChallenge(
        effectiveUserId,
        challengeId
      );
      if (success) {
        // Refresh user challenges
        await fetchUserChallenges();
        onJoinChallenge?.(challengeId);
      }
    } catch (error) {
      console.error("Failed to join challenge:", error);
    }
  };

  // Mock real-time updates (simulate periodic refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates every 45 seconds
      fetchChallenges();
      fetchUserChallenges();
    }, 45000);

    return () => clearInterval(interval);
  }, [fetchChallenges, fetchUserChallenges]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchChallenges(), fetchUserChallenges()]);
      setIsLoading(false);
    };

    fetchData();
  }, [fetchChallenges, fetchUserChallenges]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case "recycling":
        return "♻️";
      case "compost":
        return "🌱";
      case "reduction":
        return "📉";
      case "education":
        return "📚";
      default:
        return "🎯";
    }
  };

  const calculateProgress = (challenge: MockChallenge) => {
    return challenge.progress || 0;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-2 text-gray-600">Loading challenges...</span>
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
            Error Loading Challenges
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              fetchChallenges();
              fetchUserChallenges();
            }}
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
            Community Challenges
          </h2>
          <p className="text-sm text-gray-600">
            Join challenges and compete with the community
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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-6">
        <button
          onClick={() => setActiveTab("available")}
          className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
            activeTab === "available"
              ? "bg-green-500 text-white border-green-500"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Available ({challenges.length})
        </button>
        <button
          onClick={() => setActiveTab("participating")}
          className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
            activeTab === "participating"
              ? "bg-green-500 text-white border-green-500"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Participating ({userChallenges.length})
        </button>
      </div>

      {/* Available Challenges */}
      {activeTab === "available" && (
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">
                      {getChallengeTypeIcon(challenge.challengeType)}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {challenge.title}
                    </h3>
                    {challenge.isFeatured && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>

                  {challenge.description && (
                    <p className="text-gray-600 mb-3">
                      {challenge.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 mb-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(
                        challenge.difficultyLevel
                      )}`}
                    >
                      {challenge.difficultyLevel}
                    </span>
                    <span className="text-sm text-gray-600">
                      {challenge.rewardPoints} points
                    </span>
                    {challenge.targetItems && (
                      <span className="text-sm text-gray-600">
                        Target: {challenge.targetItems} items
                      </span>
                    )}
                    {challenge.targetCo2 && (
                      <span className="text-sm text-gray-600">
                        Target: {challenge.targetCo2} kg CO₂
                      </span>
                    )}
                    <span className="text-sm text-gray-600">
                      {challenge.participants} participants
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => joinChallenge(challenge.id)}
                  disabled={challenge.joined}
                  className={`ml-4 px-4 py-2 rounded-lg transition-colors ${
                    challenge.joined
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  }`}
                >
                  {challenge.joined ? "Joined" : "Join Challenge"}
                </button>
              </div>
            </div>
          ))}

          {challenges.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🎯</div>
              <p className="text-gray-600">
                No challenges available at the moment
              </p>
            </div>
          )}
        </div>
      )}

      {/* Participating Challenges */}
      {activeTab === "participating" && (
        <div className="space-y-4">
          {userChallenges.map((challenge) => {
            const progress = calculateProgress(challenge);

            return (
              <div
                key={challenge.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">
                        {getChallengeTypeIcon(challenge.challengeType)}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {challenge.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-4 mb-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(
                          challenge.difficultyLevel
                        )}`}
                      >
                        {challenge.difficultyLevel}
                      </span>
                      <span className="text-sm text-gray-600">
                        {challenge.rewardPoints} points reward
                      </span>
                    </div>
                  </div>

                  {challenge.completed && (
                    <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                      Completed! 🎉
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Ends {new Date(challenge.endDate).toLocaleDateString()}
                </div>
              </div>
            );
          })}

          {userChallenges.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🏃‍♂️</div>
              <p className="text-gray-600">
                You're not participating in any challenges yet
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Switch to "Available" tab to join some challenges!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
