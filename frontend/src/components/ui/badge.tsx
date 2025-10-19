import React from "react";
import { cn } from "../../lib/utils";
import type { IconProps } from "../ui/icons";
interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  icon: React.ComponentType<IconProps>;
  text: string;
}

export function Badge({
  variant = "default",
  className,
  icon: Icon,
  text,
}: BadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-primary">{text}</span>
    </div>
  );
}
