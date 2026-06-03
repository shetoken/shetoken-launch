import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Download, Lock, Globe, Users, FileText } from "lucide-react";

interface DownloadRow {
  id: string;
  doc_type: string;
  doc_ref: string | null;
  user_id: string | null;
  user_email: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  created_at: string;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon} {label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

function RankTable({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = rows.length ? rows[0][1] : 1;
  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-2">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
        {rows.map(([label, count]) => (
          <div key={label} className="text-xs">
            <div className="flex justify-between mb-0.5">
              <span className="truncate pr-2">{label || "—"}</span>
              <span className="font-semibold tabular-nums">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDownloads() {
  const { user, profile, loading: authLoading, openAuth } = useAuth();
  const isAdmin = !!profile?.is_admin;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-downloads"],
    enabled: isAdmin,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("she_downloads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as DownloadRow[];
    },
  });

  const agg = useMemo(() => {
    const tally = (key: (r: DownloadRow) => string | null) => {
      const m = new Map<string, number>();
      rows.forEach((r) => { const k = key(r) ?? "—"; m.set(k, (m.get(k) ?? 0) + 1); });
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    return {
      total: rows.length,
      countries: tally((r) => r.country).length,
      users: tally((r) => r.user_email).length,
      byCountry: tally((r) => r.country).slice(0, 12),
      byUser: tally((r) => r.user_email).slice(0, 12),
      byDoc: tally((r) => (r.doc_type === "whitepaper" ? "Whitepaper" : `Country: ${r.doc_ref ?? "?"}`)).slice(0, 12),
    };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-24 pb-20 container max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <Download className="h-6 w-6 text-accent" />
          <h1 className="text-3xl font-bold">Downloads</h1>
        </div>

        {authLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !user ? (
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-8 text-center shadow-card">
            <Lock className="h-6 w-6 text-accent mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Sign in with an admin account to view download analytics.</p>
            <Button onClick={() => openAuth("signin")} className="bg-gradient-primary text-primary-foreground border-0">Sign in</Button>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-8 text-center shadow-card">
            <Lock className="h-6 w-6 text-red-400 mx-auto mb-3" />
            <p className="font-semibold mb-1">Not authorized</p>
            <p className="text-sm text-muted-foreground">
              This page is admin-only. Signed in as <span className="text-foreground">{user.email}</span>.
            </p>
          </div>
        ) : isLoading ? (
          <p className="text-muted-foreground">Loading download data…</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <StatCard icon={<Download className="h-3.5 w-3.5" />} label="Total downloads" value={agg.total} />
              <StatCard icon={<Globe className="h-3.5 w-3.5" />} label="Countries" value={agg.countries} />
              <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Unique users" value={agg.users} />
            </div>

            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              <RankTable title="By country" rows={agg.byCountry} />
              <RankTable title="By user" rows={agg.byUser} />
              <RankTable title="By document" rows={agg.byDoc} />
            </div>

            <div className="rounded-2xl border border-border/40 bg-gradient-card shadow-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40">
                <FileText className="h-4 w-4 text-accent" /> <h3 className="text-sm font-semibold">Recent downloads</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-card/60 text-muted-foreground">
                    <tr>
                      {["When", "User", "Document", "Country", "City"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((r) => (
                      <tr key={r.id} className="border-t border-border/20">
                        <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 truncate max-w-[180px]">{r.user_email ?? "—"}</td>
                        <td className="px-4 py-2">{r.doc_type === "whitepaper" ? "Whitepaper" : `Country · ${r.doc_ref ?? "?"}`}</td>
                        <td className="px-4 py-2">{r.country ?? "—"}</td>
                        <td className="px-4 py-2">{r.city ?? "—"}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No downloads recorded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
