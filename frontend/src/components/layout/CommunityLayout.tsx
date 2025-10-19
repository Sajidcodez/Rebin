import React from "react";
import { Header } from "../landingPage/header";
import { Footer } from "../landingPage/footer";

interface CommunityLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl";
}

export function CommunityLayout({ 
  children, 
  title, 
  description, 
  maxWidth = "4xl" 
}: CommunityLayoutProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl"
  }[maxWidth];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            <p className="text-gray-600">
              {description}
            </p>
          </div>
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
