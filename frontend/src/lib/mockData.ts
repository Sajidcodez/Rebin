/**
 * Mock data service for demo purposes
 * Provides realistic data for leaderboard, achievements, and challenges
 */

export interface MockUser {
  id: string;
  name: string;
  avatar?: string;
  totalItemsSorted: number;
  totalCo2Saved: number;
  totalPoints: number;
  rank: number;
}

export interface MockAchievement {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
  points: number;
}

export interface MockChallenge {
  id: number;
  title: string;
  description: string;
  challengeType: string;
  targetItems?: number;
  targetCo2?: number;
  targetParticipants?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFeatured: boolean;
  difficultyLevel: "easy" | "medium" | "hard";
  rewardPoints: number;
  participants: number;
  progress?: number;
  joined?: boolean;
  completed?: boolean;
}

export interface MockLeaderboardEntry {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  total_items_sorted: number;
  total_co2_saved: number;
  total_points: number;
  rank_position: number;
}

// Mock users for leaderboard
const mockUsers: MockUser[] = [
  {
    id: "user-1",
    name: "Eco Emma",
    avatar: "/avatars/eco-emma.png",
    totalItemsSorted: 1247,
    totalCo2Saved: 89.3,
    totalPoints: 12470,
    rank: 1,
  },
  {
    id: "user-2",
    name: "Green Gary",
    avatar: "/avatars/green-gary.png",
    totalItemsSorted: 1156,
    totalCo2Saved: 82.1,
    totalPoints: 11560,
    rank: 2,
  },
  {
    id: "user-3",
    name: "Professor Pete",
    avatar: "/avatars/professor-pete.png",
    totalItemsSorted: 1089,
    totalCo2Saved: 76.8,
    totalPoints: 10890,
    rank: 3,
  },
  {
    id: "user-4",
    name: "Recycle Rachel",
    totalItemsSorted: 987,
    totalCo2Saved: 69.2,
    totalPoints: 9870,
    rank: 4,
  },
  {
    id: "user-5",
    name: "Compost Chris",
    totalItemsSorted: 876,
    totalCo2Saved: 61.4,
    totalPoints: 8760,
    rank: 5,
  },
  {
    id: "user-6",
    name: "Sustainable Sam",
    totalItemsSorted: 765,
    totalCo2Saved: 53.6,
    totalPoints: 7650,
    rank: 6,
  },
  {
    id: "user-7",
    name: "Waste Warrior",
    totalItemsSorted: 654,
    totalCo2Saved: 45.8,
    totalPoints: 6540,
    rank: 7,
  },
  {
    id: "user-8",
    name: "Eco Explorer",
    totalItemsSorted: 543,
    totalCo2Saved: 38.0,
    totalPoints: 5430,
    rank: 8,
  },
  {
    id: "user-9",
    name: "Green Guardian",
    totalItemsSorted: 432,
    totalCo2Saved: 30.2,
    totalPoints: 4320,
    rank: 9,
  },
  {
    id: "user-10",
    name: "Planet Protector",
    totalItemsSorted: 321,
    totalCo2Saved: 22.4,
    totalPoints: 3210,
    rank: 10,
  },
];

// Mock achievements
const mockAchievements: MockAchievement[] = [
  {
    id: "ach-1",
    name: "First Steps",
    description: "Sort your first 10 items",
    category: "milestone",
    rarity: "common",
    progress: 10,
    maxProgress: 10,
    unlocked: true,
    unlockedAt: "2024-01-15T10:30:00Z",
    icon: "🎯",
    points: 100,
  },
  {
    id: "ach-2",
    name: "Recycling Rookie",
    description: "Recycle 50 items",
    category: "recycling",
    rarity: "common",
    progress: 50,
    maxProgress: 50,
    unlocked: true,
    unlockedAt: "2024-01-20T14:15:00Z",
    icon: "♻️",
    points: 250,
  },
  {
    id: "ach-3",
    name: "Compost Champion",
    description: "Compost 25 organic items",
    category: "compost",
    rarity: "rare",
    progress: 25,
    maxProgress: 25,
    unlocked: true,
    unlockedAt: "2024-01-25T09:45:00Z",
    icon: "🌱",
    points: 500,
  },
  {
    id: "ach-4",
    name: "Century Club",
    description: "Sort 100 items",
    category: "milestone",
    rarity: "rare",
    progress: 100,
    maxProgress: 100,
    unlocked: true,
    unlockedAt: "2024-02-01T16:20:00Z",
    icon: "💯",
    points: 750,
  },
  {
    id: "ach-5",
    name: "CO2 Crusher",
    description: "Save 10kg of CO2 emissions",
    category: "environmental",
    rarity: "epic",
    progress: 10,
    maxProgress: 10,
    unlocked: true,
    unlockedAt: "2024-02-05T11:30:00Z",
    icon: "🌍",
    points: 1000,
  },
  {
    id: "ach-6",
    name: "Streak Master",
    description: "Sort items for 7 consecutive days",
    category: "consistency",
    rarity: "epic",
    progress: 7,
    maxProgress: 7,
    unlocked: true,
    unlockedAt: "2024-02-10T08:00:00Z",
    icon: "🔥",
    points: 1200,
  },
  {
    id: "ach-7",
    name: "Waste Wizard",
    description: "Sort 500 items",
    category: "milestone",
    rarity: "legendary",
    progress: 500,
    maxProgress: 500,
    unlocked: true,
    unlockedAt: "2024-02-15T13:45:00Z",
    icon: "🧙‍♂️",
    points: 2000,
  },
  {
    id: "ach-8",
    name: "Plastic Buster",
    description: "Recycle 200 plastic items",
    category: "recycling",
    rarity: "rare",
    progress: 180,
    maxProgress: 200,
    unlocked: false,
    icon: "🥤",
    points: 800,
  },
  {
    id: "ach-9",
    name: "Paper Pioneer",
    description: "Recycle 150 paper items",
    category: "recycling",
    rarity: "rare",
    progress: 120,
    maxProgress: 150,
    unlocked: false,
    icon: "📄",
    points: 600,
  },
  {
    id: "ach-10",
    name: "Metal Master",
    description: "Recycle 100 metal items",
    category: "recycling",
    rarity: "epic",
    progress: 75,
    maxProgress: 100,
    unlocked: false,
    icon: "🔧",
    points: 1000,
  },
  {
    id: "ach-11",
    name: "Glass Guardian",
    description: "Recycle 50 glass items",
    category: "recycling",
    rarity: "rare",
    progress: 30,
    maxProgress: 50,
    unlocked: false,
    icon: "🍾",
    points: 500,
  },
  {
    id: "ach-12",
    name: "Eco Legend",
    description: "Sort 1000 items",
    category: "milestone",
    rarity: "legendary",
    progress: 750,
    maxProgress: 1000,
    unlocked: false,
    icon: "👑",
    points: 5000,
  },
];

// Mock challenges
const mockChallenges: MockChallenge[] = [
  {
    id: 1,
    title: "Spring Cleaning Challenge",
    description:
      "Join the community in a month-long spring cleaning challenge. Sort as many items as possible and help reduce waste!",
    challengeType: "recycling",
    targetItems: 1000,
    startDate: "2024-03-01T00:00:00Z",
    endDate: "2024-03-31T23:59:59Z",
    isActive: true,
    isFeatured: true,
    difficultyLevel: "medium",
    rewardPoints: 500,
    participants: 1247,
    progress: 65,
    joined: true,
    completed: false,
  },
  {
    id: 2,
    title: "Plastic-Free Week",
    description:
      "Focus on reducing plastic waste for one week. Every plastic item properly sorted counts!",
    challengeType: "reduction",
    targetItems: 50,
    startDate: "2024-03-15T00:00:00Z",
    endDate: "2024-03-22T23:59:59Z",
    isActive: true,
    isFeatured: false,
    difficultyLevel: "easy",
    rewardPoints: 200,
    participants: 892,
    progress: 0,
    joined: false,
    completed: false,
  },
  {
    id: 3,
    title: "Compost Champions",
    description:
      "Learn about composting and sort organic waste properly. Help create nutrient-rich soil!",
    challengeType: "compost",
    targetCo2: 25,
    startDate: "2024-03-10T00:00:00Z",
    endDate: "2024-03-24T23:59:59Z",
    isActive: true,
    isFeatured: true,
    difficultyLevel: "medium",
    rewardPoints: 300,
    participants: 567,
    progress: 40,
    joined: true,
    completed: false,
  },
  {
    id: 4,
    title: "Zero Waste Hero",
    description:
      "Achieve zero waste for a full day. Sort everything correctly and minimize trash!",
    challengeType: "education",
    targetItems: 20,
    startDate: "2024-03-20T00:00:00Z",
    endDate: "2024-03-20T23:59:59Z",
    isActive: true,
    isFeatured: false,
    difficultyLevel: "hard",
    rewardPoints: 150,
    participants: 234,
    progress: 0,
    joined: false,
    completed: false,
  },
  {
    id: 5,
    title: "Community Cleanup",
    description:
      "Join forces with your neighbors to clean up the community. Every sorted item makes a difference!",
    challengeType: "recycling",
    targetParticipants: 100,
    startDate: "2024-03-25T00:00:00Z",
    endDate: "2024-03-31T23:59:59Z",
    isActive: true,
    isFeatured: true,
    difficultyLevel: "easy",
    rewardPoints: 100,
    participants: 78,
    progress: 0,
    joined: false,
    completed: false,
  },
];

// Mock data service functions
export const MockDataService = {
  // Leaderboard data
  getLeaderboard: async (
    limit: number = 10,
    timePeriod: string = "7d"
  ): Promise<MockLeaderboardEntry[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const leaderboard = mockUsers.slice(0, limit).map((user) => ({
      user_id: user.id,
      user_name: user.name,
      avatar_url: user.avatar,
      total_items_sorted: user.totalItemsSorted,
      total_co2_saved: user.totalCo2Saved,
      total_points: user.totalPoints,
      rank_position: user.rank,
    }));

    return leaderboard;
  },

  // Achievements data
  getAchievements: async (userId: string): Promise<MockAchievement[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Return all achievements (in real app, this would be filtered by user)
    return mockAchievements;
  },

  // Challenges data
  getChallenges: async (
    featuredOnly: boolean = false
  ): Promise<MockChallenge[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (featuredOnly) {
      return mockChallenges.filter((challenge) => challenge.isFeatured);
    }

    return mockChallenges;
  },

  getUserChallenges: async (userId: string): Promise<MockChallenge[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Return challenges the user has joined
    return mockChallenges.filter((challenge) => challenge.joined);
  },

  // Join challenge
  joinChallenge: async (
    userId: string,
    challengeId: number
  ): Promise<boolean> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const challenge = mockChallenges.find((c) => c.id === challengeId);
    if (challenge && !challenge.joined) {
      challenge.joined = true;
      challenge.participants += 1;
      return true;
    }

    return false;
  },

  // Get user stats
  getUserStats: async (userId: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Return mock stats for the current user
    return {
      totalItemsSorted: 750,
      totalCo2Saved: 52.5,
      totalPoints: 7500,
      rankPosition: 4,
      streakDays: 12,
      achievementCount: 7,
    };
  },
};

// Export individual data arrays for direct access
export { mockUsers, mockAchievements, mockChallenges };

