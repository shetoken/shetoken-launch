import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { ShieldCheck } from "lucide-react";

const CONTACT = "contact@shetoken.org";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy"
        description="What SHEtoken collects (email, list tag, optional organization fields, petition signatures), why, how long we keep it, how to be removed, and our no-sale-of-data commitment."
        url="https://www.shetoken.org/privacy"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-4">
          <ShieldCheck className="h-3 w-3" /> Privacy
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mb-8">SHEtoken / SHE Foundation · Last updated June 2026</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">What we collect</h2>
            <ul className="space-y-1.5 list-disc pl-5">
              <li>Your <strong className="text-foreground">email address</strong> when you join a list.</li>
              <li>The <strong className="text-foreground">list / topic</strong> you chose (e.g. fund the index, token-launch notification, register a program) and the <strong className="text-foreground">page</strong> you signed up from.</li>
              <li>If you register a program or government: your <strong className="text-foreground">organization name, country/state and program type</strong>.</li>
              <li>If you sign the petition: your <strong className="text-foreground">name</strong> (published only as first name + last initial), <strong className="text-foreground">country</strong>, and an optional <strong className="text-foreground">reason</strong> (reviewed before it is shown).</li>
              <li>If you create an account or join the community, the details you provide in those forms.</li>
              <li>Anonymous <strong className="text-foreground">usage analytics</strong> — page views, session, and an approximate country/city derived from your IP address. We do not build advertising profiles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">Why we collect it</h2>
            <p>To send you the updates you asked for, to understand demand for the SHE Score, to display petition support (name + country only), and to operate and improve the site. Marketing emails are sent only if you tick the consent box; you can withdraw consent at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">Email confirmation</h2>
            <p>We are putting double opt-in in place. Until an email provider is connected, your address is stored as <strong className="text-foreground">unconfirmed</strong> and we will ask you to confirm before sending marketing email. Every email we send will include an unsubscribe link.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">We never sell your data</h2>
            <p>We do not sell, rent or trade your personal data. We share it only with the service providers that run our infrastructure (e.g. hosting and database), under their data-processing terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">Retention</h2>
            <p>We keep your information until you ask us to remove it, or until it is no longer needed for the purpose you gave it. Anonymous analytics are retained in aggregate.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">Cookies</h2>
            <p>We use only the storage needed to keep you signed in and to measure anonymous usage. We do not use third-party advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">Access &amp; removal</h2>
            <p>
              To access, correct or delete your data — or to unsubscribe — email{" "}
              <a href={`mailto:${CONTACT}?subject=Privacy%20request`} className="text-accent hover:underline">{CONTACT}</a>{" "}
              and we will action it.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
