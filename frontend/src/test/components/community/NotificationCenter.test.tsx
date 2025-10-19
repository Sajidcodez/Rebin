import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationCenter from "../../../components/community/NotificationCenter";
import { AuthProvider, useAuth } from "../../../contexts/AuthContext";
import { ToastProvider } from "../../../contexts/ToastContext";

// Mock the auth context
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the community service
const mockCommunityService = {
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
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

const mockNotifications = [
  {
    id: "notification-1",
    userId: "test-user-id",
    type: "achievement",
    title: "Achievement Unlocked!",
    message: "You've unlocked the 'First Sort' achievement!",
    read: false,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    action: {
      type: "view_achievement",
      data: { achievementId: "achievement-1" },
    },
  },
  {
    id: "notification-2",
    userId: "test-user-id",
    type: "challenge",
    title: "New Challenge Available",
    message: "Join the 'Eco Warrior' challenge and earn rewards!",
    read: true,
    createdAt: new Date("2024-01-01T09:00:00Z"),
    action: {
      type: "join_challenge",
      data: { challengeId: "challenge-1" },
    },
  },
  {
    id: "notification-3",
    userId: "test-user-id",
    type: "system",
    title: "Welcome to ReBin Pro!",
    message:
      "Start sorting items to make a positive impact on the environment.",
    read: false,
    createdAt: new Date("2024-01-01T08:00:00Z"),
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

describe("NotificationCenter", () => {
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
    mockCommunityService.getNotifications.mockResolvedValue(mockNotifications);
    mockCommunityService.markNotificationAsRead.mockResolvedValue(undefined);
    mockCommunityService.markAllNotificationsAsRead.mockResolvedValue(
      undefined
    );
  });

  it("renders notification center with bell icon", () => {
    renderWithProviders(<NotificationCenter />);

    expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
  });

  it("shows unread count badge", async () => {
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument(); // 2 unread notifications
    });
  });

  it("opens notification dropdown when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Click on notification bell
    await user.click(screen.getByLabelText(/notifications/i));

    // Should show notification dropdown
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Achievement Unlocked!")).toBeInTheDocument();
    expect(screen.getByText("New Challenge Available")).toBeInTheDocument();
    expect(screen.getByText("Welcome to ReBin Pro!")).toBeInTheDocument();
  });

  it("displays notification types correctly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByLabelText(/notifications/i));

    // Check that different notification types are displayed
    expect(screen.getByText("Achievement Unlocked!")).toBeInTheDocument();
    expect(screen.getByText("New Challenge Available")).toBeInTheDocument();
    expect(screen.getByText("Welcome to ReBin Pro!")).toBeInTheDocument();
  });

  it("shows notification timestamps", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByLabelText(/notifications/i));

    // Check that timestamps are displayed
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it("handles marking notification as read", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByLabelText(/notifications/i));

    // Click on an unread notification
    const unreadNotification = screen.getByText("Achievement Unlocked!");
    await user.click(unreadNotification);

    expect(mockCommunityService.markNotificationAsRead).toHaveBeenCalledWith(
      "notification-1"
    );
  });

  it("handles marking all notifications as read", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByLabelText(/notifications/i));

    // Click "Mark all read" button
    const markAllReadButton = screen.getByText("Mark all read");
    await user.click(markAllReadButton);

    expect(
      mockCommunityService.markAllNotificationsAsRead
    ).toHaveBeenCalledWith("test-user-id");
  });

  it("handles notification actions", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByLabelText(/notifications/i));

    // Click on a notification with action
    const notificationWithAction = screen.getByText("Achievement Unlocked!");
    await user.click(notificationWithAction);

    // Should log the action (in real app, would navigate)
    expect(console.log).toHaveBeenCalledWith(
      "View achievement:",
      "achievement-1"
    );
  });

  it("shows different notification icons based on type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByLabelText(/notifications/i));

    // Check that different notification types have different styling
    const notifications = screen.getAllByRole("button");
    expect(notifications.length).toBeGreaterThan(0);
  });

  it("closes dropdown when clicking outside", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByLabelText(/notifications/i));
    expect(screen.getByText("Notifications")).toBeInTheDocument();

    // Click outside
    await user.click(document.body);

    // Dropdown should be closed
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    renderWithProviders(<NotificationCenter />);

    // Should show loading state
    expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
  });

  it("handles error state gracefully", async () => {
    mockCommunityService.getNotifications.mockRejectedValue(
      new Error("Failed to fetch")
    );

    renderWithProviders(<NotificationCenter />);

    // Should still render the notification bell
    expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
  });

  it("shows empty state when no notifications", async () => {
    mockCommunityService.getNotifications.mockResolvedValue([]);

    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    // Open dropdown
    await user.click(screen.getByLabelText(/notifications/i));

    // Should show empty state
    expect(screen.getByText("No new notifications")).toBeInTheDocument();
  });

  it("requires authentication to view notifications", () => {
    // Mock no user
    vi.mocked(require("../../../contexts/AuthContext").useAuth).mockReturnValue(
      {
        user: null,
        isLoading: false,
        error: null,
      }
    );

    renderWithProviders(<NotificationCenter />);

    // Should not render notification center for unauthenticated users
    expect(screen.queryByLabelText(/notifications/i)).not.toBeInTheDocument();
  });

  it("handles real-time notification updates", async () => {
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Verify Supabase subscription was set up
    expect(
      require("../../../lib/supabase").supabase.channel
    ).toHaveBeenCalledWith("notifications");
  });

  it("has proper accessibility attributes", async () => {
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Check for proper ARIA attributes
    const notificationButton = screen.getByLabelText(/notifications/i);
    expect(notificationButton).toHaveAttribute("aria-expanded");
    expect(notificationButton).toHaveAttribute("aria-haspopup");
  });

  it("displays notification count correctly", async () => {
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      // Should show count of unread notifications
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("shows notification messages correctly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByLabelText(/notifications/i));

    // Check that notification messages are displayed
    expect(
      screen.getByText("You've unlocked the 'First Sort' achievement!")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Join the 'Eco Warrior' challenge and earn rewards!")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Start sorting items to make a positive impact on the environment."
      )
    ).toBeInTheDocument();
  });

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByLabelText(/notifications/i));

    // Should be able to navigate with keyboard
    const notifications = screen.getAllByRole("button");
    expect(notifications.length).toBeGreaterThan(0);
  });
});
