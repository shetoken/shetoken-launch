import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, Coins, HeartHandshake, ArrowRight, MapPin, Users, CalendarDays, Building2, CheckCircle, Plus, Sparkles } from "lucide-react";

const selectCls = "w-full h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

const DRIVE_TYPES = [
  { key: "scholarship", label: "Scholarship", Icon: GraduationCap, color: "#a78bfa" },
  { key: "microfinance", label: "Microfinance", Icon: Coins, color: "#34d399" },
  { key: "grant", label: "Grant", Icon: HeartHandshake, color: "#fbbf24" },
] as const;
const typeMeta = (t: string) => DRIVE_TYPES.find((d) => d.key === t) ?? DRIVE_TYPES[0];
const CURRENCIES = ["USD", "INR", "GBP", "EUR", "NGN", "KES", "ZAR", "BDT", "PKR"];

interface Drive {
  id: string; drive_type: string; title: string; sponsor_name: string | null; summary: string | null;
  beneficiary: string | null; country: string | null; region: string | null; seats: number | null;
  amount: number | null; currency: string | null; deadline: string | null; partner_ngo: string | null;
  status: string; created_at: string;
}

/* ── Propose a drive (any signed-in user; admin publishes) ── */
function ProposeDrive({ onDone }: { onDone: () => void }) {
  const { user, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    drive_type: "scholarship", title: "", sponsor_name: "", beneficiary: "", country: "", region: "",
    seats: "", amount: "", currency: "USD", deadline: "", partner_ngo: "", contact_email: "", summary: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim() || !f.drive_type) { toast.error("Please add a title and drive type."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("she_drives").insert({
        created_by: user!.id, drive_type: f.drive_type, title: f.title.trim(),
        sponsor_name: f.sponsor_name.trim() || null, beneficiary: f.beneficiary.trim() || null,
        country: f.country.trim() || null, region: f.region.trim() || null,
        seats: f.seats ? parseInt(f.seats, 10) : null,
        amount: f.amount ? parseFloat(f.amount) : null, currency: f.currency || null,
        deadline: f.deadline || null, partner_ngo: f.partner_ngo.trim() || null,
        contact_email: f.contact_email.trim() || user!.email || null,
        summary: f.summary.trim() || null, status: "pending",
      });
      if (error) throw error;
      toast.success("Thank you — your drive is submitted for review. We publish after verifying the disbursement partner.");
      setOpen(false); onDone();
    } catch (err) { console.warn("drive propose failed", err); toast.error("Could not submit. Please try again."); }
    finally { setLoading(false); }
  }

  if (!user) {
    return (
      <Button onClick={() => openAuth("signup")} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
        Sign in to propose a drive <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    );
  }
  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
        <Plus className="mr-2 h-4 w-4" /> Propose a drive
      </Button>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-accent/25 bg-accent/5 p-6 shadow-card grid sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <div className="flex items-center gap-2 text-accent text-xs font-semibold mb-1"><Sparkles className="h-3.5 w-3.5" /> PROPOSE A DRIVE</div>
        <p className="text-xs text-muted-foreground">Funds are held and disbursed by a vetted partner NGO — SHEtoken never holds the money. We verify each drive before publishing.</p>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Type *</label>
        <select className={selectCls} value={f.drive_type} onChange={(e) => setF({ ...f, drive_type: e.target.value })}>
          {DRIVE_TYPES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Title *</label>
        <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Girls' STEM scholarship — West Bengal" className="bg-background/60 border-border/60" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Sponsor name</label>
        <Input value={f.sponsor_name} onChange={(e) => setF({ ...f, sponsor_name: e.target.value })} placeholder="Org or individual" className="bg-background/60 border-border/60" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Who is it for?</label>
        <Input value={f.beneficiary} onChange={(e) => setF({ ...f, beneficiary: e.target.value })} placeholder="e.g. Girls 14–18 from low-income families" className="bg-background/60 border-border/60" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Country</label>
        <Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="Country" className="bg-background/60 border-border/60" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Region / state</label>
        <Input value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} placeholder="e.g. West Bengal" className="bg-background/60 border-border/60" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Recipients / seats</label>
        <Input type="number" min="0" value={f.seats} onChange={(e) => setF({ ...f, seats: e.target.value })} placeholder="e.g. 5" className="bg-background/60 border-border/60" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium mb-1 block">Total amount</label>
          <Input type="number" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0" className="bg-background/60 border-border/60" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Currency</label>
          <select className={selectCls} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Application deadline</label>
        <Input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} className="bg-background/60 border-border/60" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Disbursement partner (NGO)</label>
        <Input value={f.partner_ngo} onChange={(e) => setF({ ...f, partner_ngo: e.target.value })} placeholder="NGO that will hold & disburse funds" className="bg-background/60 border-border/60" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium mb-1 block">Description</label>
        <textarea value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} rows={3}
          placeholder="Tell us about the drive, eligibility and how funds will be used."
          className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
      </div>
      <div className="sm:col-span-2 flex gap-3">
        <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
          {loading ? "Submitting…" : "Submit for review"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border/60 bg-card/40">Cancel</Button>
      </div>
    </form>
  );
}

/* ── Apply / nominate for a drive ── */
function ApplyDrive({ drive }: { drive: Drive }) {
  const { user, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNom, setIsNom] = useState(false);
  const [f, setF] = useState({ applicant_name: "", applicant_email: "", region: "", story: "", nominator_name: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.applicant_name.trim()) { toast.error("Please add the applicant's name."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("she_drive_applications").insert({
        drive_id: drive.id, created_by: user!.id,
        applicant_name: f.applicant_name.trim(), applicant_email: f.applicant_email.trim() || null,
        region: f.region.trim() || null, story: f.story.trim() || null,
        is_nomination: isNom, nominator_name: isNom ? (f.nominator_name.trim() || null) : null,
        status: "submitted",
      });
      if (error) throw error;
      toast.success(isNom ? "Nomination submitted — thank you for advocating." : "Application submitted. Good luck!");
      setDone(true); setOpen(false);
    } catch (err) { console.warn("apply failed", err); toast.error("Could not submit. Please try again."); }
    finally { setLoading(false); }
  }

  if (done) return <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle className="h-4 w-4" /> Submitted</span>;
  if (!user) return <Button size="sm" variant="outline" onClick={() => openAuth("signin")} className="border-accent/40 text-accent">Sign in to apply</Button>;
  if (!open) {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { setIsNom(false); setOpen(true); }} className="bg-gradient-primary text-primary-foreground border-0">Apply</Button>
        <Button size="sm" variant="outline" onClick={() => { setIsNom(true); setOpen(true); }} className="border-border/60 bg-card/40">Nominate someone</Button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="mt-3 grid gap-2 border-t border-border/30 pt-3">
      {isNom && <p className="text-[11px] text-muted-foreground">Nominating a woman who can't apply herself (e.g. no phone). Add her details and yours as the advocate.</p>}
      <Input value={f.applicant_name} onChange={(e) => setF({ ...f, applicant_name: e.target.value })} placeholder={isNom ? "Her name *" : "Your name *"} className="bg-background/60 border-border/60 h-9" />
      <div className="grid grid-cols-2 gap-2">
        <Input value={f.applicant_email} onChange={(e) => setF({ ...f, applicant_email: e.target.value })} placeholder="Email (optional)" className="bg-background/60 border-border/60 h-9" />
        <Input value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} placeholder="Region / city" className="bg-background/60 border-border/60 h-9" />
      </div>
      {isNom && <Input value={f.nominator_name} onChange={(e) => setF({ ...f, nominator_name: e.target.value })} placeholder="Your name (advocate) / NGO" className="bg-background/60 border-border/60 h-9" />}
      <textarea value={f.story} onChange={(e) => setF({ ...f, story: e.target.value })} rows={2} placeholder="Why this support matters (optional)"
        className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading} className="bg-gradient-primary text-primary-foreground border-0">{loading ? "Submitting…" : "Submit"}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} className="border-border/60 bg-card/40">Cancel</Button>
      </div>
    </form>
  );
}

function DriveCard({ drive }: { drive: Drive }) {
  const m = typeMeta(drive.drive_type);
  const loc = [drive.region, drive.country].filter(Boolean).join(", ");
  const deadline = drive.deadline ? new Date(drive.deadline) : null;
  const closed = deadline ? deadline.getTime() < Date.now() : false;
  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${m.color}1f`, color: m.color }}>
          <m.Icon className="h-3 w-3" /> {m.label}
        </span>
        {drive.sponsor_name && <span className="text-[11px] text-muted-foreground">by {drive.sponsor_name}</span>}
      </div>
      <h3 className="font-bold text-base leading-tight mb-1">{drive.title}</h3>
      {drive.beneficiary && <p className="text-xs text-muted-foreground mb-2">For: {drive.beneficiary}</p>}
      {drive.summary && <p className="text-xs text-muted-foreground/90 mb-3 line-clamp-3">{drive.summary}</p>}
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[11px] text-muted-foreground mb-3 mt-auto">
        {loc && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-accent" /> {loc}</span>}
        {drive.seats != null && <span className="flex items-center gap-1"><Users className="h-3 w-3 text-accent" /> {drive.seats} recipient{drive.seats === 1 ? "" : "s"}</span>}
        {drive.amount != null && <span className="flex items-center gap-1"><Coins className="h-3 w-3 text-accent" /> {drive.amount.toLocaleString()} {drive.currency}</span>}
        {deadline && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-accent" /> {closed ? "Closed" : `By ${deadline.toLocaleDateString()}`}</span>}
        {drive.partner_ngo && <span className="flex items-center gap-1 col-span-2"><Building2 className="h-3 w-3 text-accent" /> {drive.partner_ngo}</span>}
      </div>
      {!closed && <ApplyDrive drive={drive} />}
    </div>
  );
}

export default function Drives() {
  const { data: drives, isLoading, refetch } = useQuery({
    queryKey: ["drives-published"],
    queryFn: async (): Promise<Drive[]> => {
      const { data, error } = await supabase.from("she_drives").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(200);
      if (error) throw error; return (data ?? []) as Drive[];
    },
  });
  const list = drives ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Scholarship & Microfinance Drives — SHEtoken"
        description="Sponsor or apply for scholarship, microfinance and grant drives for women and girls. Funds are held and disbursed by vetted partner NGOs."
        url="https://www.shetoken.org/drives"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-6xl">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-3">
            <GraduationCap className="h-3 w-3" /> Drives
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Scholarship &amp; microfinance drives</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Sponsors, foundations and individuals fund scholarships, microfinance and grants for women and girls.
            Funds are held and disbursed by vetted partner NGOs — apply directly, or nominate a woman who can't apply herself.
          </p>
        </div>

        <div className="mb-8"><ProposeDrive onDone={refetch} /></div>

        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">Loading drives…</div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-10 text-center shadow-card">
            <GraduationCap className="h-7 w-7 text-accent mx-auto mb-3" />
            <p className="font-semibold mb-1">No live drives yet</p>
            <p className="text-sm text-muted-foreground mb-4">Be the first to sponsor a scholarship or microfinance drive for women and girls.</p>
            <Link to="/community" className="text-sm text-accent hover:underline">Become a partner / sponsor →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((d) => <DriveCard key={d.id} drive={d} />)}
          </div>
        )}
      </main>
    </div>
  );
}
