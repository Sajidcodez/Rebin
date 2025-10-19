"use client";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { StatCard } from "../ui/statCard";
import { Icons } from "../ui/icons";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function HeroSection() {
  const { user } = useAuth();

  const stats = [
    { value: "98%", label: "Accuracy" },
    { value: "Expected 100+", label: "Users" },
    { value: "Many", label: "Items Sorted" },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge icon={Icons.recycle} text="Smart Waste Sorting" />

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance leading-tight">
            Sort Smarter,
            <br />
            <span className="text-primary">Live Greener</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            AI-powered waste classification that helps you make the right choice
            every time. Join now in making a real impact on our planet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link to="/sorting">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 group"
                >
                  Start Sorting
                  <Icons.arrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 group"
                  >
                    Get Started
                    <Icons.arrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </>
            )}
            <Button
              size="lg"
              variant="outline"
              className="border-border text-foreground hover:bg-card bg-transparent"
              onClick={() => {
                const element = document.querySelector("#features");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <StatCard key={index} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
