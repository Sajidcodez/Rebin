interface MissionCardProps {
    title: string
    description: string
    color?: string
  }
  
  export function MissionCard({ title, description, color = "text-secondary" }: MissionCardProps) {
    return (
      <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
        <div className={`text-3xl font-bold ${color} mb-2`}>{title}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    )
  }
  