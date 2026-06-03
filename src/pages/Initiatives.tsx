import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { supabase } from "@/integrations/supabase/client";
import { Award, Star, MapPin, ExternalLink, Heart } from "lucide-react";

export const INITIATIVE_CATEGORIES = ["Safety", "Education", "Economic", "Health", "Leadership", "Rights", "General"] as const;
const CAT_COLOR: Record<string, string> = {
  Safety: "#f87171", Education: "#a78bfa", Economic: "#fbbf24", Health: "#34d399",
  Leadership: "#60a5fa", Rights: "#f472b6", General: "#94a3b8",
};
const catColor = (c: string | null) => CAT_COLOR[c ?? "General"] ?? CAT_COLOR.General;

export interface Initiative {
  id: string; name: string; category: string | null; region: string | null; country: string | null;
  url: string | null; logo_url: string | null; blurb: string | null; spotlight: boolean | null;
  published: boolean | null; created_at: string;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "•";

function InitiativeCard({ it, featured = false }: { it: Initiative; featured?: boolean }) {
  const color = catColor(it.category);
  const loc = [it.region, it.country].filter(Boolean).join(", ");
  const href = it.url ? (it.url.startsWith("http") ? it.url : `https://${it.url}`) : null;
  const body = (
    <div className={`rounded-2xl border bg-gradient-card p-5 shadow-card h-full flex flex-col transition-smooth ${featured ? "border-accent/40" : "border-border/40 hover:border-accent/30"}`}>
      <div className="flex items-start gap-3 mb-2">
        {it.logo_url
          ? <img src={it.logo_url} alt={it.name} className="h-11 w-11 rounded-lg object-cover bg-background shrink-0" loading="lazy" />
          : <div className="h-11 w-11 rounded-lg flex items-center justify-center font-bold text-sm shrink-0" style={{ background: `${color}22`, color }}>{initials(it.name)}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-base leading-tight truncate">{it.name}</h3>
            {it.spotlight && <Star className="h-3.5 w-3.5 text-accent fill-accent shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {it.category && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${color}1f`, color }}>{it.category}</span>}
            {loc && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {loc}</span>}
          </div>
        </div>
      </div>
      {it.blurb && <p className="text-xs text-muted-foreground leading-relaxed flex-1">{it.blurb}</p>}
      {href && <span className="text-xs text-accent hover:underline mt-3 inline-flex items-center gap-1">Visit <ExternalLink className="h-3 w-3" /></span>}
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer" className="block">{body}</a> : body;
}

export default function Initiatives() {
  const [cat, setCat] = useState<string>("All");
  const { data, isLoading } = useQuery({
    queryKey: ["initiatives-published"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Initiative[]> => {
      const { data, error } = await supabase.from("she_initiatives").select("*")
        .eq("published", true).order("spotlight", { ascending: false }).order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as Initiative[];
    },
  });
  const all = data ?? [];
  const spotlights = useMemo(() => all.filter((i) => i.spotlight), [all]);
  const filtered = useMemo(() => (cat === "All" ? all : all.filter((i) => i.category === cat)), [all, cat]);
  const cats = useMemo(() => ["All", ...INITIATIVE_CATEGORIES.filter((c) => all.some((i) => i.category === c))], [all]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Women's Initiatives We Celebrate — SHEtoken"
        description="A curated wall recognizing organizations, movements and programs advancing women's safety, education, economic power, health, leadership and rights around the world."
        url="https://www.shetoken.org/initiatives"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-6xl">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-3">
            <Award className="h-3 w-3" /> Recognition
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Initiatives we celebrate</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            The work of advancing women belongs to many. We recognize organizations, movements and programs around the
            world making women safer, freer and more powerful — whether or not they're partners of ours.
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">Loading…</div>
        ) : all.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-10 text-center shadow-card">
            <Heart className="h-7 w-7 text-accent mx-auto mb-3" />
            <p className="font-semibold mb-1">Recognition wall coming soon</p>
            <p className="text-sm text-muted-foreground mb-4">We're curating the initiatives advancing women worldwide. Know one we should celebrate?</p>
            <Link to="/community" className="text-sm text-accent hover:underline">Tell us in the community →</Link>
          </div>
        ) : (
          <>
            {spotlights.length > 0 && cat === "All" && (
              <section className="mb-8">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-accent mb-3"><Star className="h-3.5 w-3.5 fill-accent" /> Spotlight</div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {spotlights.map((it) => <InitiativeCard key={it.id} it={it} featured />)}
                </div>
              </section>
            )}

            <div className="flex flex-wrap gap-2 mb-5">
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(c)}
                  className={`text-xs px-3 py-1 rounded-full border transition-smooth ${cat === c ? "border-accent bg-accent/15 text-accent" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((it) => <InitiativeCard key={it.id} it={it} />)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
