import { Icons } from "../ui/icons";
import { SectionHeader } from "../ui/sectionHeader";
import { FeatureCard } from "../ui/featureCard";

export function FeaturesSection() {
  const features = [
    {
      icon: Icons.camera,
      title: "Instant Recognition",
      description:
        "Snap a photo and get instant classification results powered by advanced AI",
      color: "text-primary",
    },
    {
      icon: Icons.trophy,
      title: "Leaderboards",
      description:
        "Compete with friends and see how you rank in environmental impact",
      color: "text-secondary",
    },
    {
      icon: Icons.target,
      title: "Challenges",
      description: "Join community challenges to reduce waste and earn rewards",
      color: "text-primary",
    },
    {
      icon: Icons.award,
      title: "Achievements",
      description:
        "Unlock badges and achievements as you make sustainable choices",
      color: "text-secondary",
    },
  ];

  return (
    <section id="features" className="relative py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Powerful "
          highlight=" Features"
          description="Everything you need to make informed decisions about waste sorting"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
