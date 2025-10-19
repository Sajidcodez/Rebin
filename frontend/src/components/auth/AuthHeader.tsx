import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icons } from "../ui/icons";

export const AuthHeader: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      // For anchor links, navigate to home first then scroll
      navigate('/');
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      navigate(href);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 text-foreground hover:text-green-400 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Icons.leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ReBin</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleNavClick('/')}
              className="text-sm font-medium text-foreground hover:text-green-400 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('#mission')}
              className="text-sm font-medium text-foreground hover:text-green-400 transition-colors"
            >
              Mission
            </button>
            <button
              onClick={() => handleNavClick('#features')}
              className="text-sm font-medium text-foreground hover:text-green-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('#impact')}
              className="text-sm font-medium text-foreground hover:text-green-400 transition-colors"
            >
              Impact
            </button>
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-foreground hover:text-green-400 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground hover:text-green-400 focus:outline-none focus:text-green-400"
            >
              <Icons.menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black border-t border-gray-800">
              <button
                onClick={() => handleNavClick('/')}
                className="block px-3 py-2 text-base font-medium text-foreground hover:text-green-400 hover:bg-gray-800 rounded-md transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => handleNavClick('#mission')}
                className="block px-3 py-2 text-base font-medium text-foreground hover:text-green-400 hover:bg-gray-800 rounded-md transition-colors"
              >
                Mission
              </button>
              <button
                onClick={() => handleNavClick('#features')}
                className="block px-3 py-2 text-base font-medium text-foreground hover:text-green-400 hover:bg-gray-800 rounded-md transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick('#impact')}
                className="block px-3 py-2 text-base font-medium text-foreground hover:text-green-400 hover:bg-gray-800 rounded-md transition-colors"
              >
                Impact
              </button>
              <div className="border-t border-gray-700 pt-4">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-base font-medium text-foreground hover:text-green-400 hover:bg-gray-800 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-base font-medium text-black bg-green-500 hover:bg-green-600 rounded-md transition-colors mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
