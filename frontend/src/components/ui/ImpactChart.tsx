import React, { memo, useCallback, useState, useMemo } from "react";
import { cn } from "../../lib/utils";
import { Icons } from "./icons";

// ============================================================================
// TYPES
// ============================================================================

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  label: string;
  date: Date;
}

interface ImpactChartProps {
  data: ChartPoint[];
  type?: "line" | "bar" | "area";
  animated?: boolean;
  showTooltips?: boolean;
  showGrid?: boolean;
  showAxes?: boolean;
  height?: number;
  width?: number;
  className?: string;
  onPointHover?: (point: ChartPoint | null) => void;
  onPointClick?: (point: ChartPoint) => void;
}

interface ChartTooltipProps {
  point: ChartPoint;
  position: { x: number; y: number };
  visible: boolean;
}

// ============================================================================
// CHART TOOLTIP COMPONENT
// ============================================================================

const ChartTooltip: React.FC<ChartTooltipProps> = ({
  point,
  position,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div
      className="absolute z-10 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg pointer-events-none"
      style={{
        left: position.x,
        top: position.y - 40,
        transform: "translateX(-50%)",
      }}
      role="tooltip"
      aria-label={`Data point: ${point.label}, Value: ${point.value}`}
    >
      <div className="font-medium">{point.label}</div>
      <div className="text-gray-300">{point.value.toLocaleString()}</div>
      <div className="text-xs text-gray-400">
        {point.date.toLocaleDateString()}
      </div>

      {/* Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
    </div>
  );
};

// ============================================================================
// IMPACT CHART COMPONENT
// ============================================================================

const ImpactChart = memo<ImpactChartProps>(
  ({
    data,
    type = "line",
    animated = true,
    showTooltips = true,
    showGrid = true,
    showAxes = true,
    height = 400,
    width = 800,
    className,
    onPointHover,
    onPointClick,
  }) => {
    const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
    const [focusedPoint, setFocusedPoint] = useState<ChartPoint | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Calculate chart dimensions and scales
    const chartData = useMemo(() => {
      if (!data || data.length === 0) return null;

      const padding = { top: 20, right: 40, bottom: 60, left: 60 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      // Find min/max values
      const minX = Math.min(...data.map((d) => d.x));
      const maxX = Math.max(...data.map((d) => d.x));
      const minY = Math.min(...data.map((d) => d.y));
      const maxY = Math.max(...data.map((d) => d.y));

      // Add some padding to the Y range
      const yRange = maxY - minY;
      const yMin = Math.max(0, minY - yRange * 0.1);
      const yMax = maxY + yRange * 0.1;

      // Scale functions
      const scaleX = (x: number) =>
        padding.left + ((x - minX) / (maxX - minX)) * chartWidth;
      const scaleY = (y: number) =>
        padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

      return {
        padding,
        chartWidth,
        chartHeight,
        minX,
        maxX,
        yMin,
        yMax,
        scaleX,
        scaleY,
        points: data.map((d) => ({
          ...d,
          scaledX: scaleX(d.x),
          scaledY: scaleY(d.y),
        })),
      };
    }, [data, width, height]);

    const handlePointHover = useCallback(
      (point: ChartPoint | null, event?: React.MouseEvent) => {
        setHoveredPoint(point);
        onPointHover?.(point);

        if (point && event && chartData) {
          const rect = (
            event.currentTarget as SVGElement
          ).getBoundingClientRect();
          setTooltipPosition({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      },
      [onPointHover, chartData]
    );

    const handlePointFocus = useCallback((point: ChartPoint) => {
      setFocusedPoint(point);
    }, []);

    const generateChartDescription = useCallback(() => {
      if (!data || data.length === 0) return "No data available";

      const total = data.reduce((sum, point) => sum + point.value, 0);
      const average = total / data.length;
      const trend =
        data.length > 1
          ? data[data.length - 1].value > data[0].value
            ? "increasing"
            : "decreasing"
          : "stable";

      return `Chart showing ${
        data.length
      } data points with a total value of ${total.toLocaleString()}, average of ${average.toLocaleString()}, and ${trend} trend.`;
    }, [data]);

    const generateDetailedChartDescription = useCallback(() => {
      if (!data || data.length === 0) return "No data available";

      return data
        .map(
          (point, index) =>
            `Point ${index + 1}: ${
              point.label
            } with value ${point.value.toLocaleString()} on ${point.date.toLocaleDateString()}`
        )
        .join(". ");
    }, [data]);

    if (!chartData || !data || data.length === 0) {
      return (
        <div
          className={cn(
            "flex items-center justify-center bg-gray-50 rounded-lg",
            className
          )}
          style={{ height, width }}
        >
          <div className="text-center">
            <Icons.barChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No data available</p>
          </div>
        </div>
      );
    }

    const {
      padding,
      chartWidth,
      chartHeight,
      yMin,
      yMax,
      scaleX,
      scaleY,
      points,
    } = chartData;

    return (
      <div className={cn("impact-chart-container", className)}>
        <div className="chart-header mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Environmental Impact Over Time
          </h3>
          <div className="chart-legend flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-600 rounded-full" />
              <span className="text-sm text-gray-600">CO₂ Saved (kg)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full" />
              <span className="text-sm text-gray-600">Items Sorted</span>
            </div>
          </div>
        </div>

        <div
          className="chart-wrapper relative"
          role="img"
          aria-label={generateChartDescription()}
        >
          <svg
            className="impact-chart"
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            aria-hidden="true"
          >
            {/* Grid lines */}
            {showGrid && (
              <g className="chart-grid">
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                  <line
                    key={`h-${ratio}`}
                    x1={padding.left}
                    y1={padding.top + ratio * chartHeight}
                    x2={padding.left + chartWidth}
                    y2={padding.top + ratio * chartHeight}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-gray-200"
                  />
                ))}

                {/* Vertical grid lines */}
                {points.map((point, index) => (
                  <line
                    key={`v-${index}`}
                    x1={point.scaledX}
                    y1={padding.top}
                    x2={point.scaledX}
                    y2={padding.top + chartHeight}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-gray-200"
                  />
                ))}
              </g>
            )}

            {/* Axes */}
            {showAxes && (
              <g className="chart-axes">
                {/* X-axis */}
                <line
                  x1={padding.left}
                  y1={padding.top + chartHeight}
                  x2={padding.left + chartWidth}
                  y2={padding.top + chartHeight}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-400"
                />

                {/* Y-axis */}
                <line
                  x1={padding.left}
                  y1={padding.top}
                  x2={padding.left}
                  y2={padding.top + chartHeight}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-400"
                />
              </g>
            )}

            {/* Chart line/area */}
            {type === "line" && (
              <polyline
                points={points
                  .map((p) => `${p.scaledX},${p.scaledY}`)
                  .join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary-600"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {type === "area" && (
              <>
                <defs>
                  <linearGradient
                    id="areaGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity="0.3"
                    />
                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity="0.05"
                    />
                  </linearGradient>
                </defs>
                <polygon
                  points={`${padding.left},${padding.top + chartHeight} ${points
                    .map((p) => `${p.scaledX},${p.scaledY}`)
                    .join(" ")} ${padding.left + chartWidth},${
                    padding.top + chartHeight
                  }`}
                  fill="url(#areaGradient)"
                  className="text-primary-600"
                />
                <polyline
                  points={points
                    .map((p) => `${p.scaledX},${p.scaledY}`)
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary-600"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Data points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.scaledX}
                cy={point.scaledY}
                r="6"
                fill="currentColor"
                className={cn(
                  "text-primary-600 transition-all duration-200 cursor-pointer",
                  (hoveredPoint === point || focusedPoint === point) &&
                    "r-8 text-primary-800"
                )}
                onMouseEnter={(e) => handlePointHover(point, e)}
                onMouseLeave={() => handlePointHover(null)}
                onClick={() => onPointClick?.(point)}
                onFocus={() => handlePointFocus(point)}
                tabIndex={0}
                role="button"
                aria-label={`Data point: ${
                  point.label
                }, Value: ${point.value.toLocaleString()}`}
              />
            ))}

            {/* Y-axis labels */}
            {showAxes && (
              <g className="y-axis-labels">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const value = yMin + (yMax - yMin) * (1 - ratio);
                  return (
                    <text
                      key={`y-label-${ratio}`}
                      x={padding.left - 10}
                      y={padding.top + ratio * chartHeight + 4}
                      textAnchor="end"
                      className="text-xs text-gray-600"
                    >
                      {value.toLocaleString()}
                    </text>
                  );
                })}
              </g>
            )}

            {/* X-axis labels */}
            {showAxes && (
              <g className="x-axis-labels">
                {points.map((point, index) => (
                  <text
                    key={`x-label-${index}`}
                    x={point.scaledX}
                    y={padding.top + chartHeight + 20}
                    textAnchor="middle"
                    className="text-xs text-gray-600"
                  >
                    {point.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </text>
                ))}
              </g>
            )}
          </svg>

          {showTooltips && (hoveredPoint || focusedPoint) && (
            <ChartTooltip
              point={hoveredPoint || focusedPoint!}
              position={tooltipPosition}
              visible={true}
            />
          )}
        </div>

        <div className="chart-description sr-only">
          {generateDetailedChartDescription()}
        </div>
      </div>
    );
  }
);

ImpactChart.displayName = "ImpactChart";

export { ImpactChart };
