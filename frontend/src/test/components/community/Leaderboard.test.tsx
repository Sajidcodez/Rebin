import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Leaderboard from "../../../components/community/Leaderboard";
import { AuthProvider, useAuth } from "../../../contexts/AuthContext";
import { ToastProvider } from "../../../contexts/ToastContext";

// Mock the auth context
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the community service
const mockCommunityService = {
  getLeaderboard: vi.fn(),
  getLeaderboardStats: vi.fn(),
  getUserRank: vi.fn(),
};

// Mock the repository
vi.mock("../../../lib/repositories/CommunityRepository", () => ({
  SupabaseCommunityRepository: vi
    .fn()
    .mockImplementation(() => mockCommunityService),
}));

// Mock the service
vi.mock("../../../lib/services/CommunityService", () => ({
  CommunityService: vi.fn().mockImplementation(() => mockCommunityService),
}));

// Mock Supabase
vi.mock("../../../lib/supabase", () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    }),
    removeChannel: vi.fn(),
  },
}));

// Mock react-window
vi.mock("react-window", () => ({
  FixedSizeList: ({ children, itemCount }: any) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) =>
        children({ index, style: {} })
      )}
    </div>
  ),
}));

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  user_metadata: {
    first_name: "Test",
    last_name: "User",
  },
};

const mockSession = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_at: Date.now() + 3600000,
  user: mockUser,
};

const mockLeaderboardEntries = [
  {
    userId: "user-1",
    username: "EcoWarrior",
    avatar: "https://example.com/avatar1.jpg",
    location: "San Francisco, CA",
    score: 1500,
    itemsSorted: 300,
    co2Saved: 75.5,
    achievements: 12,
    rank: 1,
    trend: "up" as const,
    change: 5,
    timeframe: "week" as const,
  },
  {
    userId: "test-user-id",
    username: "TestUser",
    avatar: "https://example.com/avatar2.jpg",
    location: "New York, NY",
    score: 1200,
    itemsSorted: 240,
    co2Saved: 60.2,
    achievements: 8,
    rank: 2,
    trend: "stable" as const,
    change: 0,
    timeframe: "week" as const,
  },
  {
    userId: "user-3",
    username: "GreenGuru",
    avatar: "https://example.com/avatar3.jpg",
    location: "Seattle, WA",
    score: 900,
    itemsSorted: 180,
    co2Saved: 45.0,
    achievements: 6,
    rank: 3,
    trend: "down" as const,
    change: 2,
    timeframe: "week" as const,
  },
];

const mockStats = {
  totalParticipants: 150,
  averageScore: 750,
  topScore: 1500,
  userRank: 2,
  userScore: 1200,
  userTrend: "stable" as const,
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>{component}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe("Leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth context
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      session: mockSession,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      loading: false,
    });

    // Mock community service methods
    mockCommunityService.getLeaderboard.mockResolvedValue(
      mockLeaderboardEntries
    );
    mockCommunityService.getLeaderboardStats.mockResolvedValue(mockStats);
  });

  it("renders leaderboard with filters", async () => {
    renderWithProviders(<Leaderboard />);

    expect(screen.getByText("Community Leaderboard")).toBeInTheDocument();
    expect(screen.getByText("Timeframe")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("displays leaderboard entries when loaded", async () => {
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("EcoWarrior")).toBeInTheDocument();
      expect(screen.getByText("TestUser")).toBeInTheDocument();
      expect(screen.getByText("GreenGuru")).toBeInTheDocument();
    });
  });

  it("shows leaderboard statistics", async () => {
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("150")).toBeInTheDocument(); // total participants
      expect(screen.getByText("750")).toBeInTheDocument(); // average score
      expect(screen.getByText("1,500")).toBeInTheDocument(); // top score
      expect(screen.getByText("#2")).toBeInTheDocument(); // user rank
    });
  });

  it("handles timeframe filter changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("EcoWarrior")).toBeInTheDocument();
    });

    // Click on a different timeframe
    await user.click(screen.getByText("This Month"));

    expect(mockCommunityService.getLeaderboard).toHaveBeenCalledWith({
      timeframe: "month",
      category: "overall",
      limit: 100,
    });
  });

  it("handles category filter changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("EcoWarrior")).toBeInTheDocument();
    });

    // Click on a different category
    await user.click(screen.getByText("Recycling"));

    expect(mockCommunityService.getLeaderboard).toHaveBeenCalledWith({
      timeframe: "week",
      category: "recycling",
      limit: 100,
    });
  });

  it("displays user rank correctly", async () => {
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("Your Rank: #2")).toBeInTheDocument();
    });
  });

  it("shows trend indicators", async () => {
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      // Should show trend icons for entries
      const trendIcons = screen.getAllByTestId("trend-icon");
      expect(trendIcons).toHaveLength(3);
    });
  });

  it("handles user click on leaderboard entry", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("EcoWarrior")).toBeInTheDocument();
    });

    // Click on a leaderboard entry
    const entry = screen.getByText("EcoWarrior").closest('[role="button"]');
    if (entry) {
      await user.click(entry);
    }

    // Should log the user ID (in real app, would navigate to profile)
    expect(console.log).toHaveBeenCalledWith("View user profile:", "user-1");
  });

  it("shows loading state initially", () => {
    renderWithProviders(<Leaderboard />);

    // Should show loading skeletons
    expect(screen.getAllByTestId("loading-skeleton")).toHaveLength(10);
  });

  it("handles error state", async () => {
    mockCommunityService.getLeaderboard.mockRejectedValue(
      new Error("Failed to fetch")
    );

    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("Error loading leaderboard")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load leaderboard. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no entries", async () => {
    mockCommunityService.getLeaderboard.mockResolvedValue([]);

    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("No leaderboard data")).toBeInTheDocument();
      expect(
        screen.getByText("Start sorting items to appear on the leaderboard!")
      ).toBeInTheDocument();
    });
  });

  it("requires authentication to view leaderboard", () => {
    // Mock no user
    vi.mocked(require("../../../contexts/AuthContext").useAuth).mockReturnValue(
      {
        user: null,
        isLoading: false,
        error: null,
      }
    );

    renderWithProviders(<Leaderboard />);

    expect(screen.getByText("Sign in to view leaderboard")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create an account to see how you rank against other users."
      )
    ).toBeInTheDocument();
  });

  it("displays entry statistics correctly", async () => {
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("1,500")).toBeInTheDocument(); // score
      expect(screen.getByText("300")).toBeInTheDocument(); // items sorted
      expect(screen.getByText("75.5kg")).toBeInTheDocument(); // CO2 saved
      expect(screen.getByText("12")).toBeInTheDocument(); // achievements
    });
  });

  it("shows current user highlighting", async () => {
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      const currentUserEntry = screen
        .getByText("TestUser")
        .closest(".leaderboard-entry");
      expect(currentUserEntry).toHaveClass("current-user");
    });
  });

  it("displays rank icons for top positions", async () => {
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      // Should show trophy icons for top 3 positions
      const trophyIcons = screen.getAllByTestId("trophy-icon");
      expect(trophyIcons).toHaveLength(3);
    });
  });

  it("handles real-time updates", async () => {
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("EcoWarrior")).toBeInTheDocument();
    });

    // Verify Supabase subscription was set up
    expect(
      require("../../../lib/supabase").supabase.channel
    ).toHaveBeenCalledWith("leaderboard");
  });

  it("has proper accessibility attributes", async () => {
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("EcoWarrior")).toBeInTheDocument();
    });

    // Check for proper ARIA attributes
    const leaderboard = screen.getByRole("main");
    expect(leaderboard).toHaveAttribute("aria-label", "Community leaderboard");

    // Check entry accessibility
    const entry = screen.getByText("EcoWarrior").closest('[role="button"]');
    expect(entry).toHaveAttribute("aria-label");
  });

  it("displays completion rate correctly", async () => {
    renderWithProviders(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText("Leaderboard Statistics")).toBeInTheDocument();
    });

    // Check that stats are displayed
    expect(screen.getByText("Total Participants")).toBeInTheDocument();
    expect(screen.getByText("Average Score")).toBeInTheDocument();
    expect(screen.getByText("Top Score")).toBeInTheDocument();
  });
});
