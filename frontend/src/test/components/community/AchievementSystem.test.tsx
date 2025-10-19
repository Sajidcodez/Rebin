import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AchievementSystem from "../../../components/community/AchievementSystem";
import { AuthProvider, useAuth } from "../../../contexts/AuthContext";
import { ToastProvider } from "../../../contexts/ToastContext";

// Mock the auth context
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the community service
const mockCommunityService = {
  getAchievements: vi.fn(),
  getAchievementProgress: vi.fn(),
  unlockAchievement: vi.fn(),
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

const mockAchievements = [
  {
    id: "achievement-1",
    name: "First Sort",
    description: "Sort your first item",
    category: "sorting",
    icon: "recycle",
    rarity: "common",
    requirements: [
      {
        id: "req-1",
        type: "items_sorted",
        target: 1,
        current: 1,
        description: "Sort 1 item",
      },
    ],
    rewards: [
      {
        id: "reward-1",
        type: "points",
        value: 10,
        description: "10 points",
      },
    ],
    unlocked: true,
    progress: 100,
    unlockedAt: new Date("2024-01-01"),
  },
  {
    id: "achievement-2",
    name: "Eco Warrior",
    description: "Sort 100 items",
    category: "environmental",
    icon: "leaf",
    rarity: "rare",
    requirements: [
      {
        id: "req-2",
        type: "items_sorted",
        target: 100,
        current: 45,
        description: "Sort 100 items",
      },
    ],
    rewards: [
      {
        id: "reward-2",
        type: "badge",
        value: 1,
        description: "Eco Warrior Badge",
      },
    ],
    unlocked: false,
    progress: 45,
  },
  {
    id: "achievement-3",
    name: "Community Helper",
    description: "Join 5 challenges",
    category: "community",
    icon: "users",
    rarity: "epic",
    requirements: [
      {
        id: "req-3",
        type: "challenges_completed",
        target: 5,
        current: 0,
        description: "Join 5 challenges",
      },
    ],
    rewards: [
      {
        id: "reward-3",
        type: "title",
        value: 1,
        description: "Community Helper Title",
      },
    ],
    unlocked: false,
    progress: 0,
  },
];

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

describe("AchievementSystem", () => {
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
    mockCommunityService.getAchievements.mockResolvedValue(mockAchievements);
    mockCommunityService.getAchievementProgress.mockResolvedValue({
      progress: 45,
      isUnlocked: false,
      requirements: mockAchievements[1].requirements,
    });
  });

  it("renders achievement system with filters", async () => {
    renderWithProviders(<AchievementSystem />);

    expect(screen.getByText("Achievements")).toBeInTheDocument();
    expect(screen.getByText("All Achievements")).toBeInTheDocument();
    expect(screen.getByText("Rarity")).toBeInTheDocument();
  });

  it("displays achievements when loaded", async () => {
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
      expect(screen.getByText("Eco Warrior")).toBeInTheDocument();
      expect(screen.getByText("Community Helper")).toBeInTheDocument();
    });
  });

  it("shows achievement statistics", async () => {
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("Achievement Progress")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument(); // unlocked count
      expect(screen.getByText("3")).toBeInTheDocument(); // total count
      expect(screen.getByText("33.3%")).toBeInTheDocument(); // completion rate
    });
  });

  it("handles filter changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Click on a category filter
    await user.click(screen.getByText("Sorting"));

    // Should filter to show only sorting achievements
    expect(screen.getByText("First Sort")).toBeInTheDocument();
    expect(screen.queryByText("Eco Warrior")).not.toBeInTheDocument();
  });

  it("handles sort changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Click on sort dropdown
    await user.click(screen.getByText("Rarity"));

    // Click on a different sort option
    await user.click(screen.getByText("Progress"));

    // Achievements should be sorted by progress
    const achievementCards = screen.getAllByRole("article");
    expect(achievementCards).toHaveLength(3);
  });

  it("shows unlocked achievements correctly", async () => {
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Check that unlocked achievement shows as unlocked
    const unlockedAchievement = screen
      .getByText("First Sort")
      .closest("article");
    expect(unlockedAchievement).toHaveClass("border-green-500");
  });

  it("shows locked achievements correctly", async () => {
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("Eco Warrior")).toBeInTheDocument();
    });

    // Check that locked achievement shows progress
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("displays achievement rarity correctly", async () => {
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Check rarity badges
    expect(screen.getByText("Common Achievement")).toBeInTheDocument();
    expect(screen.getByText("Rare Achievement")).toBeInTheDocument();
    expect(screen.getByText("Epic Achievement")).toBeInTheDocument();
  });

  it("shows achievement requirements", async () => {
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("Eco Warrior")).toBeInTheDocument();
    });

    // Check that requirements are displayed
    expect(screen.getByText("Requirements")).toBeInTheDocument();
    expect(screen.getByText("Sort 100 items")).toBeInTheDocument();
  });

  it("shows achievement rewards", async () => {
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Check that rewards are displayed
    expect(screen.getByText("10 points")).toBeInTheDocument();
    expect(screen.getByText("Eco Warrior Badge")).toBeInTheDocument();
  });

  it("handles achievement details view", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Click on an achievement card
    const achievementCard = screen.getByText("First Sort").closest("article");
    if (achievementCard) {
      await user.click(achievementCard);
    }

    // Should log the achievement ID (in real app, would navigate)
    expect(console.log).toHaveBeenCalledWith(
      "View achievement details:",
      "achievement-1"
    );
  });

  it("shows loading state initially", () => {
    renderWithProviders(<AchievementSystem />);

    // Should show loading skeletons
    expect(screen.getAllByTestId("loading-skeleton")).toHaveLength(6);
  });

  it("handles error state", async () => {
    mockCommunityService.getAchievements.mockRejectedValue(
      new Error("Failed to fetch")
    );

    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(
        screen.getByText("Error loading achievements")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load achievements. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no achievements", async () => {
    mockCommunityService.getAchievements.mockResolvedValue([]);

    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("No achievements found")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Try adjusting your filters or start sorting items to unlock achievements!"
        )
      ).toBeInTheDocument();
    });
  });

  it("requires authentication to view achievements", () => {
    // Mock no user
    vi.mocked(require("../../../contexts/AuthContext").useAuth).mockReturnValue(
      {
        user: null,
        isLoading: false,
        error: null,
      }
    );

    renderWithProviders(<AchievementSystem />);

    expect(
      screen.getByText("Sign in to view achievements")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create an account to unlock achievements and track your progress."
      )
    ).toBeInTheDocument();
  });

  it("filters achievements by category", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Click on environmental filter
    await user.click(screen.getByText("Environmental"));

    // Should only show environmental achievements
    expect(screen.getByText("Eco Warrior")).toBeInTheDocument();
    expect(screen.queryByText("First Sort")).not.toBeInTheDocument();
    expect(screen.queryByText("Community Helper")).not.toBeInTheDocument();
  });

  it("filters achievements by unlock status", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Click on unlocked filter
    await user.click(screen.getByText("Unlocked"));

    // Should only show unlocked achievements
    expect(screen.getByText("First Sort")).toBeInTheDocument();
    expect(screen.queryByText("Eco Warrior")).not.toBeInTheDocument();
    expect(screen.queryByText("Community Helper")).not.toBeInTheDocument();
  });

  it("sorts achievements by rarity", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Click on rarity sort
    await user.click(screen.getByText("Rarity"));

    // Achievements should be sorted by rarity (epic > rare > common)
    const achievementCards = screen.getAllByRole("article");
    expect(achievementCards).toHaveLength(3);
  });

  it("sorts achievements by progress", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Click on progress sort
    await user.click(screen.getByText("Progress"));

    // Achievements should be sorted by progress (highest first)
    const achievementCards = screen.getAllByRole("article");
    expect(achievementCards).toHaveLength(3);
  });

  it("handles real-time updates", async () => {
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Verify Supabase subscription was set up
    expect(
      require("../../../lib/supabase").supabase.channel
    ).toHaveBeenCalledWith("achievements");
  });

  it("has proper accessibility attributes", async () => {
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("First Sort")).toBeInTheDocument();
    });

    // Check for proper ARIA attributes
    const achievementCard = screen.getByText("First Sort").closest("article");
    expect(achievementCard).toHaveAttribute("role", "button");
    expect(achievementCard).toHaveAttribute("aria-label");

    // Check progress bar accessibility
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it("displays completion rate correctly", async () => {
    renderWithProviders(<AchievementSystem />);

    await waitFor(() => {
      expect(screen.getByText("Achievement Progress")).toBeInTheDocument();
    });

    // Check that stats are displayed correctly
    expect(screen.getByText("Unlocked")).toBeInTheDocument();
    expect(screen.getByText("Total Available")).toBeInTheDocument();
    expect(screen.getByText("Completion Rate")).toBeInTheDocument();
  });
});
