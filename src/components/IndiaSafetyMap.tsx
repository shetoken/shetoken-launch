import { useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import type { StateScore } from "@/lib/api";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Advisory { label: string; color: string; }

/** One representative city per Indian state → [lng, lat]. */
const CITY: Record<string, { city: string; coords: [number, number] }> = {
  "Kerala":            { city: "Kochi",              coords: [76.27, 9.93] },
  "Goa":               { city: "Panaji",             coords: [73.83, 15.49] },
  "Tamil Nadu":        { city: "Chennai",            coords: [80.27, 13.08] },
  "Mizoram":           { city: "Aizawl",             coords: [92.72, 23.73] },
  "Meghalaya":         { city: "Shillong",           coords: [91.88, 25.57] },
  "Uttar Pradesh":     { city: "Lucknow",            coords: [80.95, 26.85] },
  "Bihar":             { city: "Patna",              coords: [85.14, 25.61] },
  "Madhya Pradesh":    { city: "Bhopal",             coords: [77.41, 23.26] },
  "Jharkhand":         { city: "Ranchi",             coords: [85.31, 23.34] },
  "Assam":             { city: "Guwahati",           coords: [91.75, 26.14] },
  "Rajasthan":         { city: "Jaipur",             coords: [75.79, 26.91] },
  "Haryana":           { city: "Gurugram",           coords: [77.03, 28.46] },
  "Chhattisgarh":      { city: "Raipur",             coords: [81.63, 21.25] },
  "Odisha":            { city: "Bhubaneswar",        coords: [85.82, 20.30] },
  "Delhi":             { city: "New Delhi",          coords: [77.21, 28.61] },
  "Gujarat":           { city: "Ahmedabad",          coords: [72.57, 23.03] },
  "West Bengal":       { city: "Kolkata",            coords: [88.36, 22.57] },
  "Maharashtra":       { city: "Mumbai",             coords: [72.88, 19.08] },
  "Punjab":            { city: "Ludhiana",           coords: [75.86, 30.90] },
  "Telangana":         { city: "Hyderabad",          coords: [78.49, 17.39] },
  "Karnataka":         { city: "Bengaluru",          coords: [77.59, 12.97] },
  "Manipur":           { city: "Imphal",             coords: [93.94, 24.82] },
  "Andhra Pradesh":    { city: "Visakhapatnam",      coords: [83.22, 17.69] },
  "Uttarakhand":       { city: "Dehradun",           coords: [78.03, 30.32] },
  "Himachal Pradesh":  { city: "Shimla",             coords: [77.17, 31.10] },
};

interface Hover { city: string; state: StateScore; x: number; y: number; }

export function IndiaSafetyMap({ states, advisoryFor }: {
  states: StateScore[];
  advisoryFor: (score: number) => Advisory;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const move = (e: React.MouseEvent) => {
    if (!hover) return;
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setHover({ ...hover, x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div ref={wrapRef} className="relative bg-gradient-card border border-border/40 rounded-2xl p-2 shadow-card" onMouseMove={move}>
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 1080, center: [82.5, 22.8] }}
                     width={760} height={560} style={{ width: "100%", height: "auto" }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.filter((g) => g.id === "356").map((g) => (
              <Geography key={g.rsmKey} geography={g}
                fill="hsl(260 22% 15%)" stroke="hsl(260 20% 32%)" strokeWidth={0.6}
                style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }} />
            ))
          }
        </Geographies>
        {states.map((s) => {
          const c = CITY[s.state];
          if (!c) return null;
          const a = advisoryFor(s.safety_justice_score ?? 0);
          const active = hover?.state.state_code === s.state_code;
          return (
            <Marker key={s.state_code} coordinates={c.coords}
              onMouseEnter={(e) => setHover({ city: c.city, state: s, x: 0, y: 0 })}
              onMouseLeave={() => setHover(null)}>
              <circle r={active ? 7 : 5} fill={a.color} stroke="hsl(260 35% 9%)" strokeWidth={1}
                      style={{ cursor: "pointer", transition: "r .1s" }} />
            </Marker>
          );
        })}
      </ComposableMap>

      {hover && (() => {
        const a = advisoryFor(hover.state.safety_justice_score ?? 0);
        return (
          <div className="pointer-events-none absolute z-20 rounded-lg border bg-card/95 backdrop-blur px-3 py-2 shadow-xl text-xs w-52"
               style={{ left: Math.min(hover.x + 12, (wrapRef.current?.clientWidth ?? 300) - 220), top: Math.max(hover.y - 10, 0), borderColor: `${a.color}55` }}>
            <div className="font-bold text-sm">{hover.city}</div>
            <div className="text-muted-foreground/70 mb-1.5">{hover.state.state}</div>
            <div className="font-semibold mb-1.5" style={{ color: a.color }}>{a.label}</div>
            <div className="flex justify-between"><span className="text-muted-foreground">Safety &amp; Justice</span><span className="font-medium" style={{ color: a.color }}>{Number(hover.state.safety_justice_score ?? 0).toFixed(0)}/100</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Overall WEI</span><span className="font-medium">{Number(hover.state.wei_score ?? 0).toFixed(1)}/100</span></div>
          </div>
        );
      })()}

      <p className="text-[10px] text-muted-foreground/50 text-center pb-1">Hover a city dot for its state's safety advisory.</p>
    </div>
  );
}
