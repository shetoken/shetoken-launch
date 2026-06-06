import { Link } from "react-router-dom";
import logo from "@/assets/she-logo.svg";
import { STATUS_RIBBON } from "@/config/site";

/* Global footer — rendered on every route (App.tsx) so the status ribbon,
   naming key and independence disclaimer appear site-wide
   (Phase 2.1 Task 6c + Phase 3 Task 7). */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      {/* Status ribbon (Phase 3 Task 7) — phase number from one config constant */}
      <div className="border-b border-border/40 bg-card/30">
        <p className="container py-2.5 text-center text-[11px] md:text-xs text-muted-foreground">{STATUS_RIBBON}</p>
      </div>
      <div className="py-12">
      {/* Naming key */}
      <div className="container mb-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-border/40 bg-card/30 px-5 py-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-center gap-x-6 gap-y-1.5 text-center">
          <span><span className="font-semibold text-foreground">SHE Score</span> — the index (0–100, per country/state)</span>
          <span className="hidden sm:inline text-border">·</span>
          <span><span className="font-semibold text-accent">$SHE</span> — the token that tracks it</span>
          <span className="hidden sm:inline text-border">·</span>
          <span><span className="font-semibold text-foreground">SHE Foundation</span> — the publisher</span>
        </div>
      </div>

      <div className="container flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src={logo} alt="SHEtoken coin logo" className="h-6 w-6 rounded-full object-cover" />
          <span>© 2026 SHE Foundation · shetoken.org</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
          <Link to="/dashboard" className="hover:text-foreground transition-smooth">Dashboard</Link>
          <Link to="/lab" className="hover:text-foreground transition-smooth">The Lab</Link>
          <Link to="/index-landscape" className="hover:text-foreground transition-smooth">The Landscape</Link>
          <Link to="/methodology" className="hover:text-foreground transition-smooth">Methodology</Link>
          <Link to="/whitepaper" className="hover:text-foreground transition-smooth">Whitepaper</Link>
          <Link to="/why-back-she" className="hover:text-foreground transition-smooth">Why Back SHE</Link>
          <Link to="/simulator" className="hover:text-foreground transition-smooth">Simulator</Link>
          <Link to="/why" className="hover:text-foreground transition-smooth">Why $SHE</Link>
          <Link to="/petition" className="hover:text-foreground transition-smooth">Petition</Link>
          <Link to="/marketplace" className="hover:text-foreground transition-smooth">SHEconomy</Link>
          <Link to="/community" className="hover:text-foreground transition-smooth">Community</Link>
          <Link to="/privacy" className="hover:text-foreground transition-smooth">Privacy</Link>
          <a href="mailto:contact@shetoken.org" className="hover:text-foreground transition-smooth">Contact</a>
        </div>
      </div>

      {/* Independence disclaimer */}
      <div className="container mt-8">
        <p className="mx-auto max-w-3xl text-center text-[11px] text-muted-foreground/60 leading-relaxed">
          The SHE Score is an independent project and is not affiliated with, endorsed by, or derived from the
          UNDP/UN Women Women's Empowerment Index, the SHE Index powered by EY, or any other index referenced on this site.
        </p>
      </div>
      </div>
    </footer>
  );
}
