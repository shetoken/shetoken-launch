import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, BarChart2, BookOpen, Download, FileText, FlaskConical, Layers, LogOut, User, Users } from "lucide-react";
import logo from "@/assets/she-logo.svg";

function UserAvatar({ name, email }: { name: string | null; email: string | null }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : (email?.[0] ?? "U").toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-gold">
      {initials}
    </div>
  );
}

export function Nav() {
  const { pathname } = useLocation();
  const { user, profile, signOut, openAuth } = useAuth();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <BarChart2 className="h-3.5 w-3.5" /> },
    { to: "/lab", label: "The Lab", icon: <FlaskConical className="h-3.5 w-3.5" /> },
    { to: "/index-landscape", label: "The Landscape", icon: <Layers className="h-3.5 w-3.5" /> },
    { to: "/methodology", label: "Methodology", icon: <BookOpen className="h-3.5 w-3.5" /> },
    { to: "/whitepaper", label: "Whitepaper", icon: <FileText className="h-3.5 w-3.5" /> },
    { to: "/community", label: "Community", icon: <Users className="h-3.5 w-3.5" /> },
  ];

  // Show "Work with us" only on home page nav
  const showWorkWithUs = pathname === "/";

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40">
      <nav className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <img src={logo} alt="SheToken logo" className="h-8 w-8 rounded-full object-cover" />
          <span className="text-gradient">SheToken</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {links.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`hover:text-foreground transition-smooth flex items-center gap-1 ${
                pathname === to ? "text-foreground font-medium" : ""
              }`}
            >
              {icon} {label}
            </Link>
          ))}
          {showWorkWithUs && (
            <a href="#join" className="hover:text-foreground transition-smooth">
              Work with us
            </a>
          )}
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-2">
          {user ? (
            /* ── Logged-in state ── */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-smooth outline-none">
                  <UserAvatar
                    name={profile?.display_name ?? user.user_metadata?.display_name ?? null}
                    email={user.email ?? null}
                  />
                  <span className="hidden md:block text-sm text-muted-foreground max-w-[120px] truncate">
                    {profile?.display_name ?? user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border-border/60">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">
                    {profile?.display_name ?? "My account"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" /> My profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <BarChart2 className="h-4 w-4 mr-2" /> Live Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/whitepaper" className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" /> Whitepaper
                  </Link>
                </DropdownMenuItem>
                {profile?.is_admin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Download className="h-4 w-4 mr-2" /> Admin Console
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-red-400 focus:text-red-400 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* ── Logged-out state ── */
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => openAuth("signin")}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="bg-gradient-primary text-primary-foreground border-0 shadow-gold hover:opacity-90"
                onClick={() => openAuth("signup")}
              >
                Join <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
