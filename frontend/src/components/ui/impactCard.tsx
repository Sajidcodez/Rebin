import React from "react";
import { cn } from "../../lib/utils";
import type { IconProps } from "./icons";

interface ImpactCardProps {
  icon: React.ComponentType<IconProps>;
  value: string;
  label: string;
  description: string;
  className?: string;
}

export function ImpactCard({
  icon: Icon,
  value,
  label,
  description,
  className,
}: ImpactCardProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 text-center group hover:bg-card/70 transition-colors",
        className
      )}
    >
      <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="text-3xl font-bold text-primary mb-2">{value}</div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{label}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
