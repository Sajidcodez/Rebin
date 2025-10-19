import { useState, useEffect, useCallback } from "react";

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  installPrompt: PWAInstallPrompt | null;
}

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isStandalone: window.matchMedia("(display-mode: standalone)").matches,
    installPrompt: null,
  });

  // Check if app is installed
  const checkInstallation = useCallback(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isInApp = (window.navigator as any).standalone === true; // iOS Safari

    setPwaState((prev) => ({
      ...prev,
      isInstalled: isStandalone || isInApp,
      isStandalone: isStandalone || isInApp,
    }));
  }, []);

  // Handle install prompt
  const handleInstallPrompt = useCallback((event: Event) => {
    event.preventDefault();
    setPwaState((prev) => ({
      ...prev,
      isInstallable: true,
      installPrompt: event as any,
    }));
  }, []);

  // Install the app
  const installApp = useCallback(async () => {
    if (!pwaState.installPrompt) return false;

    try {
      await pwaState.installPrompt.prompt();
      const choiceResult = await pwaState.installPrompt.userChoice;

      setPwaState((prev) => ({
        ...prev,
        isInstallable: false,
        installPrompt: null,
      }));

      return choiceResult.outcome === "accepted";
    } catch (error) {
      console.error("Failed to install app:", error);
      return false;
    }
  }, [pwaState.installPrompt]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration);

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New content is available
                if (confirm("New version available! Reload to update?")) {
                  window.location.reload();
                }
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
        });

        // Send subscription to server
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription),
        });

        return subscription;
      } catch (error) {
        console.error("Push subscription failed:", error);
      }
    }
  }, []);

  // Handle online/offline status
  const handleOnlineStatus = useCallback(() => {
    setPwaState((prev) => ({
      ...prev,
      isOnline: navigator.onLine,
    }));
  }, []);

  // Setup event listeners
  useEffect(() => {
    // Install prompt
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    // Installation check
    checkInstallation();

    // Online/offline status
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    // Display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => checkInstallation();
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    // Register service worker
    registerServiceWorker();

    // Cleanup
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, [
    handleInstallPrompt,
    checkInstallation,
    handleOnlineStatus,
    registerServiceWorker,
  ]);

  return {
    ...pwaState,
    installApp,
    requestNotificationPermission,
    subscribeToPush,
    registerServiceWorker,
  };
}
