import { useState, useEffect } from "react";
import { usePWA } from "../hooks/usePWA";

interface OfflineIndicatorProps {
  showInstallPrompt?: boolean;
}

export function OfflineIndicator({
  showInstallPrompt = true,
}: OfflineIndicatorProps) {
  const { isOnline, isInstallable, installApp, isInstalled } = usePWA();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  // Show install banner after a delay if conditions are met
  useEffect(() => {
    if (
      showInstallPrompt &&
      isInstallable &&
      !isInstalled &&
      !dismissedInstall
    ) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, dismissedInstall, showInstallPrompt]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowInstallBanner(false);
    }
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    setDismissedInstall(true);
    // Remember dismissal for this session
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  // Check if user previously dismissed install prompt
  useEffect(() => {
    const dismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      setDismissedInstall(true);
    }
  }, []);

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-3 text-center z-50">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              You're offline. Some features may be limited.
            </span>
          </div>
        </div>
      )}

      {/* Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-green-500 text-white p-4 z-50 shadow-lg">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-xl">📱</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Install ReBin Pro</h3>
                  <p className="text-xs opacity-90">
                    Get quick access and work offline
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleInstall}
                  className="px-3 py-1 bg-white text-green-500 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={dismissInstall}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Status Indicator (subtle) */}
      {isOnline && (
        <div className="fixed top-4 right-4 z-40">
          <div className="flex items-center space-x-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Online</span>
          </div>
        </div>
      )}
    </>
  );
}
