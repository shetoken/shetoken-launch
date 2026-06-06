import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, User, Globe2, BookOpen, Bookmark } from "lucide-react";

const ORG_TYPES = [
  { value: "impact-investor",    label: "Impact Investor" },
  { value: "ngo",                label: "NGO / Non-profit" },
  { value: "researcher",         label: "Researcher / Academic" },
  { value: "policy-maker",       label: "Policy Maker / Government" },
  { value: "advocate",           label: "Advocate / Activist" },
  { value: "blockchain-builder", label: "Blockchain Builder" },
  { value: "journalist",         label: "Journalist / Media" },
  { value: "student",            label: "Student" },
  { value: "other",              label: "Other" },
];

export default function Profile() {
  const { user, profile, loading } = useAuth();

  // Initialise form from profile once it loads
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion]           = useState("");
  const [orgType, setOrgType]         = useState("");
  const [company, setCompany]         = useState("");
  const [jobTitle, setJobTitle]       = useState("");
  const [bio, setBio]                 = useState("");
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setRegion(profile.region ?? "");
      setOrgType(profile.org_type ?? "");
      setCompany(profile.company ?? "");
      setJobTitle(profile.job_title ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  // Redirect unauthenticated visitors
  if (!loading && !user) return <Navigate to="/" replace />;
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("she_profiles")
      .upsert({
        id: user.id,
        display_name: displayName || null,
        email: user.email,
        region: region || null,
        org_type: orgType || null,
        company: company || null,
        job_title: jobTitle || null,
        bio: bio || null,
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (error) {
      toast.error("Failed to save — " + error.message);
    } else {
      toast.success("Profile updated.");
    }
  }

  const savedCountries = profile?.saved_countries ?? [];
  const initials = (displayName || user?.email || "U")
    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="My Profile — SHEtoken" url="https://www.shetoken.org/profile" />
      <Nav />

      <main className="pt-24 pb-20 container max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground shadow-gold shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{displayName || "My Profile"}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            {profile?.newsletter_tier && (
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded mt-1 inline-block">
                {profile.newsletter_tier}
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* LEFT — Edit form */}
          <div className="md:col-span-2">
            <div className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
              <h2 className="font-semibold mb-5 flex items-center gap-2">
                <User className="h-4 w-4 text-accent" /> Profile details
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Display name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Smith"
                    className="bg-background/60 border-border/60"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Organisation</Label>
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Your org or institution"
                      className="bg-background/60 border-border/60"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Job title</Label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Your role"
                      className="bg-background/60 border-border/60"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>I am a</Label>
                    <Select value={orgType} onValueChange={setOrgType}>
                      <SelectTrigger className="bg-background/60 border-border/60">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_TYPES.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Region / Country</Label>
                    <Input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. South Asia"
                      className="bg-background/60 border-border/60"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Brief bio{" "}
                    <span className="text-muted-foreground text-xs">(optional — shown to focus group members)</span>
                  </Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="What brings you to SHEtoken? What are you tracking?"
                    className="bg-background/60 border-border/60 resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-primary text-primary-foreground border-0 shadow-gold hover:opacity-90"
                >
                  {saving
                    ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    : <Save className="h-4 w-4 mr-2" />}
                  Save profile
                </Button>
              </form>
            </div>
          </div>

          {/* RIGHT — Sidebar */}
          <div className="space-y-4">
            {/* Saved countries */}
            <div className="bg-gradient-card border border-border/40 rounded-2xl p-5 shadow-card">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-accent" /> Saved countries
              </h3>
              {savedCountries.length === 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Save countries from the{" "}
                  <Link to="/dashboard" className="text-accent hover:underline">dashboard</Link>{" "}
                  to pin them to the top of your leaderboard.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {savedCountries.map((iso: string) => (
                    <Link key={iso} to={`/country/${iso}`}>
                      <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded hover:bg-accent/20 transition-smooth">
                        {iso}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Community */}
            <div className="bg-gradient-card border border-border/40 rounded-2xl p-5 shadow-card">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-accent" /> Focus groups
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Join a focus group to access signal feeds, member directories and discussion threads.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full border-border/60 text-xs">
                <Link to="/community">Browse focus groups</Link>
              </Button>
            </div>

            {/* Whitepaper */}
            <div className="bg-gradient-card border border-border/40 rounded-2xl p-5 shadow-card">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" /> Whitepaper
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Full SHE Score methodology, tokenomics and roadmap.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full border-border/60 text-xs">
                <Link to="/whitepaper">Read the whitepaper</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 SHE Foundation · shetoken.org</span>
          <div className="flex gap-6">
            <Link to="/dashboard" className="hover:text-foreground">Live Data</Link>
            <Link to="/community" className="hover:text-foreground">Community</Link>
            <Link to="/whitepaper" className="hover:text-foreground">Whitepaper</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
