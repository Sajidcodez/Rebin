import type React from "react"
import type { IconProps } from "../ui/icons"

interface FeatureCardProps {
  icon: React.ComponentType<IconProps>
  title: string
  description: string
  color?: string
}

export function FeatureCard({ icon: Icon, title, description, color = "text-primary" }: FeatureCardProps) {
  return (
    <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300">
      <div className={`inline-flex p-3 rounded-lg bg-primary/10 mb-4 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}
