interface SectionHeaderProps {
    title: string
    highlight?: string
    description: string
  }
  
  export function SectionHeader({ title, highlight, description }: SectionHeaderProps) {
    return (
      <div className="max-w-2xl mx-auto text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          {title} {highlight && <span className="text-primary">{highlight}</span>}
        </h2>
        <p className="text-lg text-muted-foreground text-pretty leading-relaxed">{description}</p>
      </div>
    )
  }