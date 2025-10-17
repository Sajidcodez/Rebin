interface StatCardProps {
    value: string
    label: string
  }
  
  export function StatCard({ value, label }: StatCardProps) {
    return (
      <div className="space-y-2">
        <div className="text-3xl sm:text-4xl font-bold text-primary">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    )
  }
  