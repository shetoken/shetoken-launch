import { useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import type { StateScore } from "@/lib/api";

interface Advisory { label: string; color: string; }
export interface CityLabel { city: string; state: string; coords: [number, number]; }

const norm = (s: string) => (s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
const ALIAS: Record<string, string> = {
  orissa: "odisha", telengana: "telangana", uttaranchal: "uttarakhand",
  nctofdelhi: "delhi", delhinct: "delhi", pondicherry: "puducherry",
};
const stateKey = (s: string) => { const n = norm(s); return ALIAS[n] || n; };

interface Hover { name: string; score: number | null; wei: number | null; advisory: Advisory | null; x: number; y: number; }

export function StateChoroplethMap({
  geoUrl, nameKey, projection, projectionConfig, states, advisoryFor, cities, height = 520,
}: {
  geoUrl: string;
  nameKey: string;
  projection: string;
  projectionConfig: Record<string, unknown>;
  states: StateScore[];
  advisoryFor: (score: number) => Advisory;
  cities?: CityLabel[];
  height?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const lookup = useMemo(() => {
    const m = new Map<string, StateScore>();
    states.forEach((s) => m.set(stateKey(s.state), s));
    return m;
  }, [states]);

  const pos = (e: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
  };
  // Use a functional updater so we always read the LATEST hover content.
  // A stale closure here would overwrite a freshly-entered state's name/score
  // with the previously-hovered state's data while keeping the new cursor
  // position — making tooltips look "mixed up" during continuous movement.
  const onMove = (e: React.MouseEvent) => {
    const p = pos(e);
    setHover((h) => (h ? { ...h, ...p } : h));
  };

  return (
    <div ref={wrapRef} className="relative bg-gradient-card border border-border/40 rounded-2xl p-1 shadow-card" onMouseMove={onMove}>
      <ComposableMap key={geoUrl} projection={projection} projectionConfig={projectionConfig}
                     width={800} height={height} style={{ width: "100%", height: "auto" }}>
        <Geographies key={geoUrl} geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const gname = (geo.properties?.[nameKey] as string) ?? "";
              const st = lookup.get(stateKey(gname));
              const adv = st ? advisoryFor(st.safety_justice_score ?? 0) : null;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => setHover({
                    name: st?.state ?? gname,
                    score: st ? (st.safety_justice_score ?? 0) : null,
                    wei: st ? (st.wei_score ?? 0) : null,
                    advisory: adv, ...pos(e),
                  })}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    default: { fill: adv ? `${adv.color}cc` : "hsl(260 18% 17%)", stroke: "hsl(260 25% 34%)", strokeWidth: 0.5, outline: "none" },
                    hover:   { fill: adv ? adv.color : "hsl(260 18% 22%)", stroke: "hsl(40 30% 80%)", strokeWidth: 0.9, outline: "none", cursor: "pointer" },
                    pressed: { fill: adv ? adv.color : "hsl(260 18% 22%)", outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {cities?.map((c) => (
          <Marker key={c.city} coordinates={c.coords} style={{ default: { pointerEvents: "none" } }}>
            <g style={{ pointerEvents: "none" }}>
              <circle r={2.4} fill="hsl(40 30% 92%)" stroke="hsl(260 35% 9%)" strokeWidth={0.6} />
              <text x={4} y={3} fontSize={9} fill="hsl(40 30% 92%)" style={{ paintOrder: "stroke" }}
                    stroke="hsl(260 35% 9%)" strokeWidth={2}>{c.city}</text>
            </g>
          </Marker>
        ))}
      </ComposableMap>

      {hover && (
        <div className="pointer-events-none absolute z-20 rounded-lg border bg-card/95 backdrop-blur px-3 py-2 shadow-xl text-xs w-52"
             style={{ left: Math.min(hover.x + 12, (wrapRef.current?.clientWidth ?? 300) - 220), top: Math.max(hover.y - 10, 0),
                      borderColor: hover.advisory ? `${hover.advisory.color}55` : "hsl(260 20% 30%)" }}>
          <div className="font-bold text-sm mb-1">{hover.name}</div>
          {hover.advisory ? (
            <>
              <div className="font-semibold mb-1.5" style={{ color: hover.advisory.color }}>{hover.advisory.label}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Safety &amp; Justice</span>
                <span className="font-medium" style={{ color: hover.advisory.color }}>{Number(hover.score).toFixed(0)}/100</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Overall WEI</span>
                <span className="font-medium">{Number(hover.wei).toFixed(1)}/100</span></div>
            </>
          ) : (
            <div className="text-muted-foreground">No safety data for this region.</div>
          )}
        </div>
      )}
    </div>
  );
}
