import { useEffect, useState } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Download, Wifi, WifiOff, RefreshCw, X } from "lucide-react";

/**
 * PWAInstallBanner
 * - Shows an install prompt at the bottom of the screen on mobile
 * - Shows an offline indicator when there's no network
 * - Shows an update available toast when a new SW is detected
 */
export function PWAInstallBanner() {
  const {
    isInstallable,
    isOnline,
    isUpdateAvailable,
    promptInstall,
    dismissInstall,
    updateSW,
    isInstalled,
  } = usePWA();
  const [showInstall, setShowInstall] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  // Respect previous dismissal (7 days)
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const elapsed = Date.now() - Number(dismissed);
      if (elapsed < 7 * 24 * 60 * 60 * 1000) return;
    }
    if (isInstallable && !isInstalled) {
      // Small delay so it doesn't flash on first load
      const t = setTimeout(() => setShowInstall(true), 3000);
      return () => clearTimeout(t);
    }
  }, [isInstallable, isInstalled]);

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
    } else {
      const t = setTimeout(() => setShowOffline(false), 2500);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  return (
    <>
      {/* ── Offline / Online badge ────────────────────────────────────────── */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: showOffline ? "1rem" : "-5rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          transition: "top 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "9999px",
            background: isOnline ? "#166534" : "#1a1a1a",
            color: "#fff",
            fontSize: "0.8125rem",
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            whiteSpace: "nowrap",
          }}
        >
          {isOnline ? (
            <>
              <Wifi size={14} />
              Connexion rétablie
            </>
          ) : (
            <>
              <WifiOff size={14} />
              Hors ligne
            </>
          )}
        </div>
      </div>

      {/* ── Update available banner ───────────────────────────────────────── */}
      {isUpdateAvailable && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9998,
            background: "#1D3A6C",
            color: "#fff",
            borderRadius: "10px",
            padding: "0.75rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            maxWidth: "90vw",
          }}
        >
          <RefreshCw size={16} />
          <span>Mise à jour disponible</span>
          <button
            onClick={updateSW}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#fff",
              padding: "0.25rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Mettre à jour
          </button>
        </div>
      )}

      {/* ── Install banner (mobile bottom sheet style) ────────────────────── */}
      {showInstall && (
        <div
          role="dialog"
          aria-label="Installer l'application Kolori RH"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9997,
            padding: "1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom))",
            background: "#fff",
            borderTop: "1px solid #e5e7eb",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            animation: "slideUpBanner 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <style>{`
            @keyframes slideUpBanner {
              from { transform: translateY(100%); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
          `}</style>

          {/* App icon */}
          <img
            src="/icons/icon-192.png"
            alt="Kolori RH"
            style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }}
          />

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#1D3A6C", lineHeight: 1.2 }}
            >
              Installer Kolori RH
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                color: "#737373",
                marginTop: "0.2rem",
                lineHeight: 1.4,
              }}
            >
              Accès rapide, mode hors ligne
            </div>
          </div>

          {/* CTA */}
          <button
            id="pwa-install-btn"
            onClick={async () => {
              await promptInstall();
              setShowInstall(false);
            }}
            style={{
              background: "#1D3A6C",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.1rem",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              flexShrink: 0,
              letterSpacing: "0.03em",
            }}
          >
            <Download size={14} />
            Installer
          </button>

          {/* Dismiss */}
          <button
            id="pwa-dismiss-btn"
            onClick={() => {
              dismissInstall();
              setShowInstall(false);
            }}
            aria-label="Fermer"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: "0.25rem",
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
