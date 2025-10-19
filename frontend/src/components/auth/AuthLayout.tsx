import React from "react";
import { AuthHeader } from "./AuthHeader";
import { AuthFooter } from "./AuthFooter";
import { EarthBackground } from "../landingPage/earthBackground";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <EarthBackground />
      <AuthHeader />
      <main className="flex-1 relative z-10 flex items-center justify-center py-12">
        {children}
      </main>
      <AuthFooter />
    </div>
  );
};
