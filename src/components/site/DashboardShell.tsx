import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  User,
  FileText,
  CheckSquare,
  Briefcase,
  Building2,
  Settings,
  Heart,
  Users,
  Compass,
  Search,
  Bell,
  X,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";

// ─── Icon helper ────────────────────────────────────────────────────────────
function getNavIcon(to: string, cls = "h-5 w-5 shrink-0") {
  if (to === "/candidat" || to === "/recruteur" || to === "/admin")
    return <LayoutDashboard className={cls} />;
  if (to.includes("/profil")) return <User className={cls} />;
  if (to.includes("/cv") && !to.includes("/cvtheque")) return <FileText className={cls} />;
  if (to.includes("/candidatures")) return <CheckSquare className={cls} />;
  if (to.includes("/offres") && !to.includes("/admin/offres")) return <Briefcase className={cls} />;
  if (to.includes("/entreprise") || to.includes("/entreprises"))
    return <Building2 className={cls} />;
  if (to.includes("/cvtheque")) return <Compass className={cls} />;
  if (to.includes("/favoris")) return <Heart className={cls} />;
  if (to.includes("/utilisateurs")) return <Users className={cls} />;
  if (to.includes("/referentiels")) return <Settings className={cls} />;
  return <Briefcase className={cls} />;
}

// Short label for the bottom nav pills
const SHORT_LABELS: Record<string, string> = {
  "Tableau de bord": "Accueil",
  "Mon profil": "Profil",
  "Mes CV": "CV",
  "Mes candidatures": "Candidatures",
  "Candidatures reçues": "Dossiers",
  "Parcourir les offres": "Offres",
  "Mon entreprise": "Entreprise",
  "Mes offres": "Offres",
  CVthèque: "CVthèque",
  "Voir les offres publiques": "Explorer",
  Utilisateurs: "Utilisateurs",
  Entreprises: "Entreprises",
  Référentiels: "Réf.",
};
function shortLabel(label: string) {
  return SHORT_LABELS[label] ?? label.split(" ").slice(0, 2).join(" ");
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
  to: string;
  label: string;
}

// ────────────────────────────────────────────────────────────────────────────
export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const { user, roles, signOut } = useAuth();
  const safeRoles = roles || [];
  const navigate = useNavigate();
  const { location } = useRouterState();

  const [displayNameState, setDisplayNameState] = useState("");
  const [photoUrlState, setPhotoUrlState] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<
    Array<{ id: string; text: string; time: string; read: boolean }>
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mobile "More" sheet
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // ── Notifications seed ──────────────────────────────────────────────────
  useEffect(() => {
    let list: typeof notifications = [];
    if (safeRoles.includes("admin")) {
      list = [
        {
          id: "a1",
          text: "Nouvelle demande de modération : Afriq Agro Industries",
          time: "Il y a 15 min",
          read: false,
        },
        {
          id: "a2",
          text: "Offre signalée pour contenu non-conforme",
          time: "Il y a 2 h",
          read: false,
        },
        { id: "a3", text: "Rapport d'activité mensuel généré", time: "Il y a 1 jour", read: true },
      ];
    } else if (safeRoles.includes("recruteur")) {
      list = [
        {
          id: "r1",
          text: "Nouvelle candidature reçue pour le poste de Directeur des RH",
          time: "Il y a 10 min",
          read: false,
        },
        {
          id: "r2",
          text: "Votre entreprise a été validée par l'administrateur",
          time: "Il y a 3 h",
          read: false,
        },
        {
          id: "r3",
          text: "Le profil de Jean Koffi a été mis à jour",
          time: "Il y a 1 jour",
          read: true,
        },
      ];
    } else {
      list = [
        {
          id: "c1",
          text: "Nouvelle offre correspond à votre profil (Orange CI)",
          time: "Il y a 5 min",
          read: false,
        },
        {
          id: "c2",
          text: "Votre candidature pour Comptable a été consultée",
          time: "Il y a 4 h",
          read: false,
        },
        {
          id: "c3",
          text: "Entretien planifié le 15 Juin à 14h00",
          time: "Il y a 2 jours",
          read: true,
        },
      ];
    }
    setNotifications(list);
  }, [roles]);

  // ── Search logic ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    if (safeRoles.includes("admin")) {
      import("@/lib/mockData").then(({ getMockCompanies }) => {
        setSearchResults(
          getMockCompanies()
            .filter(
              (c) => c.nom.toLowerCase().includes(q) || (c.secteur ?? "").toLowerCase().includes(q),
            )
            .slice(0, 5)
            .map((c) => ({
              id: c.id,
              title: c.nom,
              subtitle: c.secteur ?? "Entreprise",
              to: "/admin/entreprises",
            })),
        );
      });
    } else {
      import("@/lib/mockData").then(({ getMockJobOffers }) => {
        setSearchResults(
          getMockJobOffers()
            .filter(
              (o) => o.titre.toLowerCase().includes(q) || o.description.toLowerCase().includes(q),
            )
            .slice(0, 5)
            .map((o) => ({
              id: o.id,
              title: o.titre,
              subtitle: `${o.contrat} • ${o.localisation ?? "Abidjan"}`,
              to: safeRoles.includes("recruteur") ? "/recruteur/offres" : "/offres/$offerId",
            })),
        );
      });
    }
  }, [searchQuery, roles]);

  const searchPlaceholder = safeRoles.includes("admin")
    ? "Rechercher une entreprise..."
    : safeRoles.includes("recruteur")
      ? "Rechercher une offre..."
      : "Rechercher un poste, un domaine...";

  // ── Profile load ─────────────────────────────────────────────────────────
  const loadProfile = () => {
    if (!user) return;
    if (user.id.startsWith("mock-")) {
      import("@/lib/mockData").then(({ getMockUsers }) => {
        const found = getMockUsers().find((u) => u.id === user.id);
        if (found) {
          if (user.id === "mock-candidate-1") {
            setDisplayNameState(
              `${localStorage.getItem("mock_candidate_prenom") || found.prenom} ${localStorage.getItem("mock_candidate_nom") || found.nom}`,
            );
            setPhotoUrlState(localStorage.getItem("mock_candidate_photo"));
          } else if (user.id === "mock-recruiter-1") {
            setDisplayNameState(`${found.prenom} ${found.nom}`);
            setPhotoUrlState(localStorage.getItem("mock_recruiter_logo"));
          } else {
            setDisplayNameState(`${found.prenom} ${found.nom}`);
          }
        } else {
          setDisplayNameState(user.email ?? "Utilisateur Démo");
        }
      });
    } else {
      supabase
        .from("profiles")
        .select("prenom, nom, photo_url")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setDisplayNameState(
              `${data.prenom ?? ""} ${data.nom ?? ""}`.trim() || user.email || "Utilisateur",
            );
            if (data.photo_url) {
              setPhotoUrlState(data.photo_url);
            } else if (safeRoles.includes("recruteur")) {
              supabase
                .from("companies")
                .select("logo_url")
                .eq("owner_id", user.id)
                .maybeSingle()
                .then(({ data: comp }) => {
                  if (comp?.logo_url) setPhotoUrlState(comp.logo_url);
                });
            }
          } else {
            setDisplayNameState(user.email ?? "Utilisateur");
          }
        });
    }
  };

  useEffect(() => {
    loadProfile();
    window.addEventListener("profile-updated", loadProfile);
    return () => window.removeEventListener("profile-updated", loadProfile);
  }, [user, roles]);

  const userRoleLabel = safeRoles.includes("admin")
    ? "Administrateur"
    : safeRoles.includes("recruteur")
      ? "Recruteur"
      : "Candidat";
  const initials = displayNameState
    ? displayNameState
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "UR";
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Active check ─────────────────────────────────────────────────────────
  function isActive(item: NavItem) {
    const isRoot = item.to === "/admin" || item.to === "/recruteur" || item.to === "/candidat";
    return isRoot
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(item.to + "/");
  }

  // ── Bottom nav: first 4 items are shown directly, rest go into "Plus" ───
  const BOTTOM_VISIBLE = 4;
  const bottomMain = nav.slice(0, BOTTOM_VISIBLE);
  const bottomMore = nav.slice(BOTTOM_VISIBLE);
  const hasMore = bottomMore.length > 0;

  // ── Search result link helper ────────────────────────────────────────────
  function SearchResultItem({ res }: { res: any }) {
    const isDetail = res.to.includes("offerId");
    if (isDetail) {
      return (
        <Link
          to="/offres/$offerId"
          params={{ offerId: res.id }}
          onClick={() => {
            setShowSearchResults(false);
            setSearchQuery("");
            setMobileSearchOpen(false);
          }}
          className="block px-4 py-2.5 hover:bg-slate-50 transition-colors"
        >
          <div className="text-xs font-bold text-foreground">{res.title}</div>
          <div className="text-[10px] text-muted-foreground">{res.subtitle}</div>
        </Link>
      );
    }
    return (
      <Link
        to={res.to}
        onClick={() => {
          setShowSearchResults(false);
          setSearchQuery("");
          setMobileSearchOpen(false);
        }}
        className="block px-4 py-2.5 hover:bg-slate-50 transition-colors"
      >
        <div className="text-xs font-bold text-foreground">{res.title}</div>
        <div className="text-[10px] text-muted-foreground">{res.subtitle}</div>
      </Link>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT  (md and up)
          Sidebar left + content right
      ══════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex min-h-screen bg-[#f8fafc] p-4 gap-6 font-sans">
        {/* Sidebar */}
        <aside className="w-[260px] bg-primary text-white rounded-3xl p-6 flex flex-col justify-between shrink-0 h-[calc(100vh-2rem)] sticky top-4 shadow-lg border border-primary/20">
          <div>
            {/* Logo */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
              <Link to="/" className="flex items-center gap-2 group">
                <img
                  src="/logo.png"
                  alt="Kolori RH"
                  className="h-16 object-contain brightness-0 invert"
                />
              </Link>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-5">
              {title}
            </div>
            {/* Nav links */}
            <nav className="flex flex-col gap-2">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-4 py-3 text-xs uppercase tracking-wider font-semibold rounded-2xl flex items-center gap-3 transition-all ${
                    isActive(n)
                      ? "bg-accent text-white font-bold shadow-md shadow-accent/20 scale-[1.02]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {getNavIcon(n.to)}
                  <span>{n.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          {/* Footer */}
          <div className="border-t border-white/10 pt-4 mt-6">
            <div className="flex items-center gap-3 mb-4">
              {photoUrlState ? (
                <img
                  src={photoUrlState}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{displayNameState}</div>
                <div className="text-[10px] text-white/60 truncate font-mono uppercase tracking-wider">
                  {userRoleLabel}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 rounded-xl py-2 px-3 text-xs uppercase tracking-wider font-bold"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4 mr-2 text-white/70" /> Déconnexion
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {(showSearchResults || showNotifications) && (
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => {
                setShowSearchResults(false);
                setShowNotifications(false);
              }}
            />
          )}
          {/* Desktop top bar */}
          <header className="bg-white border border-border/60 rounded-3xl px-6 py-4 flex items-center justify-between gap-4 mb-6 shadow-sm relative z-50">
            <div className="relative w-full md:w-80 z-50">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60 text-black font-medium"
              />
              {showSearchResults && searchQuery.trim() && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-xl py-2 max-h-60 overflow-y-auto z-50 animate-reveal">
                  <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-slate-50 mb-1">
                    Résultats
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground">
                      Aucun résultat pour "{searchQuery}"
                    </div>
                  ) : (
                    searchResults.map((res) => <SearchResultItem key={res.id} res={res} />)
                  )}
                </div>
              )}
            </div>
            {/* Notifications */}
            <div className="relative z-50">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-slate-50 rounded-full focus:outline-none"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-accent rounded-full border border-white animate-pulse" />
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-2xl shadow-xl py-2 z-50 animate-reveal">
                  <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() =>
                          setNotifications(notifications.map((n) => ({ ...n, read: true })))
                        }
                        className="text-[10px] font-bold text-accent hover:underline"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() =>
                          setNotifications(
                            notifications.map((item) =>
                              item.id === n.id ? { ...item, read: true } : item,
                            ),
                          )
                        }
                        className={`px-4 py-3 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-3 ${!n.read ? "bg-slate-50/30" : ""}`}
                      >
                        {!n.read && (
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs leading-normal ${!n.read ? "font-bold text-foreground" : "text-muted-foreground font-medium"}`}
                          >
                            {n.text}
                          </p>
                          <span className="text-[9px] text-muted-foreground/80 mt-1 block font-mono">
                            {n.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 bg-white border border-border/60 rounded-3xl p-6 md:p-8 shadow-sm">
            {children}
          </main>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (< md)
          Compact top header + scrollable content + fixed bottom nav
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex md:hidden flex-col min-h-svh bg-[#f4f6f9] font-sans">
        {/* ── Mobile top header ─────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-50 bg-primary text-white px-4 flex items-center justify-between gap-3 shadow-lg"
          style={{ height: 56, paddingTop: "env(safe-area-inset-top)" }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="Kolori RH"
              className="h-9 object-contain brightness-0 invert"
            />
          </Link>

          {/* Page title */}
          <span className="text-[11px] font-mono uppercase tracking-widest text-white/60 flex-1 text-center truncate">
            {title}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Search toggle */}
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" />
            </button>
            {/* Bell */}
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent rounded-full border border-primary animate-pulse" />
              )}
            </button>
          </div>
        </header>

        {/* ── Mobile search bar (slide-down) ────────────────────────────── */}
        {mobileSearchOpen && (
          <div className="sticky top-14 z-40 bg-white border-b border-border shadow-sm px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {showSearchResults && searchQuery.trim() && (
              <div className="mt-2 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground">
                    Aucun résultat pour "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((res) => <SearchResultItem key={res.id} res={res} />)
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Mobile notification dropdown ──────────────────────────────── */}
        {showNotifications && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowNotifications(false)}
            />
            <div className="fixed top-14 right-4 left-4 z-50 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden animate-reveal">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() =>
                        setNotifications(notifications.map((n) => ({ ...n, read: true })))
                      }
                      className="text-[11px] font-bold text-accent"
                    >
                      Tout lire
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-muted-foreground p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setNotifications(
                        notifications.map((i) => (i.id === n.id ? { ...i, read: true } : i)),
                      );
                      setShowNotifications(false);
                    }}
                    className={`px-4 py-3 flex gap-3 active:bg-slate-50 cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs leading-normal ${!n.read ? "font-bold text-foreground" : "text-muted-foreground"}`}
                      >
                        {n.text}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70 mt-0.5 block font-mono">
                        {n.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Scrollable content ────────────────────────────────────────── */}
        <main
          className="flex-1 px-3 py-4 overflow-y-auto"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
        >
          {children}
        </main>

        {/* ── Fixed bottom navigation ───────────────────────────────────── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border/70 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-stretch justify-around h-16">
            {/* Main nav items */}
            {bottomMain.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 px-1 py-2 transition-colors relative"
                >
                  {/* Active indicator pill */}
                  {active && <span className="absolute top-2 h-1 w-8 rounded-full bg-primary" />}
                  <span
                    className={`transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {getNavIcon(
                      item.to,
                      `h-[22px] w-[22px] shrink-0 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`,
                    )}
                  </span>
                  <span
                    className={`text-[10px] font-semibold leading-tight text-center transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {shortLabel(item.label)}
                  </span>
                </Link>
              );
            })}

            {/* "More" button if there are extra nav items */}
            {hasMore && (
              <button
                onClick={() => setShowMoreSheet(true)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 px-1 py-2 text-muted-foreground transition-colors"
              >
                <MoreHorizontal className="h-[22px] w-[22px] stroke-[1.75]" />
                <span className="text-[10px] font-semibold">Plus</span>
              </button>
            )}
          </div>
        </nav>

        {/* ── "More" bottom sheet ───────────────────────────────────────── */}
        {showMoreSheet && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowMoreSheet(false)}
            />
            <div
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              {/* User info */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                {photoUrlState ? (
                  <img
                    src={photoUrlState}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">
                    {displayNameState}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                    {userRoleLabel}
                  </div>
                </div>
              </div>
              {/* Extra nav items */}
              <div className="py-2">
                {bottomMore.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setShowMoreSheet(false)}
                      className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${active ? "text-primary bg-primary/5" : "text-foreground hover:bg-slate-50 active:bg-slate-100"}`}
                    >
                      <span className={active ? "text-primary" : "text-muted-foreground"}>
                        {getNavIcon(item.to, "h-5 w-5 shrink-0")}
                      </span>
                      <span className="text-sm font-semibold flex-1">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    </Link>
                  );
                })}
              </div>
              {/* Logout */}
              <div className="border-t border-border mx-5 mt-1 pt-3 pb-4">
                <button
                  onClick={async () => {
                    setShowMoreSheet(false);
                    await signOut();
                    navigate({ to: "/" });
                  }}
                  className="flex items-center gap-3 w-full text-left px-0 py-2 text-sm font-semibold text-destructive"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
