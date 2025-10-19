import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "#hero", label: "Home" },
    { href: "#mission", label: "Mission" },
    { href: "#features", label: "Features" },
    { href: "#impact", label: "Impact" },
  ];

  const communityItems = [
    { href: "/leaderboard", label: "Leaderboard", icon: Icons.trophy },
    { href: "/challenges", label: "Challenges", icon: Icons.target },
    { href: "/achievements", label: "Achievements", icon: Icons.award },
    { href: "/dashboard", label: "Dashboard", icon: Icons.barChart },
  ];

  const handleNavClick = (href: string) => {
    if (location.pathname !== "/") {
      // If not on home page, navigate to home first
      navigate("/");
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      // If already on home page, just scroll
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileMenuOpen(false);
  };

  const isSortingPage = location.pathname === "/sorting";
  const isAuthPage = ["/login", "/register", "/auth/callback"].includes(location.pathname);
  const isCommunityPage = ["/leaderboard", "/challenges", "/achievements", "/dashboard"].includes(location.pathname);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b ${
        isSortingPage || isAuthPage || isCommunityPage
          ? "border-gray-800 bg-black"
          : "border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Icons.leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span
              className={`text-xl font-bold ${
                isSortingPage || isAuthPage || isCommunityPage ? "text-white" : "text-foreground"
              }`}
            >
              ReBin
            </span>
          </div>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`text-sm font-medium hover:text-primary transition-colors ${
                  isSortingPage || isAuthPage || isCommunityPage ? "text-white" : "text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Community Features - only show if user is logged in */}
            {user && (
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    isSortingPage || isAuthPage || isCommunityPage ? "text-white/70" : "text-muted-foreground"
                  }`}
                >
                  Community:
                </span>
                {communityItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-primary/10 transition-colors ${
                        isSortingPage || isCommunityPage
                          ? "text-white hover:text-white"
                          : "text-foreground hover:text-primary"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Authentication buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate("/sorting")}
                >
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="border-border text-foreground hover:bg-card"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="border-border text-foreground hover:bg-card"
                >
                  Sign In
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate("/register")}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </nav>
          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 ${
                  isSortingPage || isAuthPage || isCommunityPage ? "text-white" : "text-foreground"
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <Icons.x className="h-6 w-6" />
            ) : (
              <Icons.menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav
            className={`md:hidden py-4 space-y-4 border-t ${
              isSortingPage || isCommunityPage ? "border-gray-800" : "border-border/40"
            }`}
          >
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`block w-full text-left text-sm font-medium hover:text-primary transition-colors py-2 ${
                  isSortingPage || isAuthPage || isCommunityPage ? "text-white" : "text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Community Features in Mobile Menu */}
            {user && (
              <>
                <div
                  className={`border-t py-2 ${
                    isSortingPage || isCommunityPage ? "border-gray-800" : "border-border/40"
                  }`}
                >
                  <div
                    className={`text-xs font-medium mb-2 px-2 ${
                      isSortingPage || isAuthPage || isCommunityPage ? "text-white/70" : "text-muted-foreground"
                    }`}
                  >
                    Community Features
                  </div>
                  {communityItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          navigate(item.href);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 w-full text-left text-sm font-medium hover:text-primary transition-colors py-2 px-2 ${
                          isSortingPage || isAuthPage || isCommunityPage ? "text-white" : "text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Authentication buttons in mobile menu */}
            {user ? (
              <div className="space-y-2">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    navigate("/sorting");
                    setMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-card"
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-card"
                  onClick={() => {
                    navigate("/login");
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    navigate("/register");
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
