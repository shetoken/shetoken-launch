import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { CountryWEI } from "@/lib/api";

// world-atlas@2 via npm CDN — uses ISO 3166-1 numeric feature IDs
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO 3166-1 numeric → alpha-3 lookup (matches world-atlas feature ids to our API's iso_code)
const NUM_TO_ISO3: Record<string, string> = {
  "4": "AFG", "8": "ALB", "12": "DZA", "24": "AGO", "32": "ARG",
  "36": "AUS", "40": "AUT", "31": "AZE", "50": "BGD", "56": "BEL",
  "64": "BTN", "68": "BOL", "70": "BIH", "76": "BRA", "100": "BGR",
  "104": "MMR", "108": "BDI", "112": "BLR", "116": "KHM", "120": "CMR",
  "124": "CAN", "140": "CAF", "144": "LKA", "148": "TCD", "152": "CHL",
  "156": "CHN", "170": "COL", "178": "COG", "180": "COD", "188": "CRI",
  "191": "HRV", "192": "CUB", "196": "CYP", "203": "CZE", "204": "BEN",
  "208": "DNK", "214": "DOM", "218": "ECU", "222": "SLV", "231": "ETH",
  "232": "ERI", "233": "EST", "246": "FIN", "250": "FRA", "266": "GAB",
  "268": "GEO", "276": "DEU", "288": "GHA", "300": "GRC", "320": "GTM",
  "324": "GIN", "332": "HTI", "340": "HND", "348": "HUN", "356": "IND",
  "360": "IDN", "364": "IRN", "368": "IRQ", "372": "IRL", "376": "ISR",
  "380": "ITA", "384": "CIV", "388": "JAM", "392": "JPN", "398": "KAZ",
  "400": "JOR", "404": "KEN", "408": "PRK", "410": "KOR", "414": "KWT",
  "417": "KGZ", "418": "LAO", "422": "LBN", "428": "LVA", "430": "LBR",
  "434": "LBY", "440": "LTU", "450": "MDG", "454": "MWI", "458": "MYS",
  "462": "MDV", "466": "MLI", "484": "MEX", "496": "MNG", "498": "MDA",
  "504": "MAR", "508": "MOZ", "516": "NAM", "524": "NPL", "528": "NLD",
  "554": "NZL", "558": "NIC", "562": "NER", "566": "NGA", "578": "NOR",
  "586": "PAK", "591": "PAN", "598": "PNG", "600": "PRY", "604": "PER",
  "608": "PHL", "616": "POL", "620": "PRT", "630": "PRI", "634": "QAT",
  "642": "ROU", "643": "RUS", "646": "RWA", "682": "SAU", "686": "SEN",
  "694": "SLE", "702": "SGP", "703": "SVK", "704": "VNM", "706": "SOM",
  "710": "ZAF", "716": "ZWE", "724": "ESP", "728": "SSD", "729": "SDN",
  "740": "SUR", "748": "SWZ", "752": "SWE", "756": "CHE", "760": "SYR",
  "762": "TJK", "764": "THA", "768": "TGO", "780": "TTO", "784": "ARE",
  "788": "TUN", "792": "TUR", "795": "TKM", "800": "UGA", "804": "UKR",
  "807": "MKD", "818": "EGY", "826": "GBR", "834": "TZA", "840": "USA",
  "854": "BFA", "858": "URY", "860": "UZB", "862": "VEN", "887": "YEM",
  "894": "ZMB", "51": "ARM", "417": "KGZ",
};

function scoreToColor(score: number | undefined): string {
  if (score == null) return "#1e293b";
  if (score >= 75) return "#10b981";
  if (score >= 60) return "#22c55e";
  if (score >= 45) return "#eab308";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

const TIER_LABELS: Record<number, string> = {
  1: "Preferred",
  2: "Acceptable",
  3: "Caution",
  4: "Critical",
};

const TIER_COLORS: Record<number, string> = {
  1: "text-emerald-400",
  2: "text-yellow-400",
  3: "text-orange-400",
  4: "text-red-400",
};

interface TooltipState {
  country: string;
  iso: string;
  score: number;
  tier: number;
  x: number;
  y: number;
}

export function WorldMap({ countries }: { countries: CountryWEI[] }) {
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Build lookup: iso_code → CountryWEI
  const scoreMap = useMemo(
    () => new Map(countries.map((c) => [c.iso_code, c])),
    [countries]
  );

  const getDataForGeo = useCallback(
    (geo: { id?: string | number }) => {
      const numericId = String(geo.id ?? "");
      const iso3 = NUM_TO_ISO3[numericId];
      return iso3 ? scoreMap.get(iso3) ?? null : null;
    },
    [scoreMap]
  );

  const handleEnter = useCallback(
    (geo: { id?: string | number }, evt: React.MouseEvent) => {
      const data = getDataForGeo(geo);
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
    [getDataForGeo]
  );

  const handleMove = useCallback((evt: React.MouseEvent) => {
    setTooltip((t) => (t ? { ...t, x: evt.clientX, y: evt.clientY } : null));
  }, []);

  const handleLeave = useCallback(() => setTooltip(null), []);

  const handleClick = useCallback(
    (geo: { id?: string | number }) => {
      const data = getDataForGeo(geo);
      if (data) navigate(`/country/${data.iso_code}`);
    },
    [getDataForGeo, navigate]
  );

  return (
    <div className="relative w-full select-none">
      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-card border border-border/60 rounded-xl px-4 py-3 shadow-card text-sm"
          style={{ left: tooltip.x + 16, top: tooltip.y - 84 }}
        >
          <p className="font-semibold">{tooltip.country}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            WEI Score:{" "}
            <span className="font-bold text-foreground">{tooltip.score.toFixed(1)}</span>
            {" · "}
            <span className={TIER_COLORS[tooltip.tier]}>
              {TIER_LABELS[tooltip.tier]}
            </span>
          </p>
          <p className="text-xs text-accent mt-1">Click to explore →</p>
        </div>
      )}

      {/* Map canvas */}
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
                  const data = getDataForGeo(geo);
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center mt-4 text-xs text-muted-foreground">
        {[
          { color: "#10b981", label: "75+  Preferred" },
          { color: "#22c55e", label: "60–74  Good" },
          { color: "#eab308", label: "45–59  Moderate" },
          { color: "#f97316", label: "30–44  At risk" },
          { color: "#ef4444", label: "<30  Critical" },
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
