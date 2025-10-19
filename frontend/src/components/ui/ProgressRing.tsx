import React, { memo, useEffect, useState } from "react";
import { cn } from "../../lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: "primary" | "green" | "orange" | "purple" | "red" | "blue";
  animated?: boolean;
  showPercentage?: boolean;
  className?: string;
  label?: string;
  children?: React.ReactNode;
}

// ============================================================================
// PROGRESS RING COMPONENT
// ============================================================================

const ProgressRing = memo<ProgressRingProps>(
  ({
    progress,
    size = 120,
    strokeWidth = 8,
    color = "primary",
    animated = true,
    showPercentage = true,
    className,
    label,
    children,
  }) => {
    const [animatedProgress, setAnimatedProgress] = useState(0);

    // Animate progress when it changes
    useEffect(() => {
      if (!animated) {
        setAnimatedProgress(progress);
        return;
      }

      const duration = 1000; // 1 second animation
      const startTime = Date.now();
      const startProgress = animatedProgress;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progressRatio, 3);
        const currentProgress =
          startProgress + (progress - startProgress) * easeOutCubic;

        setAnimatedProgress(currentProgress);

        if (progressRatio < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [progress, animated, animatedProgress]);

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset =
      circumference - (animatedProgress / 100) * circumference;

    const getColorClasses = (color: ProgressRingProps["color"]) => {
      switch (color) {
        case "primary":
          return "text-primary-600";
        case "green":
          return "text-green-600";
        case "orange":
          return "text-orange-600";
        case "purple":
          return "text-purple-600";
        case "red":
          return "text-red-600";
        case "blue":
          return "text-blue-600";
        default:
          return "text-primary-600";
      }
    };

    const colorClass = getColorClasses(color);

    return (
      <div
        className={cn(
          "progress-ring-container inline-flex items-center justify-center",
          className
        )}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${Math.round(progress)}%`}
      >
        <svg
          width={size}
          height={size}
          className="progress-ring transform -rotate-90"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            className="progress-ring-background stroke-gray-200"
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />

          {/* Progress circle */}
          <circle
            className={cn(
              "progress-ring-foreground transition-all duration-300",
              colorClass,
              animated && "transition-all duration-1000 ease-out"
            )}
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={animated ? strokeDashoffset : 0}
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              strokeDasharray,
              strokeDashoffset: animated ? strokeDashoffset : 0,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {children ||
            (showPercentage && (
              <div className="text-center">
                <div className={cn("text-2xl font-bold", colorClass)}>
                  {Math.round(animatedProgress)}%
                </div>
                {label && (
                  <div className="text-xs text-gray-600 mt-1">{label}</div>
                )}
              </div>
            ))}
        </div>
      </div>
    );
  }
);

ProgressRing.displayName = "ProgressRing";

export { ProgressRing };
