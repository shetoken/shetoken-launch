import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, Plus, Trash2, ShoppingBag, Search, MapPin, ExternalLink, Clock } from "lucide-react";

export const CATEGORIES = ["Crafts & textiles", "Food & beverages", "Beauty & personal care", "Apparel & accessories", "Home & decor", "Agriculture", "Art", "Education", "Services", "Other"];
const PRICE_UNITS = ["each", "hour", "session", "day", "from", "quote"];
const selectCls = "w-full h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

interface Listing { id: string; business_id: string; type: string; title: string; description: string | null; price: number | null; currency: string | null; price_unit: string | null; image_url: string | null; buy_url: string | null; available: boolean | null; }
interface Business { id: string; owner_user_id: string; owner_name: string | null; name: string; category: string | null; country: string | null; city: string | null; description: string | null; story: string | null; logo_url: string | null; buy_url: string | null; whatsapp: string | null; upi_id: string | null; mobile_money: string | null; contact_email: string | null; status: string; she_listings?: Listing[]; }

const digits = (s: string) => s.replace(/[^\d]/g, "");
function buyHref(l: Listing, b: Business): string | null {
  if (l.buy_url) return l.buy_url.startsWith("http") ? l.buy_url : `https://${l.buy_url}`;
  if (b.buy_url) return b.buy_url.startsWith("http") ? b.buy_url : `https://${b.buy_url}`;
  if (b.whatsapp) return `https://wa.me/${digits(b.whatsapp)}?text=${encodeURIComponent(`Hi, I'm interested in "${l.title}" from ${b.name}`)}`;
  return null;
}
const priceLabel = (l: Listing) => {
  if (l.price_unit === "quote" || l.price == null) return "Contact for price";
  const cur = l.currency || "";
  const unit = l.price_unit && l.price_unit !== "each" ? ` / ${l.price_unit}` : "";
  const from = l.price_unit === "from" ? "from " : "";
  return `${from}${cur}${l.price}${l.price_unit === "from" ? "" : unit}`;
};

function ListingCard({ l, b }: { l: Listing; b: Business }) {
  const href = buyHref(l, b);
  const cta = l.type === "service" ? "Book / Enquire" : "Buy";
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 overflow-hidden">
      {l.image_url
        ? <img src={l.image_url} alt={l.title} className="w-full h-28 object-cover" />
        : <div className="w-full h-28 bg-muted/30 flex items-center justify-center text-muted-foreground"><ShoppingBag className="h-6 w-6" /></div>}
      <div className="p-2.5">
        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-accent mb-0.5">
          {l.type === "service" ? <Clock className="h-2.5 w-2.5" /> : <ShoppingBag className="h-2.5 w-2.5" />}{l.type}
        </div>
        <div className="text-sm font-medium leading-tight">{l.title}</div>
        <div className="text-xs text-muted-foreground mb-2">{priceLabel(l)}</div>
        {href
          ? <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent border border-accent/40 hover:bg-accent/10 rounded-md px-2 py-1">{cta} <ExternalLink className="h-3 w-3" /></a>
          : <span className="text-[10px] text-muted-foreground">{b.contact_email ?? b.upi_id ?? "Contact the seller"}</span>}
      </div>
    </div>
  );
}

/* ── Seller's shop manager ── */
function MyShop() {
  const { user } = useAuth();
  const { data: shop, refetch, isLoading } = useQuery({
    queryKey: ["my-shop", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("she_businesses").select("*, she_listings(*)").eq("owner_user_id", user!.id).maybeSingle();
      return data as Business | null;
    },
  });

  const [b, setB] = useState({ name: "", owner_name: "", category: "", country: "", city: "", description: "", buy_url: "", whatsapp: "", upi_id: "", mobile_money: "", contact_email: "", logo_url: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (shop) setB({
      name: shop.name ?? "", owner_name: shop.owner_name ?? "", category: shop.category ?? "",
      country: shop.country ?? "", city: shop.city ?? "", description: shop.description ?? "",
      buy_url: shop.buy_url ?? "", whatsapp: shop.whatsapp ?? "", upi_id: shop.upi_id ?? "",
      mobile_money: shop.mobile_money ?? "", contact_email: shop.contact_email ?? "", logo_url: shop.logo_url ?? "",
    });
  }, [shop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveShop(e: React.FormEvent) {
    e.preventDefault();
    if (!b.name.trim()) { toast.error("Your shop needs a name."); return; }
    setSaving(true);
    try {
      const payload = { ...b, name: b.name.trim(), owner_user_id: user!.id, contact_email: b.contact_email || user!.email };
      const { error } = shop
        ? await supabase.from("she_businesses").update(payload).eq("id", shop.id)
        : await supabase.from("she_businesses").insert({ ...payload, status: "pending" });
      if (error) throw error;
      toast.success(shop ? "Shop updated." : "Shop submitted — pending review.");
      refetch();
    } catch (err) { console.warn(err); toast.error("Could not save your shop."); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 p-6 shadow-card mb-10">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><Store className="h-5 w-5 text-accent" /> Your shop</h2>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <>
          {shop && (
            <p className="text-xs mb-3">
              Status: <span className={shop.status === "approved" ? "text-emerald-400" : shop.status === "rejected" ? "text-red-400" : "text-yellow-400"}>{shop.status}</span>
              {shop.status === "pending" && " — we'll review it shortly."}
            </p>
          )}
          <form onSubmit={saveShop} className="grid sm:grid-cols-2 gap-3 mb-2">
            <Input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} placeholder={shop ? shop.name : "Shop / business name *"} className="bg-background/60 border-border/60" />
            <Input value={b.owner_name} onChange={(e) => setB({ ...b, owner_name: e.target.value })} placeholder={shop?.owner_name || "Owner name (shown publicly)"} className="bg-background/60 border-border/60" />
            <select className={selectCls} value={b.category} onChange={(e) => setB({ ...b, category: e.target.value })}>
              <option value="">{shop?.category || "Category…"}</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input value={b.country} onChange={(e) => setB({ ...b, country: e.target.value })} placeholder={shop?.country || "Country"} className="bg-background/60 border-border/60" />
              <Input value={b.city} onChange={(e) => setB({ ...b, city: e.target.value })} placeholder={shop?.city || "City"} className="bg-background/60 border-border/60" />
            </div>
            <Input value={b.description} onChange={(e) => setB({ ...b, description: e.target.value })} placeholder={shop?.description || "Short description"} className="bg-background/60 border-border/60 sm:col-span-2" />
            <Input value={b.logo_url} onChange={(e) => setB({ ...b, logo_url: e.target.value })} placeholder={shop?.logo_url || "Logo image URL (optional)"} className="bg-background/60 border-border/60 sm:col-span-2" />
            <div className="sm:col-span-2 text-xs text-muted-foreground">How buyers pay you (your own rails — we never handle the money):</div>
            <Input value={b.buy_url} onChange={(e) => setB({ ...b, buy_url: e.target.value })} placeholder={shop?.buy_url || "Shop / payment link"} className="bg-background/60 border-border/60" />
            <Input value={b.whatsapp} onChange={(e) => setB({ ...b, whatsapp: e.target.value })} placeholder={shop?.whatsapp || "WhatsApp number (orders)"} className="bg-background/60 border-border/60" />
            <Input value={b.upi_id} onChange={(e) => setB({ ...b, upi_id: e.target.value })} placeholder={shop?.upi_id || "UPI ID (India)"} className="bg-background/60 border-border/60" />
            <Input value={b.mobile_money} onChange={(e) => setB({ ...b, mobile_money: e.target.value })} placeholder={shop?.mobile_money || "Mobile money (M-Pesa…)"} className="bg-background/60 border-border/60" />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving} className="bg-gradient-primary text-primary-foreground border-0">{saving ? "Saving…" : shop ? "Update shop" : "Create shop"}</Button>
            </div>
          </form>

          {shop && <Listings shop={shop} onChange={refetch} />}
        </>
      )}
    </div>
  );
}

/* ── Listings manager for a shop ── */
function Listings({ shop, onChange }: { shop: Business; onChange: () => void }) {
  const [l, setL] = useState({ type: "product", title: "", price: "", currency: "", price_unit: "each", description: "", image_url: "", buy_url: "" });
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!l.title.trim()) { toast.error("Listing needs a title."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("she_listings").insert({
        business_id: shop.id, type: l.type, title: l.title.trim(),
        price: l.price ? Number(l.price) : null, currency: l.currency || null, price_unit: l.price_unit,
        description: l.description || null, image_url: l.image_url || null, buy_url: l.buy_url || null,
      });
      if (error) throw error;
      toast.success("Listing added.");
      setL({ type: "product", title: "", price: "", currency: "", price_unit: "each", description: "", image_url: "", buy_url: "" });
      onChange();
    } catch (err) { console.warn(err); toast.error("Could not add listing."); }
    finally { setSaving(false); }
  }
  async function del(id: string) {
    const { error } = await supabase.from("she_listings").delete().eq("id", id);
    if (error) toast.error("Could not remove."); else { toast.success("Removed."); onChange(); }
  }

  return (
    <div className="mt-5 border-t border-border/30 pt-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Plus className="h-4 w-4 text-accent" /> Add a product or service</h3>
      <form onSubmit={add} className="grid sm:grid-cols-2 gap-3 mb-4">
        <select className={selectCls} value={l.type} onChange={(e) => setL({ ...l, type: e.target.value })}>
          <option value="product">Product</option><option value="service">Service</option>
        </select>
        <Input value={l.title} onChange={(e) => setL({ ...l, title: e.target.value })} placeholder="Title *" className="bg-background/60 border-border/60" />
        <div className="grid grid-cols-3 gap-2">
          <Input value={l.currency} onChange={(e) => setL({ ...l, currency: e.target.value })} placeholder="₹/KES" className="bg-background/60 border-border/60" />
          <Input value={l.price} onChange={(e) => setL({ ...l, price: e.target.value })} placeholder="Price" type="number" className="bg-background/60 border-border/60" />
          <select className={selectCls} value={l.price_unit} onChange={(e) => setL({ ...l, price_unit: e.target.value })}>{PRICE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
        </div>
        <Input value={l.image_url} onChange={(e) => setL({ ...l, image_url: e.target.value })} placeholder="Photo URL" className="bg-background/60 border-border/60" />
        <Input value={l.description} onChange={(e) => setL({ ...l, description: e.target.value })} placeholder="Short description" className="bg-background/60 border-border/60" />
        <Input value={l.buy_url} onChange={(e) => setL({ ...l, buy_url: e.target.value })} placeholder="Buy/pay link (optional — else uses shop's)" className="bg-background/60 border-border/60" />
        <div className="sm:col-span-2"><Button type="submit" disabled={saving} size="sm" className="bg-gradient-primary text-primary-foreground border-0">{saving ? "Adding…" : "Add listing"}</Button></div>
      </form>
      <div className="grid sm:grid-cols-3 gap-3">
        {(shop.she_listings ?? []).map((it) => (
          <div key={it.id} className="relative"><ListingCard l={it} b={shop} />
            <button onClick={() => del(it.id)} className="absolute top-1.5 right-1.5 p-1 rounded bg-background/80 text-red-400 hover:bg-background"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {(shop.she_listings ?? []).length === 0 && <p className="text-xs text-muted-foreground col-span-3">No listings yet — add your first product or service above.</p>}
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { user, openAuth } = useAuth();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["marketplace"], staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("she_businesses").select("*, she_listings(*)").eq("status", "approved").order("created_at", { ascending: false }).limit(500);
      if (error) throw error; return (data ?? []) as Business[];
    },
  });

  const filtered = shops.filter((s) =>
    (!cat || s.category === cat) &&
    (!search || `${s.name} ${s.city} ${s.country} ${s.category}`.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="min-h-screen bg-background">
      <SEO title="SHEconomy — Women-Owned Business Marketplace" description="Discover and support women-owned businesses — products and services from women entrepreneurs around the world. Buy directly from the seller." url="https://www.shetoken.org/marketplace" />
      <Nav />
      <main className="pt-24 pb-20 container max-w-6xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-4"><Store className="h-3 w-3" /> SHEconomy</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">Women-owned <span className="text-gradient">marketplace</span></h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Discover and support women entrepreneurs — products and services. You buy directly from the seller.</p>
          {!user && <Button onClick={() => openAuth("signup")} className="mt-5 bg-gradient-primary text-primary-foreground border-0 shadow-glow">Sign in to open your shop</Button>}
        </div>

        {user && <MyShop />}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shops…" className="w-full pl-9 h-10 bg-card/40 border border-border/60 rounded-lg text-sm" />
          </div>
          <select className={`${selectCls} max-w-[200px]`} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {isLoading ? <p className="text-muted-foreground">Loading shops…</p> : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No shops yet. {user ? "Be the first — open your shop above." : "Sign in to open the first shop."}</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map((s) => (
              <div key={s.id} className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
                <div className="flex items-center gap-3 mb-3">
                  {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center"><Store className="h-5 w-5 text-accent" /></div>}
                  <div>
                    <div className="font-bold leading-tight">{s.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{[s.city, s.country].filter(Boolean).join(", ") || "—"} · {s.category ?? "—"}</div>
                  </div>
                </div>
                {s.description && <p className="text-sm text-muted-foreground mb-3">{s.description}</p>}
                {(s.she_listings ?? []).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(s.she_listings ?? []).slice(0, 6).map((l) => <ListingCard key={l.id} l={l} b={s} />)}
                  </div>
                ) : <p className="text-xs text-muted-foreground">No listings yet.</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
