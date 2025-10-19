import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChallengeSystem from "../../../components/community/ChallengeSystem";
import { AuthProvider, useAuth } from "../../../contexts/AuthContext";
import { ToastProvider } from "../../../contexts/ToastContext";

// Mock the auth context
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the community service
const mockCommunityService = {
  getChallenges: vi.fn(),
  getUserChallenges: vi.fn(),
  joinChallenge: vi.fn(),
  leaveChallenge: vi.fn(),
  getChallengeById: vi.fn(),
  getUserParticipation: vi.fn(),
  updateChallengeProgress: vi.fn(),
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

const mockChallenges = [
  {
    id: "challenge-1",
    title: "Recycling Challenge",
    description: "Sort 100 items this week",
    category: "recycling",
    targetItems: 100,
    targetCO2: 50,
    duration: 7,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-08"),
    isActive: true,
    participantCount: 25,
    progress: 75,
    rewards: [
      {
        id: "reward-1",
        type: "points",
        value: 100,
        description: "100 points",
      },
    ],
    rules: [
      {
        id: "rule-1",
        description: "Sort items correctly",
        required: true,
      },
    ],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

const mockParticipations = [
  {
    id: "participation-1",
    challengeId: "challenge-1",
    userId: "test-user-id",
    joinedAt: new Date("2024-01-01"),
    progress: 75,
    itemsSorted: 75,
    co2Saved: 37.5,
    isCompleted: false,
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

describe("ChallengeSystem", () => {
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
    mockCommunityService.getChallenges.mockResolvedValue(mockChallenges);
    mockCommunityService.getUserChallenges.mockResolvedValue(
      mockParticipations
    );
    mockCommunityService.joinChallenge.mockResolvedValue({
      success: true,
      participation: mockParticipations[0],
      message: "Successfully joined challenge!",
    });
  });

  it("renders challenge system with filters", async () => {
    renderWithProviders(<ChallengeSystem />);

    expect(screen.getByText("Community Challenges")).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeInTheDocument();
  });

  it("displays challenges when loaded", async () => {
    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("Recycling Challenge")).toBeInTheDocument();
      expect(screen.getByText("Sort 100 items this week")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", () => {
    renderWithProviders(<ChallengeSystem />);

    // Should show loading skeletons
    expect(screen.getAllByTestId("loading-skeleton")).toHaveLength(6);
  });

  it("handles filter changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChallengeSystem />);

    // Wait for challenges to load
    await waitFor(() => {
      expect(screen.getByText("Recycling Challenge")).toBeInTheDocument();
    });

    // Click filters button
    await user.click(screen.getByText("Filters"));

    // Click on a category filter
    await user.click(screen.getByText("Recycling"));

    expect(mockCommunityService.getChallenges).toHaveBeenCalledWith({
      category: "recycling",
    });
  });

  it("handles joining a challenge", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("Recycling Challenge")).toBeInTheDocument();
    });

    // Click join button
    const joinButton = screen.getByText("Join Challenge");
    await user.click(joinButton);

    expect(mockCommunityService.joinChallenge).toHaveBeenCalledWith(
      "challenge-1",
      "test-user-id"
    );
  });

  it("shows participation status for joined challenges", async () => {
    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("You're participating!")).toBeInTheDocument();
    });
  });

  it("handles challenge details view", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("Recycling Challenge")).toBeInTheDocument();
    });

    // Click view details button
    const detailsButton = screen.getByText("View Details");
    await user.click(detailsButton);

    // Should log the challenge ID (in real app, would navigate)
    expect(console.log).toHaveBeenCalledWith(
      "View challenge details:",
      "challenge-1"
    );
  });

  it("expands challenge details when show more is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("Recycling Challenge")).toBeInTheDocument();
    });

    // Click show more button
    const showMoreButton = screen.getByText("Show More");
    await user.click(showMoreButton);

    // Should show additional details
    expect(screen.getByText("Target Items")).toBeInTheDocument();
    expect(screen.getByText("Target CO₂")).toBeInTheDocument();
    expect(screen.getByText("Rewards")).toBeInTheDocument();
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });

  it("displays challenge progress correctly", async () => {
    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("Recycling Challenge")).toBeInTheDocument();
    });

    // Check progress bar
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "75");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("shows challenge status correctly", async () => {
    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  it("displays challenge metadata", async () => {
    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("25")).toBeInTheDocument(); // participant count
      expect(screen.getByText("7 days")).toBeInTheDocument(); // duration
      expect(screen.getByText("100 items")).toBeInTheDocument(); // target items
    });
  });

  it("handles error state", async () => {
    mockCommunityService.getChallenges.mockRejectedValue(
      new Error("Failed to fetch")
    );

    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("Error loading challenges")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load challenges. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no challenges", async () => {
    mockCommunityService.getChallenges.mockResolvedValue([]);

    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("No challenges found")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Try adjusting your filters or check back later for new challenges."
        )
      ).toBeInTheDocument();
    });
  });

  it("requires authentication to view challenges", () => {
    // Mock no user
    vi.mocked(require("../../../contexts/AuthContext").useAuth).mockReturnValue(
      {
        user: null,
        isLoading: false,
        error: null,
      }
    );

    renderWithProviders(<ChallengeSystem />);

    expect(screen.getByText("Sign in to join challenges")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create an account to participate in community challenges and earn rewards."
      )
    ).toBeInTheDocument();
  });

  it("handles real-time updates", async () => {
    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("Recycling Challenge")).toBeInTheDocument();
    });

    // Verify Supabase subscription was set up
    expect(
      require("../../../lib/supabase").supabase.channel
    ).toHaveBeenCalledWith("challenges");
  });

  it("has proper accessibility attributes", async () => {
    renderWithProviders(<ChallengeSystem />);

    await waitFor(() => {
      expect(screen.getByText("Recycling Challenge")).toBeInTheDocument();
    });

    // Check for proper ARIA attributes
    const challengeCard = screen.getByRole("article");
    expect(challengeCard).toHaveAttribute("aria-labelledby");
    expect(challengeCard).toHaveAttribute("aria-describedby");

    // Check progress bar accessibility
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow");
    expect(progressBar).toHaveAttribute("aria-valuemin");
    expect(progressBar).toHaveAttribute("aria-valuemax");
  });
});
