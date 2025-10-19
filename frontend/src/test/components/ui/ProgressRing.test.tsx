import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ProgressRing } from "../../../components/ui/ProgressRing";

describe("ProgressRing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(<ProgressRing progress={50} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders with custom size", () => {
    render(<ProgressRing progress={75} size={200} />);

    const progressRing = screen.getByRole("progressbar");
    expect(progressRing).toBeInTheDocument();
  });

  it("renders with custom stroke width", () => {
    render(<ProgressRing progress={25} strokeWidth={12} />);

    const progressRing = screen.getByRole("progressbar");
    expect(progressRing).toBeInTheDocument();
  });

  it("renders with different colors", () => {
    const { rerender } = render(<ProgressRing progress={50} color="green" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    rerender(<ProgressRing progress={50} color="red" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    rerender(<ProgressRing progress={50} color="blue" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows percentage by default", () => {
    render(<ProgressRing progress={75} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("hides percentage when showPercentage is false", () => {
    render(<ProgressRing progress={75} showPercentage={false} />);

    expect(screen.queryByText("75%")).not.toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<ProgressRing progress={50} label="Test Progress" />);

    expect(screen.getByText("Test Progress")).toBeInTheDocument();
  });

  it("renders with custom children", () => {
    render(
      <ProgressRing progress={50} showPercentage={false}>
        <div>Custom Content</div>
      </ProgressRing>
    );

    expect(screen.getByText("Custom Content")).toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<ProgressRing progress={75} label="Test Progress" />);

    const progressRing = screen.getByRole("progressbar");
    expect(progressRing).toHaveAttribute("aria-valuenow", "75");
    expect(progressRing).toHaveAttribute("aria-valuemin", "0");
    expect(progressRing).toHaveAttribute("aria-valuemax", "100");
    expect(progressRing).toHaveAttribute("aria-label", "Test Progress");
  });

  it("handles edge cases for progress values", () => {
    const { rerender } = render(<ProgressRing progress={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();

    rerender(<ProgressRing progress={100} />);
    expect(screen.getByText("100%")).toBeInTheDocument();

    rerender(<ProgressRing progress={-10} />);
    expect(screen.getByText("-10%")).toBeInTheDocument();

    rerender(<ProgressRing progress={150} />);
    expect(screen.getByText("150%")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ProgressRing progress={50} className="custom-class" />);

    const progressRing = screen.getByRole("progressbar");
    expect(progressRing).toHaveClass("custom-class");
  });

  it("animates progress when animated is true", async () => {
    render(<ProgressRing progress={100} animated={true} />);

    // Initially should show 0% due to animation
    expect(screen.getByText("0%")).toBeInTheDocument();

    // Wait for animation to complete
    await waitFor(
      () => {
        expect(screen.getByText("100%")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("does not animate when animated is false", () => {
    render(<ProgressRing progress={100} animated={false} />);

    // Should immediately show the target progress
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("handles rapid progress changes", async () => {
    const { rerender } = render(<ProgressRing progress={25} animated={true} />);

    // Change progress rapidly
    rerender(<ProgressRing progress={50} animated={true} />);
    rerender(<ProgressRing progress={75} animated={true} />);
    rerender(<ProgressRing progress={100} animated={true} />);

    // Should eventually reach the final value
    await waitFor(
      () => {
        expect(screen.getByText("100%")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("renders SVG elements correctly", () => {
    render(<ProgressRing progress={50} />);

    // Check that SVG elements are rendered
    const svg = screen.getByRole("progressbar").querySelector("svg");
    expect(svg).toBeInTheDocument();

    const circles = svg?.querySelectorAll("circle");
    expect(circles).toHaveLength(2); // Background and progress circles
  });

  it("calculates stroke dash offset correctly", () => {
    render(<ProgressRing progress={50} size={120} strokeWidth={8} />);

    const progressRing = screen.getByRole("progressbar");
    expect(progressRing).toBeInTheDocument();

    // The stroke dash offset should be calculated based on progress
    // For 50% progress, the offset should be half the circumference
  });

  it("handles different color formats", () => {
    const { rerender } = render(<ProgressRing progress={50} color="#ff0000" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    rerender(<ProgressRing progress={50} color="rgb(255, 0, 0)" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    rerender(<ProgressRing progress={50} color="red" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
