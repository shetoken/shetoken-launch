import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const BASE_URL = "https://www.shetoken.org";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = "SHEtoken";

export function SEO({
  title = "SHEtoken — The World's First SHE Score Token",
  description = "SHE is the world's first data-backed cryptocurrency algorithmically tied to the SHE Score. $SHE goes up when the world gets better for women.",
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = "website",
}: SEOProps) {
  const fullTitle = title.includes("SHEtoken") ? title : `${title} | SHEtoken`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ShetokenDAO" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD — Organization + the SHE Score as a citable Dataset */}
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "name": "SHEtoken",
            "url": BASE_URL,
            "description": description,
            "sameAs": [
              "https://twitter.com/ShetokenDAO",
              "https://github.com/shetoken",
            ],
          },
          {
            "@type": "Dataset",
            "name": "SHE Score",
            "alternateName": "SHE Score",
            "description":
              "Data-backed SHE Score scoring 105 countries 0–100 across 8 weighted pillars (empowerment, bodily autonomy, safety & justice, education, economic, health, dignity & welfare, digital & social) minus a violence penalty. Updated weekly from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data.",
            "url": `${BASE_URL}/dashboard`,
            "keywords": ["women's empowerment", "gender equality index", "SHE Score", "gender data", "femicide", "maternal mortality"],
            "creator": { "@type": "Organization", "name": "SHEtoken" },
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "isAccessibleForFree": true,
            "distribution": [{
              "@type": "DataDownload",
              "encodingFormat": "application/json",
              "contentUrl": "https://api.shetoken.org/v1/wei/countries",
            }],
          },
        ],
      })}</script>
    </Helmet>
  );
}

export function CountrySEO({ country, iso, score, region }: {
  country: string; iso: string; score: number; region: string;
}) {
  const url = `${BASE_URL}/country/${iso}`;
  const title = `${country} SHE Score 2026 — SHE Score ${score}`;
  const description = `${country}'s SHE Score is ${score}/100 in 2026. Explore all 8 pillar scores, the 2015–2024 trend, and the Life Path for 100 girls in ${country}. Part of SHEtoken's global gender accountability index covering 105 countries.`;
  return (
    <>
      <SEO title={title} description={description} url={url} type="article" />
      <Helmet>
        {/* Per-country Dataset + breadcrumb so the score is citable by AI/search */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Dataset",
              "name": `${country} — SHE Score ${new Date().getFullYear()}`,
              "description": `${country} (${region}) scores ${score}/100 on the SHEtoken SHE Score.`,
              "url": url,
              "variableMeasured": "SHE Score, 0–100",
              "creator": { "@type": "Organization", "name": "SHEtoken" },
              "isAccessibleForFree": true,
              "distribution": [{
                "@type": "DataDownload",
                "encodingFormat": "application/json",
                "contentUrl": `https://api.shetoken.org/v1/wei/countries/${iso}`,
              }],
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Dashboard", "item": `${BASE_URL}/dashboard` },
                { "@type": "ListItem", "position": 2, "name": country, "item": url },
              ],
            },
          ],
        })}</script>
      </Helmet>
    </>
  );
}
