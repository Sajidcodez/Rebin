import React from "react";
import { cn } from "../../lib/utils";

interface SectionHeaderProps {
  title: string;
  highlight: string;
  description: string;
  className?: string;
}

export function SectionHeader({
  title,
  highlight,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("text-center space-y-4 mb-12", className)}>
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance">
        {title}
        <span className="text-primary">{highlight}</span>
      </h2>
      <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
        {description}
      </p>
    </div>
  );
}
