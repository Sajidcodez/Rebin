import React from "react";
import { cn } from "../../lib/utils";
import type { IconProps } from "./icons";

interface FeatureCardProps {
  icon: React.ComponentType<IconProps>;
  title: string;
  description: string;
  color?: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  color = "text-primary",
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 text-center group hover:bg-card/70 transition-colors",
        className
      )}
    >
      <div
        className={cn(
          "w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors",
          color
        )}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
