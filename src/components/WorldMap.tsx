import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { CountryWEI } from "@/lib/api";

// GeoJSON with ISO_A3 property — matches our API's iso_code field
const GEO_URL =
  "https://cdn.jsdelivr.net/gh/datasets/geo-countries@0.1.0/data/countries.geojson";

function scoreToColor(score: number | undefined): string {
  if (score == null) return "#1e293b";
  if (score >= 75) return "#10b981"; // emerald — Preferred
  if (score >= 60) return "#22c55e"; // green   — Good
  if (score >= 45) return "#eab308"; // yellow  — Moderate
  if (score >= 30) return "#f97316"; // orange  — At risk
  return "#ef4444";                  // red     — Critical
}

const TIER_LABELS: Record<number, string> = {
  1: "Preferred",
  2: "Acceptable",
  3: "Caution",
  4: "Critical",
};

interface TooltipState {
  country: string;
  iso: string;
  score: number;
  tier: number;
  x: number;
  y: number;
}

interface WorldMapProps {
  countries: CountryWEI[];
}

export function WorldMap({ countries }: WorldMapProps) {
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Build lookup map iso_code → CountryWEI
  const scoreMap = useMemo(
    () => new Map(countries.map((c) => [c.iso_code, c])),
    [countries]
  );

  const handleEnter = useCallback(
    (geo: { properties: { ISO_A3: string } }, evt: React.MouseEvent) => {
      const data = scoreMap.get(geo.properties.ISO_A3);
      if (data) {
        setTooltip({
          country: data.country,
          iso: data.iso_code,
          score: data.wei_score,
          tier: data.tier,
          x: evt.clientX,
          y: evt.clientY,
        });
      }
    },
    [scoreMap]
  );

  const handleMove = useCallback((evt: React.MouseEvent) => {
    setTooltip((t) => (t ? { ...t, x: evt.clientX, y: evt.clientY } : null));
  }, []);

  const handleLeave = useCallback(() => setTooltip(null), []);

  const handleClick = useCallback(
    (geo: { properties: { ISO_A3: string } }) => {
      const data = scoreMap.get(geo.properties.ISO_A3);
      if (data) navigate(`/country/${data.iso_code}`);
    },
    [scoreMap, navigate]
  );

  return (
    <div className="relative w-full select-none">
      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-card border border-border/60 rounded-xl px-4 py-3 shadow-card text-sm"
          style={{ left: tooltip.x + 16, top: tooltip.y - 80 }}
        >
          <p className="font-semibold">{tooltip.country}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            WEI Score:{" "}
            <span className="font-bold text-foreground">{tooltip.score.toFixed(1)}</span>
            {" · "}
            <span
              className={
                tooltip.tier === 1
                  ? "text-emerald-400"
                  : tooltip.tier === 2
                  ? "text-yellow-400"
                  : tooltip.tier === 3
                  ? "text-orange-400"
                  : "text-red-400"
              }
            >
              {TIER_LABELS[tooltip.tier]}
            </span>
          </p>
          <p className="text-xs text-accent mt-1">Click to explore →</p>
        </div>
      )}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border/30 bg-[#0f172a]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 138, center: [10, 18] }}
          height={440}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup zoom={1} minZoom={0.7} maxZoom={8}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const iso: string = geo.properties.ISO_A3;
                  const data = scoreMap.get(iso);
                  const fill = scoreToColor(data?.wei_score);
                  const hasData = !!data;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="#0f172a"
                      strokeWidth={0.4}
                      style={{
                        default: {
                          outline: "none",
                          cursor: hasData ? "pointer" : "default",
                          transition: "fill 0.15s",
                        },
                        hover: {
                          outline: "none",
                          fill: hasData ? "#a78bfa" : fill,
                          cursor: hasData ? "pointer" : "default",
                        },
                        pressed: { outline: "none", fill: "#7c3aed" },
                      }}
                      onMouseEnter={(evt) => handleEnter(geo, evt)}
                      onMouseMove={handleMove}
                      onMouseLeave={handleLeave}
                      onClick={() => handleClick(geo)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Legend + hint */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center mt-4 text-xs text-muted-foreground">
        {[
          { color: "#10b981", label: "75+ Preferred" },
          { color: "#22c55e", label: "60–74 Good" },
          { color: "#eab308", label: "45–59 Moderate" },
          { color: "#f97316", label: "30–44 At risk" },
          { color: "#ef4444", label: "<30 Critical" },
          { color: "#1e293b", label: "No data" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground/40 mt-2">
        Scroll to zoom · Drag to pan · Click a country to explore
      </p>
    </div>
  );
}
