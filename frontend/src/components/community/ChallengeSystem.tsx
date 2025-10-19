import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToastNotifications } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { CommunityService } from "../../lib/services/CommunityService";
import { SupabaseCommunityRepository } from "../../lib/repositories/CommunityRepository";
import type {
  Challenge,
  ChallengeParticipation,
  ChallengeFilters as ChallengeFiltersType,
} from "../../lib/repositories/CommunityRepository";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { cn } from "../../lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface ChallengeSystemProps {
  className?: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
  userParticipation?: ChallengeParticipation;
  onJoin?: (challengeId: string) => void;
  onViewDetails?: (challengeId: string) => void;
}

interface ChallengeFiltersProps {
  onFilterChange: (filters: ChallengeFiltersType) => void;
  currentFilters: ChallengeFiltersType;
}

// ============================================================================
// CHALLENGE FILTERS COMPONENT
// ============================================================================

const ChallengeFilters: React.FC<ChallengeFiltersProps> = ({
  onFilterChange,
  currentFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryChange = useCallback(
    (category: Challenge["category"] | "all") => {
      onFilterChange({
        ...currentFilters,
        category: category === "all" ? undefined : category,
      });
    },
    [onFilterChange, currentFilters]
  );

  const handleStatusChange = useCallback(
    (status: "all" | "active" | "upcoming" | "completed") => {
      onFilterChange({
        ...currentFilters,
        status: status === "all" ? undefined : status,
      });
    },
    [onFilterChange, currentFilters]
  );

  const categories = [
    { value: "all", label: "All Categories", icon: Icons.grid },
    { value: "recycling", label: "Recycling", icon: Icons.recycle },
    { value: "compost", label: "Composting", icon: Icons.leaf },
    { value: "reduction", label: "Reduction", icon: Icons.minus },
    { value: "education", label: "Education", icon: Icons.book },
  ];

  const statuses = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "upcoming", label: "Upcoming" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div
      className="challenge-filters"
      role="region"
      aria-label="Challenge filters"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Community Challenges
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="filter-content"
        >
          <Icons.filter className="w-4 h-4 mr-2" />
          Filters
          <Icons.chevronDown
            className={cn(
              "w-4 h-4 ml-2 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </Button>
      </div>

      <div
        id="filter-content"
        className={cn(
          "transition-all duration-200 overflow-hidden",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryChange(category.value as any)}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    currentFilters.category === category.value ||
                      (category.value === "all" && !currentFilters.category)
                      ? "bg-primary-100 text-primary-800 border border-primary-200"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  )}
                  aria-pressed={
                    currentFilters.category === category.value ||
                    (category.value === "all" && !currentFilters.category)
                  }
                >
                  <category.icon
                    className="w-4 h-4 mr-1.5"
                    aria-hidden="true"
                  />
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value as any)}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    currentFilters.status === status.value ||
                      (status.value === "all" && !currentFilters.status)
                      ? "bg-primary-100 text-primary-800 border border-primary-200"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  )}
                  aria-pressed={
                    currentFilters.status === status.value ||
                    (status.value === "all" && !currentFilters.status)
                  }
                >
                  {status.label}
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
// CHALLENGE CARD COMPONENT
// ============================================================================

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  userParticipation,
  onJoin,
  onViewDetails,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = useCallback(async () => {
    if (!onJoin || userParticipation) return;

    setIsJoining(true);
    try {
      await onJoin(challenge.id);
    } finally {
      setIsJoining(false);
    }
  }, [onJoin, challenge.id, userParticipation]);

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(challenge.id);
  }, [onViewDetails, challenge.id]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: Challenge["category"]) => {
    switch (category) {
      case "recycling":
        return Icons.recycle;
      case "compost":
        return Icons.leaf;
      case "reduction":
        return Icons.minus;
      case "education":
        return Icons.book;
      default:
        return Icons.grid;
    }
  };

  const CategoryIcon = getCategoryIcon(challenge.category);
  const isActive =
    challenge.isActive &&
    new Date() >= challenge.startDate &&
    new Date() <= challenge.endDate;
  const isUpcoming = new Date() < challenge.startDate;
  // const isCompleted = new Date() > challenge.endDate;

  return (
    <article
      className="challenge-card bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
      role="article"
      aria-labelledby={`challenge-title-${challenge.id}`}
      aria-describedby={`challenge-description-${challenge.id}`}
    >
      <header className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <CategoryIcon
                    className="w-5 h-5 text-primary-600"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id={`challenge-title-${challenge.id}`}
                  className="text-lg font-semibold text-gray-900 truncate"
                >
                  {challenge.title}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {challenge.category} Challenge
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                isActive
                  ? getStatusColor("active")
                  : isUpcoming
                  ? getStatusColor("upcoming")
                  : getStatusColor("completed")
              )}
              aria-label={`Challenge status: ${
                isActive ? "active" : isUpcoming ? "upcoming" : "completed"
              }`}
            >
              {isActive ? "Active" : isUpcoming ? "Upcoming" : "Completed"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Icons.users className="w-4 h-4" aria-hidden="true" />
              <span aria-label={`${challenge.participantCount} participants`}>
                {challenge.participantCount}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Icons.calendar className="w-4 h-4" aria-hidden="true" />
              <span>{challenge.duration} days</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Icons.target className="w-4 h-4" aria-hidden="true" />
            <span>{challenge.targetItems} items</span>
          </div>
        </div>
      </header>

      <div className="p-6">
        <p
          id={`challenge-description-${challenge.id}`}
          className="text-gray-700 mb-4 line-clamp-2"
        >
          {challenge.description}
        </p>

        {/* Progress visualization */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{challenge.progress}%</span>
          </div>
          <div
            className="w-full bg-gray-200 rounded-full h-2"
            role="progressbar"
            aria-valuenow={challenge.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Challenge progress: ${challenge.progress}%`}
          >
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${challenge.progress}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={handleToggleExpanded}
          className="flex items-center text-sm text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
          aria-expanded={isExpanded}
          aria-controls={`challenge-details-${challenge.id}`}
        >
          {isExpanded ? "Show Less" : "Show More"}
          <Icons.chevronDown
            className={cn(
              "w-4 h-4 ml-1 transition-transform",
              isExpanded && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>

        <div
          id={`challenge-details-${challenge.id}`}
          className={cn(
            "transition-all duration-200 overflow-hidden",
            isExpanded ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-4">
            {/* Challenge Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Target Items</div>
                <div className="text-lg font-semibold text-gray-900">
                  {challenge.targetItems.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Target CO₂</div>
                <div className="text-lg font-semibold text-gray-900">
                  {challenge.targetCO2}kg
                </div>
              </div>
            </div>

            {/* Rewards */}
            {challenge.rewards.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Rewards
                </h4>
                <div className="space-y-2">
                  {challenge.rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <Icons.gift
                        className="w-4 h-4 text-primary-600"
                        aria-hidden="true"
                      />
                      <span className="text-gray-700">
                        {reward.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {challenge.rules.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Rules
                </h4>
                <ul className="space-y-1">
                  {challenge.rules.map((rule) => (
                    <li
                      key={rule.id}
                      className="flex items-start space-x-2 text-sm"
                    >
                      <Icons.check
                        className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-gray-700">{rule.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {userParticipation ? (
            <div className="flex items-center space-x-2 text-green-700">
              <Icons.checkCircle className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-medium">You're participating!</span>
            </div>
          ) : (
            <Button
              onClick={handleJoin}
              loading={isJoining}
              disabled={!isActive}
              className="join-button"
              aria-label={`Join ${challenge.title} challenge`}
            >
              {isJoining ? "Joining..." : "Join Challenge"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="details-button"
            aria-label={`View details for ${challenge.title}`}
          >
            View Details
          </Button>
        </div>
      </footer>
    </article>
  );
};

// ============================================================================
// MAIN CHALLENGE SYSTEM COMPONENT
// ============================================================================

const ChallengeSystem: React.FC<ChallengeSystemProps> = ({ className }) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToastNotifications();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userParticipations, setUserParticipations] = useState<
    ChallengeParticipation[]
  >([]);
  const [filters, setFilters] = useState<ChallengeFiltersType>({});
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

  // Fetch challenges
  const fetchChallenges = useCallback(async () => {
    if (!communityService || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [challengesData, participationsData] = await Promise.all([
        communityService.getChallenges(filters),
        communityService.getUserChallenges(user.id),
      ]);

      setChallenges(challengesData);
      setUserParticipations(participationsData);
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
      setError("Failed to load challenges. Please try again.");
      showError("Error", "Failed to load challenges. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [communityService, user, filters, showError]);

  // Handle joining a challenge
  const handleJoinChallenge = useCallback(
    async (challengeId: string) => {
      if (!communityService || !user) return;

      try {
        const result = await communityService.joinChallenge(
          challengeId,
          user.id
        );

        if (result.success) {
          showSuccess("Challenge Joined!", result.message);

          // Refresh challenges and participations
          await fetchChallenges();
        }
      } catch (error) {
        console.error("Failed to join challenge:", error);
        showError("Error", "Failed to join challenge. Please try again.");
      }
    },
    [communityService, user, showSuccess, showError, fetchChallenges]
  );

  // Handle viewing challenge details
  const handleViewDetails = useCallback((challengeId: string) => {
    // TODO: Navigate to challenge details page
    console.log("View challenge details:", challengeId);
  }, []);

  // Get user participation for a challenge
  const getUserParticipation = useCallback(
    (challengeId: string) => {
      return userParticipations.find((p) => p.challengeId === challengeId);
    },
    [userParticipations]
  );

  // Real-time subscription for challenge updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("challenges")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenges",
        },
        (payload) => {
          console.log("Challenge update received:", payload);
          // Refresh challenges when they're updated
          fetchChallenges();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_participants",
        },
        (payload) => {
          console.log("Challenge participation update received:", payload);
          // Refresh challenges to update participant counts
          fetchChallenges();
        }
      )
      .subscribe((status) => {
        console.log("Challenge subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchChallenges]);

  // Fetch challenges when filters change
  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  if (!user) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Icons.lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sign in to join challenges
        </h3>
        <p className="text-gray-600">
          Create an account to participate in community challenges and earn
          rewards.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Icons.alertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error loading challenges
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchChallenges}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className={cn("challenge-system", className)}>
      <ChallengeFilters onFilterChange={setFilters} currentFilters={filters} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
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
      ) : challenges.length === 0 ? (
        <div className="text-center py-12">
          <Icons.target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No challenges found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or check back later for new challenges.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
        >
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              userParticipation={getUserParticipation(challenge.id)}
              onJoin={handleJoinChallenge}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChallengeSystem;
