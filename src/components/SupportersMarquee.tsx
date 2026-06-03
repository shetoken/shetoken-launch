import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Kind = "Partner" | "Sponsor" | "NGO" | "Business";
interface Supporter { name: string; logo_url: string | null; kind: Kind; website?: string | null; }

const KIND_COLOR: Record<Kind, string> = {
  Partner: "#a78bfa", Sponsor: "#a78bfa", NGO: "#34d399", Business: "#fbbf24",
};

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "•";

function Logo({ s }: { s: Supporter }) {
  const color = KIND_COLOR[s.kind];
  return (
    <div className="flex items-center gap-3 shrink-0 rounded-xl border border-border/40 bg-card/40 pl-3 pr-5 py-2.5">
      {s.logo_url ? (
        <img src={s.logo_url} alt={s.name} className="h-10 w-10 rounded-lg object-cover bg-background" loading="lazy" />
      ) : (
        <div className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm"
             style={{ background: `${color}22`, color }}>
          {initials(s.name)}
        </div>
      )}
      <div className="leading-tight">
        <div className="text-sm font-semibold whitespace-nowrap max-w-[180px] truncate">{s.name}</div>
        <div className="text-[10px] font-medium" style={{ color }}>{s.kind}</div>
      </div>
    </div>
  );
}

export function SupportersMarquee() {
  const { data } = useQuery({
    queryKey: ["supporters"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Supporter[]> => {
      const [biz, ngo, part] = await Promise.all([
        supabase.from("she_businesses").select("name,logo_url").eq("status", "approved").limit(200),
        supabase.from("she_ngos").select("name,website").eq("verified", true).limit(200),
        supabase.from("she_partners").select("org_name,partner_type,website").eq("status", "verified").limit(200),
      ]);
      const out: Supporter[] = [];
      (biz.data ?? []).forEach((b: { name: string; logo_url: string | null }) =>
        out.push({ name: b.name, logo_url: b.logo_url, kind: "Business" }));
      (ngo.data ?? []).forEach((n: { name: string; website: string | null }) =>
        out.push({ name: n.name, logo_url: null, kind: "NGO", website: n.website }));
      (part.data ?? []).forEach((p: { org_name: string; partner_type: string | null; website: string | null }) =>
        out.push({ name: p.org_name, logo_url: null, kind: p.partner_type === "Impact investor" || p.partner_type === "Foundation / grantmaker" ? "Sponsor" : "Partner", website: p.website }));
      return out;
    },
  });

  const supporters = data ?? [];
  if (supporters.length === 0) return null;

  // duplicate the list so the -50% translate loops seamlessly
  const loop = [...supporters, ...supporters];

  return (
    <section className="container max-w-5xl mb-12">
      <p className="text-xs font-semibold text-muted-foreground mb-4 text-center">
        Backed by partners, sponsors, NGOs &amp; women-owned businesses
      </p>
      <div className="relative overflow-hidden"
           style={{ maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)" }}>
        <div className="flex gap-4 w-max animate-marquee">
          {loop.map((s, i) => <Logo key={`${s.kind}-${s.name}-${i}`} s={s} />)}
        </div>
      </div>
    </section>
  );
}
