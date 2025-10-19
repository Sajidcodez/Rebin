import React from "react";
import { cn } from "../../lib/utils";

interface MissionCardProps {
  title: string;
  description: string;
  color?: string;
  size?: string;
  className?: string;
}

export function MissionCard({
  title,
  description,
  color = "text-primary",
  size = "text-xl",
  className,
}: MissionCardProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 text-center",
        className
      )}
    >
      <h3 className={cn("font-bold mb-2", size, color)}>{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
