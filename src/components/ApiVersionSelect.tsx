import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { API_VERSIONS, useApiVersion, type ApiVersion } from "@/config/apiVersion";

/* Dropdown to switch the data view between the official v2 score and the v3
   shadow preview. When v3 is active, callers should render ShadowBanner. */
export function ApiVersionSelect({ className = "" }: { className?: string }) {
  const { version, setVersion } = useApiVersion();
  return (
    <label className={`inline-flex items-center gap-2 text-xs ${className}`}>
      <span className="text-muted-foreground">Methodology version</span>
      <select
        value={version}
        onChange={(e) => setVersion(e.target.value as ApiVersion)}
        className={`h-8 rounded-md border bg-background/60 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${
          version === "v3" ? "border-amber-400/50 text-amber-300" : "border-border/60"
        }`}
      >
        {API_VERSIONS.map((v) => (
          <option key={v.value} value={v.value}>{v.label}</option>
        ))}
      </select>
    </label>
  );
}

/* Persistent SHADOW banner shown on any data page while v3 is selected. */
export function ShadowBanner() {
  return (
    <div className="mb-6 rounded-2xl border-2 border-dashed border-amber-400/50 bg-amber-400/5 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
      <div className="text-sm">
        <div className="font-semibold text-amber-300">SHADOW — v3 in validation · does not affect published scores or $SHE supply mechanics</div>
        <p className="text-muted-foreground mt-0.5">
          You're previewing the v3 expansion methodology. Its four candidate pillars (Bodily Autonomy, Dignity &amp; Welfare,
          Digital &amp; Social, expanded Safety &amp; Justice) are still gathering data and <strong>do not yet change the score</strong>,
          so v3 currently matches v2. Full shadow scores appear on{" "}
          <Link to="/lab" className="text-accent hover:underline">The Lab</Link> when the data API is online.
        </p>
      </div>
    </div>
  );
}
