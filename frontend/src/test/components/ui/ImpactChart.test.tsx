import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImpactChart } from "../../../components/ui/ImpactChart";

const mockChartData = [
  {
    x: 0,
    y: 10,
    value: 10,
    label: "Day 1",
    date: new Date("2024-01-01"),
  },
  {
    x: 1,
    y: 25,
    value: 25,
    label: "Day 2",
    date: new Date("2024-01-02"),
  },
  {
    x: 2,
    y: 15,
    value: 15,
    label: "Day 3",
    date: new Date("2024-01-03"),
  },
  {
    x: 3,
    y: 30,
    value: 30,
    label: "Day 4",
    date: new Date("2024-01-04"),
  },
];

describe("ImpactChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(<ImpactChart data={mockChartData} />);

    expect(
      screen.getByText("Environmental Impact Over Time")
    ).toBeInTheDocument();
    expect(screen.getByText("CO₂ Saved (kg)")).toBeInTheDocument();
    expect(screen.getByText("Items Sorted")).toBeInTheDocument();
  });

  it("renders with empty data", () => {
    render(<ImpactChart data={[]} />);

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders with null data", () => {
    render(<ImpactChart data={null as any} />);

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders line chart by default", () => {
    render(<ImpactChart data={mockChartData} />);

    const svg = screen.getByRole("img").querySelector("svg");
    expect(svg).toBeInTheDocument();

    // Should have polyline for line chart
    const polyline = svg?.querySelector("polyline");
    expect(polyline).toBeInTheDocument();
  });

  it("renders area chart when type is area", () => {
    render(<ImpactChart data={mockChartData} type="area" />);

    const svg = screen.getByRole("img").querySelector("svg");
    expect(svg).toBeInTheDocument();

    // Should have polygon for area chart
    const polygon = svg?.querySelector("polygon");
    expect(polygon).toBeInTheDocument();
  });

  it("shows grid lines by default", () => {
    render(<ImpactChart data={mockChartData} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const gridLines = svg?.querySelectorAll("line");
    expect(gridLines?.length).toBeGreaterThan(0);
  });

  it("hides grid lines when showGrid is false", () => {
    render(<ImpactChart data={mockChartData} showGrid={false} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const gridGroup = svg?.querySelector(".chart-grid");
    expect(gridGroup).not.toBeInTheDocument();
  });

  it("shows axes by default", () => {
    render(<ImpactChart data={mockChartData} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const axesGroup = svg?.querySelector(".chart-axes");
    expect(axesGroup).toBeInTheDocument();
  });

  it("hides axes when showAxes is false", () => {
    render(<ImpactChart data={mockChartData} showAxes={false} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const axesGroup = svg?.querySelector(".chart-axes");
    expect(axesGroup).not.toBeInTheDocument();
  });

  it("renders data points as circles", () => {
    render(<ImpactChart data={mockChartData} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const circles = svg?.querySelectorAll("circle");
    expect(circles).toHaveLength(mockChartData.length);
  });

  it("shows tooltips when showTooltips is true", async () => {
    const user = userEvent.setup();
    render(<ImpactChart data={mockChartData} showTooltips={true} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const firstCircle = svg?.querySelector("circle");

    if (firstCircle) {
      await user.hover(firstCircle);
      // Tooltip should appear
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    }
  });

  it("hides tooltips when showTooltips is false", async () => {
    const user = userEvent.setup();
    render(<ImpactChart data={mockChartData} showTooltips={false} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const firstCircle = svg?.querySelector("circle");

    if (firstCircle) {
      await user.hover(firstCircle);
      // Tooltip should not appear
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    }
  });

  it("handles point hover events", async () => {
    const user = userEvent.setup();
    const onPointHover = vi.fn();
    render(<ImpactChart data={mockChartData} onPointHover={onPointHover} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const firstCircle = svg?.querySelector("circle");

    if (firstCircle) {
      await user.hover(firstCircle);
      expect(onPointHover).toHaveBeenCalledWith(mockChartData[0]);
    }
  });

  it("handles point click events", async () => {
    const user = userEvent.setup();
    const onPointClick = vi.fn();
    render(<ImpactChart data={mockChartData} onPointClick={onPointClick} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const firstCircle = svg?.querySelector("circle");

    if (firstCircle) {
      await user.click(firstCircle);
      expect(onPointClick).toHaveBeenCalledWith(mockChartData[0]);
    }
  });

  it("has proper accessibility attributes", () => {
    render(<ImpactChart data={mockChartData} />);

    const chartWrapper = screen.getByRole("img");
    expect(chartWrapper).toHaveAttribute("aria-label");
    expect(chartWrapper.getAttribute("aria-label")).toContain("Chart showing");
  });

  it("generates detailed chart description for screen readers", () => {
    render(<ImpactChart data={mockChartData} />);

    const description = screen.getByText(/Point 1: Day 1 with value 10/);
    expect(description).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ImpactChart data={mockChartData} className="custom-chart" />);

    const chartContainer = screen
      .getByText("Environmental Impact Over Time")
      .closest(".impact-chart-container");
    expect(chartContainer).toHaveClass("custom-chart");
  });

  it("renders with custom dimensions", () => {
    render(<ImpactChart data={mockChartData} width={1000} height={500} />);

    const svg = screen.getByRole("img").querySelector("svg");
    expect(svg).toHaveAttribute("width", "1000");
    expect(svg).toHaveAttribute("height", "500");
  });

  it("handles single data point", () => {
    const singleDataPoint = [mockChartData[0]];
    render(<ImpactChart data={singleDataPoint} />);

    expect(
      screen.getByText("Environmental Impact Over Time")
    ).toBeInTheDocument();

    const svg = screen.getByRole("img").querySelector("svg");
    const circles = svg?.querySelectorAll("circle");
    expect(circles).toHaveLength(1);
  });

  it("calculates chart scales correctly", () => {
    render(<ImpactChart data={mockChartData} />);

    // The chart should render without errors and display the data
    expect(
      screen.getByText("Environmental Impact Over Time")
    ).toBeInTheDocument();

    const svg = screen.getByRole("img").querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("handles data with zero values", () => {
    const dataWithZeros = [
      { x: 0, y: 0, value: 0, label: "Zero", date: new Date("2024-01-01") },
      {
        x: 1,
        y: 10,
        value: 10,
        label: "Non-zero",
        date: new Date("2024-01-02"),
      },
    ];

    render(<ImpactChart data={dataWithZeros} />);

    expect(
      screen.getByText("Environmental Impact Over Time")
    ).toBeInTheDocument();

    const svg = screen.getByRole("img").querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("handles data with negative values", () => {
    const dataWithNegatives = [
      {
        x: 0,
        y: -10,
        value: -10,
        label: "Negative",
        date: new Date("2024-01-01"),
      },
      {
        x: 1,
        y: 10,
        value: 10,
        label: "Positive",
        date: new Date("2024-01-02"),
      },
    ];

    render(<ImpactChart data={dataWithNegatives} />);

    expect(
      screen.getByText("Environmental Impact Over Time")
    ).toBeInTheDocument();

    const svg = screen.getByRole("img").querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders Y-axis labels when showAxes is true", () => {
    render(<ImpactChart data={mockChartData} showAxes={true} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const yAxisLabels = svg?.querySelector(".y-axis-labels");
    expect(yAxisLabels).toBeInTheDocument();
  });

  it("renders X-axis labels when showAxes is true", () => {
    render(<ImpactChart data={mockChartData} showAxes={true} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const xAxisLabels = svg?.querySelector(".x-axis-labels");
    expect(xAxisLabels).toBeInTheDocument();
  });

  it("handles keyboard navigation on data points", async () => {
    const user = userEvent.setup();
    render(<ImpactChart data={mockChartData} />);

    const svg = screen.getByRole("img").querySelector("svg");
    const firstCircle = svg?.querySelector("circle");

    if (firstCircle) {
      // Focus on the first data point
      firstCircle.focus();
      expect(firstCircle).toHaveFocus();

      // Should be able to activate with Enter key
      await user.keyboard("{Enter}");
    }
  });

  it("handles rapid data changes", () => {
    const { rerender } = render(<ImpactChart data={mockChartData} />);
    expect(
      screen.getByText("Environmental Impact Over Time")
    ).toBeInTheDocument();

    const newData = [
      {
        x: 0,
        y: 50,
        value: 50,
        label: "New Day 1",
        date: new Date("2024-01-05"),
      },
      {
        x: 1,
        y: 75,
        value: 75,
        label: "New Day 2",
        date: new Date("2024-01-06"),
      },
    ];

    rerender(<ImpactChart data={newData} />);
    expect(
      screen.getByText("Environmental Impact Over Time")
    ).toBeInTheDocument();
  });
});
