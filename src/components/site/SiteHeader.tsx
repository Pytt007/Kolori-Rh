import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  User as UserIcon,
  Bell,
  Check,
  Menu,
  X,
  Briefcase,
  Building2,
  Phone,
  Info,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  titre: string;
  message: string | null;
  link: string | null;
  lu: boolean;
  created_at: string;
};

export function SiteHeader() {
  const { isAuthenticated, user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === "/";

  const dashboardPath = roles.includes("admin")
    ? "/admin"
    : roles.includes("recruteur")
      ? "/recruteur"
      : "/candidat";

  const unreadCount = notifications.filter((n) => !n.lu).length;

  async function loadNotifications() {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications((data as any) ?? []);
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationRow, ...prev]);
          toast.info(payload.new.titre, { description: payload.new.message });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function handleNotificationClick(n: NotificationRow) {
    if (!n.lu) {
      await supabase.from("notifications").update({ lu: true }).eq("id", n.id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === n.id ? { ...notif, lu: true } : notif)),
      );
    }
    if (n.link) {
      navigate({ to: n.link });
    }
  }

  async function markAllAsRead() {
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ lu: true })
      .eq("user_id", user.id)
      .eq("lu", false);

    if (!error) {
      setNotifications((prev) => prev.map((notif) => ({ ...notif, lu: true })));
      toast.success("Toutes les notifications ont été marquées comme lues.");
    }
  }

  return (
    <>
      <nav
        className={`${
          isHomePage ? "fixed top-0 left-0 w-full" : "sticky top-0"
        } z-50 transition-all duration-300 ${
          scrolled
            ? "bg-primary text-primary-foreground border-b border-primary/20 shadow-md"
            : isHomePage
              ? "bg-transparent border-b border-transparent"
              : "bg-background/90 backdrop-blur-md border-b border-border text-foreground"
        }`}
      >
        {/* Top micro-header — desktop only */}
        <div
          className={`border-b transition-all duration-300 py-1.5 px-6 hidden sm:block ${
            scrolled
              ? "bg-[#14233e]/50 border-primary/20 text-white/60"
              : isHomePage
                ? "bg-[#1d3a6c]/5 border-b border-transparent text-[#1d3a6c]/60"
                : "bg-muted/50 border-b border-border/40 text-muted-foreground"
          }`}
        >
          <div className="w-[90%] md:w-[80%] mx-auto flex justify-end gap-6 text-[11px] font-medium">
            <Link
              to="/entreprises"
              className={`transition-colors ${scrolled ? "text-white/70 hover:text-white" : "hover:text-primary"}`}
            >
              Nos Entreprises Partenaires
            </Link>
            <Link
              to="/offres"
              className={`transition-colors ${scrolled ? "text-white/70 hover:text-white" : "hover:text-primary"}`}
            >
              Toutes les Offres
            </Link>
            <Link
              to="/contact"
              className={`transition-colors ${scrolled ? "text-white/70 hover:text-white" : "hover:text-primary"}`}
            >
              Nous Contacter
            </Link>
          </div>
        </div>

        <div className="w-[90%] md:w-[80%] mx-auto h-20 sm:h-26 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group relative -top-0.5 sm:top-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src="/logo.png"
              alt="Kolori RH"
              className={`h-[60px] sm:h-20 object-contain transition-all duration-300 group-hover:scale-105 ${
                scrolled ? "brightness-0 invert" : ""
              }`}
            />
          </Link>

          {/* Desktop nav links */}
          <div
            className={`hidden lg:flex gap-8 text-sm font-semibold transition-colors duration-300 ${
              scrolled ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            <Link
              to="/offres"
              className={`transition-colors relative py-2 ${scrolled ? "hover:text-white" : "hover:text-foreground"}`}
              activeProps={{
                className: scrolled
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white"
                  : "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary",
              }}
            >
              Offres d'emploi
            </Link>
            <Link
              to="/entreprises"
              className={`transition-colors relative py-2 ${scrolled ? "hover:text-white" : "hover:text-foreground"}`}
              activeProps={{
                className: scrolled
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white"
                  : "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary",
              }}
            >
              Entreprises
            </Link>
            <Link
              to="/a-propos"
              className={`transition-colors relative py-2 ${scrolled ? "hover:text-white" : "hover:text-foreground"}`}
              activeProps={{
                className: scrolled
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white"
                  : "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary",
              }}
            >
              À propos
            </Link>
            <Link
              to="/contact"
              className={`transition-colors relative py-2 ${scrolled ? "hover:text-white" : "hover:text-foreground"}`}
              activeProps={{
                className: scrolled
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white"
                  : "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary",
              }}
            >
              Contact
            </Link>
          </div>

          {/* Desktop right actions */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`relative p-2 rounded-full h-10 w-10 border transition-all ${
                        scrolled
                          ? "border-white/20 hover:bg-white/10 text-white"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <Bell className="h-4.5 w-4.5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full ring-2 ring-background animate-pulse" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-80 max-h-[85vh] overflow-y-auto rounded-xl shadow-lg border border-border p-1"
                  >
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <span className="font-semibold text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="h-7 px-2 text-[10px] font-mono uppercase tracking-widest text-primary"
                        >
                          Tout lire
                        </Button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground font-mono">
                        Aucune notification.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {notifications.map((n) => (
                          <DropdownMenuItem
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 flex flex-col items-start gap-1 cursor-pointer focus:bg-secondary/20 ${!n.lu ? "bg-primary/5 font-medium" : ""}`}
                          >
                            <div className="flex items-start justify-between w-full gap-2">
                              <span className="text-xs font-semibold text-foreground leading-tight">
                                {n.titre}
                              </span>
                              {!n.lu && (
                                <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-1" />
                              )}
                            </div>
                            {n.message && (
                              <p className="text-[11px] text-muted-foreground leading-snug">
                                {n.message}
                              </p>
                            )}
                            <span className="text-[9px] font-mono text-muted-foreground mt-1 block">
                              {new Date(n.created_at).toLocaleDateString("fr-FR")} à{" "}
                              {new Date(n.created_at).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-2 rounded-full border px-4 py-2 h-10 transition-all ${
                        scrolled ? "border-white/20 hover:bg-white/10 text-white" : "border-border"
                      }`}
                    >
                      <UserIcon className={`h-4 w-4 ${scrolled ? "text-white" : "text-primary"}`} />
                      <span className="hidden sm:inline text-sm font-semibold">{user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <DropdownMenuItem
                      onClick={() => navigate({ to: dashboardPath })}
                      className="font-semibold"
                    >
                      Mon espace
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await signOut();
                        navigate({ to: "/" });
                      }}
                      className="text-primary focus:text-primary"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link
                to="/connexion"
                className={`text-sm font-semibold px-6 py-2.5 rounded-full border transition-colors ${
                  scrolled
                    ? "border-white/30 text-white hover:bg-white/10"
                    : "border-border hover:bg-secondary"
                }`}
              >
                Connexion / Inscription
              </Link>
            )}
          </div>

          {/* Mobile: hamburger button */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className={`lg:hidden p-3 rounded-full border shadow-sm transition-all duration-300 cursor-pointer ${
              scrolled
                ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                : "border-border bg-white text-foreground hover:bg-neutral-50"
            }`}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <div className="w-5 h-4 flex flex-col justify-between items-center group/hamburger">
              <span className="w-5 h-0.5 bg-current rounded-full transition-all duration-300" />
              <span className="w-5 h-0.5 bg-current rounded-full transition-all duration-300" />
              <span className="w-5 h-0.5 bg-current rounded-full transition-all duration-300" />
            </div>
          </button>
        </div>
      </nav>

      {/* ── Mobile menu Drawer (Slides from Right to Left) ─────────────────── */}
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/45 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Slide-in Menu Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-gradient-to-b from-[#1d3a6c] to-[#122342] text-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="h-10">
            <img src="/logo.png" alt="Kolori RH" className="h-full object-contain brightness-0 invert" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2.5 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Links */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-3">
          {[
            { to: "/offres", label: "Offres d'emploi", icon: Briefcase },
            { to: "/entreprises", label: "Entreprises", icon: Building2 },
            { to: "/contact", label: "Contact", icon: Phone },
            { to: "/a-propos", label: "À propos", icon: Info },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-semibold text-white/85 hover:bg-white/5 active:bg-white/10 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-4">
                  <Icon className="h-4.5 w-4.5 text-[#f87171] group-hover:scale-110 transition-transform" />
                  <span>{link.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/75 group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>

        {/* Drawer Auth Actions */}
        <div className="p-5 border-t border-white/10 bg-[#142646]/50 flex flex-col gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white text-[#1d3a6c] text-sm font-bold shadow-md hover:bg-neutral-100 transition-all"
              >
                <UserIcon className="h-4 w-4" /> Mon espace
              </Link>
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            </>
          ) : (
            <Link
              to="/connexion"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center px-4 py-3.5 rounded-xl bg-white text-[#1d3a6c] text-sm font-bold shadow-md hover:bg-neutral-100 transition-all"
            >
              Connexion / Inscription
            </Link>
          )}
          
          <div className="text-[10px] text-white/30 text-center font-mono mt-2 uppercase tracking-wider">
            Kolori RH — Abidjan, Côte d'Ivoire
          </div>
        </div>
      </div>
    </>
  );
}
