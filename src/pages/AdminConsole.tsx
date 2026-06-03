import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Lock, Globe, Users, Download, Activity, Clock, FileText, Eye, BarChart3 } from "lucide-react";

interface EventRow { session_id: string | null; user_id: string | null; path: string | null; country: string | null; city: string | null; created_at: string; }
interface ProfileRow { id: string; email: string | null; display_name: string | null; region: string | null; created_at: string; }
interface DownloadRow { id: string; doc_type: string; doc_ref: string | null; user_email: string | null; country: string | null; city: string | null; created_at: string; }

const TABS = ["overview", "users", "engagement", "downloads"] as const;
type Tab = typeof TABS[number];

const tally = <T,>(arr: T[], key: (r: T) => string | null | undefined): [string, number][] => {
  const m = new Map<string, number>();
  arr.forEach((r) => { const k = key(r) || "—"; m.set(k, (m.get(k) ?? 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const fmtDur = (min: number) => (min >= 60 ? `${(min / 60).toFixed(1)}h` : min >= 1 ? `${Math.round(min)}m` : `${Math.round(min * 60)}s`);

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon} {label}</div>
      <div className="text-3xl font-bold">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
function RankTable({ title, rows, icon }: { title: string; rows: [string, number][]; icon?: React.ReactNode }) {
  const max = rows.length ? rows[0][1] : 1;
  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">{icon} {title}</h3>
      <div className="space-y-2">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
        {rows.map(([label, count]) => (
          <div key={label} className="text-xs">
            <div className="flex justify-between mb-0.5"><span className="truncate pr-2">{label}</span><span className="font-semibold tabular-nums">{count}</span></div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${(count / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminConsole() {
  const { user, profile, loading: authLoading, openAuth } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get("tab") as Tab) ? params.get("tab") : "overview") as Tab;

  const events = useQuery({
    queryKey: ["admin-events"], enabled: isAdmin, staleTime: 60_000,
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase.from("she_events").select("session_id,user_id,path,country,city,created_at").order("created_at", { ascending: false }).limit(8000);
      if (error) throw error; return (data ?? []) as EventRow[];
    },
  });
  const profiles = useQuery({
    queryKey: ["admin-profiles"], enabled: isAdmin, staleTime: 60_000,
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase.from("she_profiles").select("id,email,display_name,region,created_at").order("created_at", { ascending: false }).limit(5000);
      if (error) throw error; return (data ?? []) as ProfileRow[];
    },
  });
  const downloads = useQuery({
    queryKey: ["admin-downloads"], enabled: isAdmin, staleTime: 60_000,
    queryFn: async (): Promise<DownloadRow[]> => {
      const { data, error } = await supabase.from("she_downloads").select("id,doc_type,doc_ref,user_email,country,city,created_at").order("created_at", { ascending: false }).limit(2000);
      if (error) throw error; return (data ?? []) as DownloadRow[];
    },
  });

  const ev = events.data ?? [], pf = profiles.data ?? [], dl = downloads.data ?? [];

  const stats = useMemo(() => {
    const sessions = new Map<string, { min: number; max: number; n: number }>();
    ev.forEach((e) => {
      const id = e.session_id || "?"; const t = new Date(e.created_at).getTime();
      const s = sessions.get(id) ?? { min: t, max: t, n: 0 };
      s.min = Math.min(s.min, t); s.max = Math.max(s.max, t); s.n++; sessions.set(id, s);
    });
    const durs = [...sessions.values()].filter((s) => s.n > 1).map((s) => (s.max - s.min) / 60000);
    const avgMin = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;
    // last 14 days pageviews
    const days: { label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = d.getTime() + 86400000;
      const count = ev.filter((e) => { const t = new Date(e.created_at).getTime(); return t >= d.getTime() && t < next; }).length;
      days.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count });
    }
    return {
      totalUsers: pf.length,
      totalSessions: sessions.size,
      totalPageviews: ev.length,
      totalDownloads: dl.length,
      avgMin,
      days,
      byCountry: tally(ev, (e) => e.country).slice(0, 12),
      topPages: tally(ev, (e) => e.path).slice(0, 12),
      byRegion: tally(pf, (p) => p.region).slice(0, 12),
      dlByCountry: tally(dl, (d) => d.country).slice(0, 10),
      dlByUser: tally(dl, (d) => d.user_email).slice(0, 10),
      dlByDoc: tally(dl, (d) => (d.doc_type === "whitepaper" ? "Whitepaper" : `Country · ${d.doc_ref ?? "?"}`)).slice(0, 10),
    };
  }, [ev, pf, dl]);

  const maxDay = Math.max(1, ...stats.days.map((d) => d.count));
  const loading = events.isLoading || profiles.isLoading || downloads.isLoading;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-24 pb-20 container max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-accent" />
          <h1 className="text-3xl font-bold">Admin Console</h1>
        </div>

        {authLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !user ? (
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-8 text-center shadow-card">
            <Lock className="h-6 w-6 text-accent mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Sign in with an admin account to view the console.</p>
            <Button onClick={() => openAuth("signin")} className="bg-gradient-primary text-primary-foreground border-0">Sign in</Button>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-8 text-center shadow-card">
            <Lock className="h-6 w-6 text-red-400 mx-auto mb-3" />
            <p className="font-semibold mb-1">Not authorized</p>
            <p className="text-sm text-muted-foreground">Admin-only. Signed in as <span className="text-foreground">{user.email}</span>.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-border/40">
              {TABS.map((t) => (
                <button key={t} onClick={() => setParams({ tab: t })}
                  className={`px-4 py-2 text-sm capitalize transition-smooth border-b-2 -mb-px ${tab === t ? "border-accent text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>

            {loading ? <p className="text-muted-foreground">Loading data…</p> : (
              <>
                {/* OVERVIEW */}
                {tab === "overview" && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Users" value={stats.totalUsers} />
                      <StatCard icon={<Activity className="h-3.5 w-3.5" />} label="Sessions" value={stats.totalSessions} />
                      <StatCard icon={<Eye className="h-3.5 w-3.5" />} label="Page views" value={stats.totalPageviews} />
                      <StatCard icon={<Clock className="h-3.5 w-3.5" />} label="Avg. session" value={fmtDur(stats.avgMin)} />
                      <StatCard icon={<Download className="h-3.5 w-3.5" />} label="Downloads" value={stats.totalDownloads} />
                    </div>
                    {/* daily activity */}
                    <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
                      <h3 className="text-sm font-semibold mb-4">Page views — last 14 days</h3>
                      <div className="flex items-end gap-1.5 h-28">
                        {stats.days.map((d) => (
                          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full bg-accent/80 rounded-t" style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 2 : 0 }} title={`${d.label}: ${d.count}`} />
                            <span className="text-[8px] text-muted-foreground rotate-0">{d.label.split(" ")[1]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-4">
                      <RankTable title="Visitors by country" rows={stats.byCountry} icon={<Globe className="h-3.5 w-3.5 text-accent" />} />
                      <RankTable title="Top pages" rows={stats.topPages} icon={<Eye className="h-3.5 w-3.5 text-accent" />} />
                    </div>
                  </div>
                )}

                {/* USERS */}
                {tab === "users" && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Total users" value={stats.totalUsers} />
                      <StatCard icon={<Globe className="h-3.5 w-3.5" />} label="Regions" value={stats.byRegion.length} />
                      <StatCard icon={<Activity className="h-3.5 w-3.5" />} label="Sessions" value={stats.totalSessions} />
                    </div>
                    <RankTable title="Users by region" rows={stats.byRegion} icon={<Globe className="h-3.5 w-3.5 text-accent" />} />
                    <div className="rounded-2xl border border-border/40 bg-gradient-card shadow-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-border/40"><h3 className="text-sm font-semibold">Recent sign-ups</h3></div>
                      <div className="overflow-x-auto"><table className="w-full text-xs">
                        <thead className="bg-card/60 text-muted-foreground"><tr>{["Joined", "Name", "Email", "Region"].map((h) => <th key={h} className="text-left px-4 py-2 font-medium">{h}</th>)}</tr></thead>
                        <tbody>
                          {pf.slice(0, 100).map((p) => (
                            <tr key={p.id} className="border-t border-border/20">
                              <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-2">{p.display_name ?? "—"}</td>
                              <td className="px-4 py-2 truncate max-w-[200px]">{p.email ?? "—"}</td>
                              <td className="px-4 py-2">{p.region ?? "—"}</td>
                            </tr>
                          ))}
                          {pf.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No users yet.</td></tr>}
                        </tbody>
                      </table></div>
                    </div>
                  </div>
                )}

                {/* ENGAGEMENT */}
                {tab === "engagement" && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <StatCard icon={<Clock className="h-3.5 w-3.5" />} label="Avg. session time" value={fmtDur(stats.avgMin)} sub="sessions with 2+ views" />
                      <StatCard icon={<Eye className="h-3.5 w-3.5" />} label="Page views" value={stats.totalPageviews} />
                      <StatCard icon={<Activity className="h-3.5 w-3.5" />} label="Views / session" value={(stats.totalSessions ? stats.totalPageviews / stats.totalSessions : 0).toFixed(1)} />
                    </div>
                    <div className="grid lg:grid-cols-2 gap-4">
                      <RankTable title="Top pages" rows={stats.topPages} icon={<Eye className="h-3.5 w-3.5 text-accent" />} />
                      <RankTable title="Visitors by country" rows={stats.byCountry} icon={<Globe className="h-3.5 w-3.5 text-accent" />} />
                    </div>
                  </div>
                )}

                {/* DOWNLOADS */}
                {tab === "downloads" && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <StatCard icon={<Download className="h-3.5 w-3.5" />} label="Total downloads" value={stats.totalDownloads} />
                      <StatCard icon={<Globe className="h-3.5 w-3.5" />} label="Countries" value={stats.dlByCountry.length} />
                      <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Unique downloaders" value={stats.dlByUser.length} />
                    </div>
                    <div className="grid lg:grid-cols-3 gap-4">
                      <RankTable title="By country" rows={stats.dlByCountry} icon={<Globe className="h-3.5 w-3.5 text-accent" />} />
                      <RankTable title="By user" rows={stats.dlByUser} icon={<Users className="h-3.5 w-3.5 text-accent" />} />
                      <RankTable title="By document" rows={stats.dlByDoc} icon={<FileText className="h-3.5 w-3.5 text-accent" />} />
                    </div>
                    <div className="rounded-2xl border border-border/40 bg-gradient-card shadow-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-border/40"><h3 className="text-sm font-semibold">Recent downloads</h3></div>
                      <div className="overflow-x-auto"><table className="w-full text-xs">
                        <thead className="bg-card/60 text-muted-foreground"><tr>{["When", "User", "Document", "Country", "City"].map((h) => <th key={h} className="text-left px-4 py-2 font-medium">{h}</th>)}</tr></thead>
                        <tbody>
                          {dl.slice(0, 100).map((r) => (
                            <tr key={r.id} className="border-t border-border/20">
                              <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                              <td className="px-4 py-2 truncate max-w-[180px]">{r.user_email ?? "—"}</td>
                              <td className="px-4 py-2">{r.doc_type === "whitepaper" ? "Whitepaper" : `Country · ${r.doc_ref ?? "?"}`}</td>
                              <td className="px-4 py-2">{r.country ?? "—"}</td>
                              <td className="px-4 py-2">{r.city ?? "—"}</td>
                            </tr>
                          ))}
                          {dl.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No downloads yet.</td></tr>}
                        </tbody>
                      </table></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
