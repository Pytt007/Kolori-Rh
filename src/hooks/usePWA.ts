import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  promptInstall: () => Promise<void>;
  dismissInstall: () => void;
  updateSW: () => void;
}

const isBrowser = typeof window !== "undefined";

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePWA(): PWAState {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (isBrowser ? navigator.onLine : true));
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // ── Detect if already installed (standalone mode) ─────────────────────
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || (window.navigator as any).standalone === true);
    const handleDisplayChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener("change", handleDisplayChange);

    // ── Install prompt ────────────────────────────────────────────────────
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPrompt = null;
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // ── Online / Offline ─────────────────────────────────────────────────
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // ── Service Worker registration ──────────────────────────────────────
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          setSwReg(reg);

          // Check for updates on registration
          reg.update();

          // Listen for SW updates
          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          });
        })
        .catch((err) => console.warn("[SW] Registration failed:", err));

      // Detect controller change (after SW update)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }

    return () => {
      mq.removeEventListener("change", handleDisplayChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstallable(false);
    }
    deferredPrompt = null;
  };

  const dismissInstall = () => {
    setIsInstallable(false);
    deferredPrompt = null;
    // Remember dismissal for 7 days
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
  };

  const updateSW = () => {
    if (swReg?.waiting) {
      swReg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    promptInstall,
    dismissInstall,
    updateSW,
  };
}
