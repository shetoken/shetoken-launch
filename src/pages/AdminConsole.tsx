import { useMemo, useState, useRef, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { parseCsv } from "@/lib/csv";
import { Lock, Globe, Users, Download, Activity, Clock, FileText, Eye, BarChart3, Heart, Upload, Plus, HeartHandshake, CheckCircle2, GraduationCap } from "lucide-react";

interface EventRow { session_id: string | null; user_id: string | null; path: string | null; country: string | null; city: string | null; created_at: string; }
interface ProfileRow { id: string; email: string | null; display_name: string | null; region: string | null; created_at: string; }
interface DownloadRow { id: string; doc_type: string; doc_ref: string | null; user_email: string | null; country: string | null; city: string | null; created_at: string; }

const TABS = ["overview", "users", "engagement", "downloads", "partners", "drives", "ngos", "marketplace"] as const;
type Tab = typeof TABS[number];
const tabLabel = (t: Tab) => (t === "ngos" ? "NGOs" : t);
interface NgoRow { id: string; name: string; country: string | null; city: string | null; focus_area: string | null; website: string | null; contact_email: string | null; verified: boolean | null; created_at: string; }
interface BizRow { id: string; name: string; owner_name: string | null; category: string | null; country: string | null; city: string | null; status: string; created_at: string; }
interface PartnerRow { id: string; org_name: string; partner_type: string | null; contact_name: string | null; email: string | null; website: string | null; interests: string[] | null; regions: string[] | null; budget_band: string | null; status: string; created_at: string; }
interface DriveRow { id: string; drive_type: string; title: string; sponsor_name: string | null; country: string | null; region: string | null; seats: number | null; amount: number | null; currency: string | null; deadline: string | null; partner_ngo: string | null; contact_email: string | null; status: string; created_at: string; }
interface DriveAppRow { id: string; drive_id: string; applicant_name: string; applicant_email: string | null; region: string | null; is_nomination: boolean | null; nominator_name: string | null; status: string; created_at: string; }

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
  const ngos = useQuery({
    queryKey: ["admin-ngos"], enabled: isAdmin, staleTime: 30_000,
    queryFn: async (): Promise<NgoRow[]> => {
      const { data, error } = await supabase.from("she_ngos").select("*").order("created_at", { ascending: false }).limit(3000);
      if (error) throw error; return (data ?? []) as NgoRow[];
    },
  });
  const biz = useQuery({
    queryKey: ["admin-businesses"], enabled: isAdmin, staleTime: 30_000,
    queryFn: async (): Promise<BizRow[]> => {
      const { data, error } = await supabase.from("she_businesses").select("id,name,owner_name,category,country,city,status,created_at").order("created_at", { ascending: false }).limit(2000);
      if (error) throw error; return (data ?? []) as BizRow[];
    },
  });
  const partners = useQuery({
    queryKey: ["admin-partners"], enabled: isAdmin, staleTime: 30_000,
    queryFn: async (): Promise<PartnerRow[]> => {
      const { data, error } = await supabase.from("she_partners").select("*").order("created_at", { ascending: false }).limit(2000);
      if (error) throw error; return (data ?? []) as PartnerRow[];
    },
  });

  const drives = useQuery({
    queryKey: ["admin-drives"], enabled: isAdmin, staleTime: 30_000,
    queryFn: async (): Promise<DriveRow[]> => {
      const { data, error } = await supabase.from("she_drives").select("*").order("created_at", { ascending: false }).limit(2000);
      if (error) throw error; return (data ?? []) as DriveRow[];
    },
  });
  const driveApps = useQuery({
    queryKey: ["admin-drive-apps"], enabled: isAdmin, staleTime: 30_000,
    queryFn: async (): Promise<DriveAppRow[]> => {
      const { data, error } = await supabase.from("she_drive_applications").select("*").order("created_at", { ascending: false }).limit(5000);
      if (error) throw error; return (data ?? []) as DriveAppRow[];
    },
  });

  const ev = events.data ?? [], pf = profiles.data ?? [], dl = downloads.data ?? [], ng = ngos.data ?? [], bz = biz.data ?? [], pt = partners.data ?? [], dr = drives.data ?? [], da = driveApps.data ?? [];

  async function setBizStatus(id: string, status: string) {
    const { error } = await supabase.from("she_businesses").update({ status, verified: status === "approved" }).eq("id", id);
    if (error) toast.error("Could not update."); else { toast.success(`Marked ${status}.`); biz.refetch(); }
  }
  async function setPartnerStatus(id: string, status: string) {
    const { error } = await supabase.from("she_partners").update({ status }).eq("id", id);
    if (error) toast.error("Could not update."); else { toast.success(`Marked ${status}.`); partners.refetch(); }
  }
  async function setNgoVerified(id: string, verified: boolean) {
    const { error } = await supabase.from("she_ngos").update({ verified }).eq("id", id);
    if (error) toast.error("Could not update."); else { toast.success(verified ? "Verified." : "Unverified."); ngos.refetch(); }
  }
  async function setDriveStatus(id: string, status: string) {
    const { error } = await supabase.from("she_drives").update({ status }).eq("id", id);
    if (error) toast.error("Could not update."); else { toast.success(`Marked ${status}.`); drives.refetch(); }
  }
  async function setDriveAppStatus(id: string, status: string) {
    const { error } = await supabase.from("she_drive_applications").update({ status }).eq("id", id);
    if (error) toast.error("Could not update."); else { toast.success(`Marked ${status}.`); driveApps.refetch(); }
  }

  const [ngoForm, setNgoForm] = useState({ name: "", country: "", city: "", focus_area: "", website: "", contact_email: "" });
  const [savingNgo, setSavingNgo] = useState(false);
  const [openDrive, setOpenDrive] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addNgo(e: React.FormEvent) {
    e.preventDefault();
    if (!ngoForm.name.trim()) { toast.error("NGO name is required."); return; }
    setSavingNgo(true);
    try {
      const { error } = await supabase.from("she_ngos").insert({ ...ngoForm, name: ngoForm.name.trim(), verified: true });
      if (error) throw error;
      toast.success("NGO added.");
      setNgoForm({ name: "", country: "", city: "", focus_area: "", website: "", contact_email: "" });
      ngos.refetch();
    } catch (err) { console.warn(err); toast.error("Could not add NGO."); }
    finally { setSavingNgo(false); }
  }

  async function uploadCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      const mapped = rows.map((r) => ({
        name: r.name || r.ngo || r.organisation || r.organization || "",
        country: r.country || null, city: r.city || null,
        focus_area: r.focus_area || r.focus || r.area || null,
        website: r.website || r.url || null,
        contact_email: r.contact_email || r.email || r.contact || null,
        verified: true,
      })).filter((r) => r.name.trim());
      if (!mapped.length) { toast.error("CSV needs a 'name' column with at least one row."); return; }
      const { error } = await supabase.from("she_ngos").insert(mapped);
      if (error) throw error;
      toast.success(`Imported ${mapped.length} NGO${mapped.length === 1 ? "" : "s"}.`);
      ngos.refetch();
    } catch (err) { console.warn(err); toast.error("CSV import failed — check the format."); }
    finally { if (fileRef.current) fileRef.current.value = ""; }
  }

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
                  {tabLabel(t)}
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

                {/* PARTNERS */}
                {tab === "partners" && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <StatCard icon={<HeartHandshake className="h-3.5 w-3.5" />} label="Total partners" value={pt.length} />
                      <StatCard icon={<Clock className="h-3.5 w-3.5" />} label="Pending review" value={pt.filter((p) => p.status === "pending").length} />
                      <StatCard icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Verified" value={pt.filter((p) => p.status === "verified").length} />
                    </div>
                    <div className="grid lg:grid-cols-2 gap-4">
                      <RankTable title="By partner type" rows={tally(pt, (p) => p.partner_type)} icon={<HeartHandshake className="h-3.5 w-3.5 text-accent" />} />
                      <RankTable title="By region of interest" rows={tally(pt.flatMap((p) => (p.regions?.length ? p.regions : ["—"]).map((r) => ({ r }))), (x) => x.r)} icon={<Globe className="h-3.5 w-3.5 text-accent" />} />
                    </div>
                    <div className="rounded-2xl border border-border/40 bg-gradient-card shadow-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-accent" /><h3 className="text-sm font-semibold">Partners &amp; sponsors ({pt.length})</h3></div>
                      <div className="overflow-x-auto"><table className="w-full text-xs">
                        <thead className="bg-card/60 text-muted-foreground"><tr>{["Organisation", "Type", "Contact", "Interests", "Regions", "Support", "Status", "Action"].map((h) => <th key={h} className="text-left px-4 py-2 font-medium">{h}</th>)}</tr></thead>
                        <tbody>
                          {pt.map((p) => (
                            <tr key={p.id} className="border-t border-border/20 align-top">
                              <td className="px-4 py-2 font-medium">{p.org_name}{p.website && <a href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer" className="block text-accent hover:underline font-normal">{p.website}</a>}</td>
                              <td className="px-4 py-2">{p.partner_type ?? "—"}</td>
                              <td className="px-4 py-2">{p.contact_name ?? "—"}<span className="block text-muted-foreground">{p.email ?? ""}</span></td>
                              <td className="px-4 py-2 max-w-[180px]">{p.interests?.join(", ") || "—"}</td>
                              <td className="px-4 py-2">{p.regions?.join(", ") || "—"}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{p.budget_band ?? "—"}</td>
                              <td className="px-4 py-2"><span className={p.status === "verified" ? "text-emerald-400" : p.status === "declined" ? "text-red-400" : "text-yellow-400"}>{p.status}</span></td>
                              <td className="px-4 py-2">
                                <div className="flex gap-1.5">
                                  {p.status !== "verified" && <button onClick={() => setPartnerStatus(p.id, "verified")} className="text-[11px] text-emerald-400 border border-emerald-400/40 hover:bg-emerald-400/10 rounded px-2 py-0.5">Verify</button>}
                                  {p.status !== "declined" && <button onClick={() => setPartnerStatus(p.id, "declined")} className="text-[11px] text-red-400 border border-red-400/40 hover:bg-red-400/10 rounded px-2 py-0.5">Decline</button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {pt.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">No partners yet.</td></tr>}
                        </tbody>
                      </table></div>
                    </div>
                  </div>
                )}

                {/* DRIVES */}
                {tab === "drives" && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-4 gap-4">
                      <StatCard icon={<GraduationCap className="h-3.5 w-3.5" />} label="Total drives" value={dr.length} />
                      <StatCard icon={<Clock className="h-3.5 w-3.5" />} label="Pending review" value={dr.filter((d) => d.status === "pending").length} />
                      <StatCard icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Published" value={dr.filter((d) => d.status === "published").length} />
                      <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Applications" value={da.length} />
                    </div>
                    <div className="rounded-2xl border border-border/40 bg-gradient-card shadow-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-accent" /><h3 className="text-sm font-semibold">Drives ({dr.length})</h3></div>
                      <div className="overflow-x-auto"><table className="w-full text-xs">
                        <thead className="bg-card/60 text-muted-foreground"><tr>{["Title", "Type", "Sponsor", "Region", "Seats", "Partner NGO", "Apps", "Status", "Action"].map((h) => <th key={h} className="text-left px-4 py-2 font-medium">{h}</th>)}</tr></thead>
                        <tbody>
                          {dr.map((d) => {
                            const apps = da.filter((a) => a.drive_id === d.id);
                            return (
                              <Fragment key={d.id}>
                                <tr className="border-t border-border/20 align-top">
                                  <td className="px-4 py-2 font-medium max-w-[200px]">{d.title}</td>
                                  <td className="px-4 py-2 capitalize">{d.drive_type}</td>
                                  <td className="px-4 py-2">{d.sponsor_name ?? "—"}</td>
                                  <td className="px-4 py-2">{[d.region, d.country].filter(Boolean).join(", ") || "—"}</td>
                                  <td className="px-4 py-2">{d.seats ?? "—"}</td>
                                  <td className="px-4 py-2">{d.partner_ngo ?? "—"}</td>
                                  <td className="px-4 py-2"><button onClick={() => setOpenDrive(openDrive === d.id ? null : d.id)} className="text-accent hover:underline">{apps.length}</button></td>
                                  <td className="px-4 py-2"><span className={d.status === "published" ? "text-emerald-400" : d.status === "declined" ? "text-red-400" : d.status === "closed" ? "text-muted-foreground" : "text-yellow-400"}>{d.status}</span></td>
                                  <td className="px-4 py-2">
                                    <div className="flex flex-wrap gap-1.5">
                                      {d.status !== "published" && <button onClick={() => setDriveStatus(d.id, "published")} className="text-[11px] text-emerald-400 border border-emerald-400/40 hover:bg-emerald-400/10 rounded px-2 py-0.5">Publish</button>}
                                      {d.status !== "declined" && <button onClick={() => setDriveStatus(d.id, "declined")} className="text-[11px] text-red-400 border border-red-400/40 hover:bg-red-400/10 rounded px-2 py-0.5">Decline</button>}
                                      {d.status === "published" && <button onClick={() => setDriveStatus(d.id, "closed")} className="text-[11px] text-muted-foreground border border-border/50 hover:bg-muted/30 rounded px-2 py-0.5">Close</button>}
                                    </div>
                                  </td>
                                </tr>
                                {openDrive === d.id && (
                                  <tr className="bg-card/40"><td colSpan={9} className="px-4 py-3">
                                    <div className="text-[11px] font-semibold text-muted-foreground mb-2">Applications &amp; nominations ({apps.length})</div>
                                    {apps.length === 0 ? <p className="text-xs text-muted-foreground">None yet.</p> : (
                                      <div className="space-y-1.5">
                                        {apps.map((a) => (
                                          <div key={a.id} className="flex items-center gap-2 flex-wrap text-xs border-b border-border/20 pb-1.5">
                                            <span className="font-medium">{a.applicant_name}</span>
                                            {a.is_nomination && <span className="text-[10px] text-purple-300 border border-purple-300/40 rounded px-1">nominated by {a.nominator_name ?? "advocate"}</span>}
                                            <span className="text-muted-foreground">{a.applicant_email ?? ""}{a.region ? ` · ${a.region}` : ""}</span>
                                            <span className={`ml-auto ${a.status === "awarded" ? "text-emerald-400" : a.status === "declined" ? "text-red-400" : a.status === "shortlisted" ? "text-accent" : "text-yellow-400"}`}>{a.status}</span>
                                            <div className="flex gap-1">
                                              {a.status !== "shortlisted" && <button onClick={() => setDriveAppStatus(a.id, "shortlisted")} className="text-[10px] text-accent border border-accent/40 hover:bg-accent/10 rounded px-1.5">Shortlist</button>}
                                              {a.status !== "awarded" && <button onClick={() => setDriveAppStatus(a.id, "awarded")} className="text-[10px] text-emerald-400 border border-emerald-400/40 hover:bg-emerald-400/10 rounded px-1.5">Award</button>}
                                              {a.status !== "declined" && <button onClick={() => setDriveAppStatus(a.id, "declined")} className="text-[10px] text-red-400 border border-red-400/40 hover:bg-red-400/10 rounded px-1.5">Decline</button>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td></tr>
                                )}
                              </Fragment>
                            );
                          })}
                          {dr.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">No drives yet — proposals appear here for review.</td></tr>}
                        </tbody>
                      </table></div>
                    </div>
                  </div>
                )}

                {/* NGOs */}
                {tab === "ngos" && (
                  <div className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-4">
                      {/* Add manually */}
                      <form onSubmit={addNgo} className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5"><Plus className="h-4 w-4 text-accent" /> Add a vetted NGO</h3>
                        <Input value={ngoForm.name} onChange={(e) => setNgoForm({ ...ngoForm, name: e.target.value })} placeholder="Organisation name *" className="bg-background/60 border-border/60" />
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={ngoForm.country} onChange={(e) => setNgoForm({ ...ngoForm, country: e.target.value })} placeholder="Country" className="bg-background/60 border-border/60" />
                          <Input value={ngoForm.city} onChange={(e) => setNgoForm({ ...ngoForm, city: e.target.value })} placeholder="City" className="bg-background/60 border-border/60" />
                        </div>
                        <Input value={ngoForm.focus_area} onChange={(e) => setNgoForm({ ...ngoForm, focus_area: e.target.value })} placeholder="Focus area (e.g. GBV, education)" className="bg-background/60 border-border/60" />
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={ngoForm.website} onChange={(e) => setNgoForm({ ...ngoForm, website: e.target.value })} placeholder="Website" className="bg-background/60 border-border/60" />
                          <Input value={ngoForm.contact_email} onChange={(e) => setNgoForm({ ...ngoForm, contact_email: e.target.value })} placeholder="Contact email" className="bg-background/60 border-border/60" />
                        </div>
                        <Button type="submit" disabled={savingNgo} className="bg-gradient-primary text-primary-foreground border-0">{savingNgo ? "Adding…" : "Add NGO"}</Button>
                      </form>
                      {/* CSV upload */}
                      <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Upload className="h-4 w-4 text-accent" /> Bulk import (CSV)</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          Upload a CSV with a header row. Recognised columns: <code className="text-foreground">name</code> (required),
                          <code className="text-foreground"> country</code>, <code className="text-foreground">city</code>,
                          <code className="text-foreground"> focus_area</code>, <code className="text-foreground">website</code>,
                          <code className="text-foreground"> contact_email</code>.
                        </p>
                        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={uploadCsv}
                          className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent/15 file:text-accent file:px-3 file:py-1.5 file:text-xs file:cursor-pointer" />
                        <p className="text-[11px] text-muted-foreground/70 mt-3">Imported NGOs are marked verified. Review them in the list below.</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/40 bg-gradient-card shadow-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2"><Heart className="h-4 w-4 text-accent" /><h3 className="text-sm font-semibold">Vetted NGOs ({ng.length})</h3></div>
                      <div className="overflow-x-auto"><table className="w-full text-xs">
                        <thead className="bg-card/60 text-muted-foreground"><tr>{["Name", "Country", "City", "Focus", "Contact", "Status", "Action"].map((h) => <th key={h} className="text-left px-4 py-2 font-medium">{h}</th>)}</tr></thead>
                        <tbody>
                          {ng.slice(0, 300).map((n) => (
                            <tr key={n.id} className="border-t border-border/20">
                              <td className="px-4 py-2 font-medium">{n.name}{n.website && <a href={n.website.startsWith("http") ? n.website : `https://${n.website}`} target="_blank" rel="noreferrer" className="block text-accent hover:underline font-normal">{n.website}</a>}</td>
                              <td className="px-4 py-2">{n.country ?? "—"}</td>
                              <td className="px-4 py-2">{n.city ?? "—"}</td>
                              <td className="px-4 py-2">{n.focus_area ?? "—"}</td>
                              <td className="px-4 py-2 truncate max-w-[160px]">{n.contact_email ?? "—"}</td>
                              <td className="px-4 py-2">{n.verified ? <span className="text-emerald-400">verified</span> : <span className="text-yellow-400">pending</span>}</td>
                              <td className="px-4 py-2">
                                {n.verified
                                  ? <button onClick={() => setNgoVerified(n.id, false)} className="text-[11px] text-muted-foreground border border-border/50 hover:bg-muted/30 rounded px-2 py-0.5">Unverify</button>
                                  : <button onClick={() => setNgoVerified(n.id, true)} className="text-[11px] text-emerald-400 border border-emerald-400/40 hover:bg-emerald-400/10 rounded px-2 py-0.5">Verify</button>}
                              </td>
                            </tr>
                          ))}
                          {ng.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No NGOs yet — add one or import a CSV.</td></tr>}
                        </tbody>
                      </table></div>
                    </div>
                  </div>
                )}

                {/* MARKETPLACE moderation */}
                {tab === "marketplace" && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <StatCard icon={<Heart className="h-3.5 w-3.5" />} label="Total shops" value={bz.length} />
                      <StatCard icon={<Clock className="h-3.5 w-3.5" />} label="Pending review" value={bz.filter((b) => b.status === "pending").length} />
                      <StatCard icon={<Globe className="h-3.5 w-3.5" />} label="Approved" value={bz.filter((b) => b.status === "approved").length} />
                    </div>
                    <div className="rounded-2xl border border-border/40 bg-gradient-card shadow-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-border/40"><h3 className="text-sm font-semibold">Women-owned shops</h3></div>
                      <div className="overflow-x-auto"><table className="w-full text-xs">
                        <thead className="bg-card/60 text-muted-foreground"><tr>{["Shop", "Owner", "Category", "Location", "Status", "Action"].map((h) => <th key={h} className="text-left px-4 py-2 font-medium">{h}</th>)}</tr></thead>
                        <tbody>
                          {bz.map((b) => (
                            <tr key={b.id} className="border-t border-border/20">
                              <td className="px-4 py-2 font-medium">{b.name}</td>
                              <td className="px-4 py-2">{b.owner_name ?? "—"}</td>
                              <td className="px-4 py-2">{b.category ?? "—"}</td>
                              <td className="px-4 py-2">{[b.city, b.country].filter(Boolean).join(", ") || "—"}</td>
                              <td className="px-4 py-2"><span className={b.status === "approved" ? "text-emerald-400" : b.status === "rejected" ? "text-red-400" : "text-yellow-400"}>{b.status}</span></td>
                              <td className="px-4 py-2">
                                <div className="flex gap-1.5">
                                  {b.status !== "approved" && <button onClick={() => setBizStatus(b.id, "approved")} className="text-[11px] text-emerald-400 border border-emerald-400/40 hover:bg-emerald-400/10 rounded px-2 py-0.5">Approve</button>}
                                  {b.status !== "rejected" && <button onClick={() => setBizStatus(b.id, "rejected")} className="text-[11px] text-red-400 border border-red-400/40 hover:bg-red-400/10 rounded px-2 py-0.5">Reject</button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {bz.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No shops yet.</td></tr>}
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
