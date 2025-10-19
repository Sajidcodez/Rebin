import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "../../../components/auth/LoginForm";
import { AuthProvider } from "../../../contexts/AuthContext";
import { ToastProvider } from "../../../contexts/ToastContext";

// Mock the auth context
const mockLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the toast context
vi.mock("../../../contexts/ToastContext", () => ({
  useToastNotifications: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

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

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with all required fields", () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it("validates password requirements", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "weak");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("calls login function with valid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "ValidPass123!");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "ValidPass123!",
      });
    });
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByLabelText(/show password/i);

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();
  });

  it("shows loading state when submitting", async () => {
    const user = userEvent.setup();

    // Mock loading state
    vi.mocked(require("../../../contexts/AuthContext").useAuth).mockReturnValue(
      {
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      }
    );

    renderWithProviders(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /signing in/i });
    expect(submitButton).toBeDisabled();
  });

  it("displays error message when login fails", async () => {
    const errorMessage = "Invalid credentials";

    vi.mocked(require("../../../contexts/AuthContext").useAuth).mockReturnValue(
      {
        login: mockLogin,
        isLoading: false,
        error: errorMessage,
        clearError: mockClearError,
      }
    );

    renderWithProviders(<LoginForm />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("clears error when user starts typing", async () => {
    const user = userEvent.setup();

    vi.mocked(require("../../../contexts/AuthContext").useAuth).mockReturnValue(
      {
        login: mockLogin,
        isLoading: false,
        error: "Some error",
        clearError: mockClearError,
      }
    );

    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, "t");

    expect(mockClearError).toHaveBeenCalled();
  });

  it("handles social login buttons", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const googleButton = screen.getByRole("button", { name: /google/i });
    const githubButton = screen.getByRole("button", { name: /github/i });

    await user.click(googleButton);
    await user.click(githubButton);

    // Social login is mocked to show "Coming Soon" message
    await waitFor(() => {
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    });
  });

  it("has proper accessibility attributes", () => {
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("required");
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("required");
    expect(submitButton).toHaveAttribute("type", "submit");
  });

  it("shows forgot password link", () => {
    renderWithProviders(<LoginForm />);

    const forgotPasswordLink = screen.getByText(/forgot your password/i);
    expect(forgotPasswordLink).toBeInTheDocument();
  });

  it("shows sign up link", () => {
    renderWithProviders(<LoginForm />);

    const signUpLink = screen.getByText(/don't have an account/i);
    expect(signUpLink).toBeInTheDocument();
  });
});
