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
  title = "SHEtoken — The World's First Women's Empowerment Index Token",
  description = "SHE is the world's first data-backed cryptocurrency algorithmically tied to the Women's Empowerment Index. $SHE goes up when the world gets better for women.",
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

      {/* JSON-LD */}
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "SHEtoken",
        "url": BASE_URL,
        "description": description,
        "sameAs": [
          "https://twitter.com/ShetokenDAO",
          "https://github.com/shetoken",
        ],
      })}</script>
    </Helmet>
  );
}

export function CountrySEO({ country, iso, score, region }: {
  country: string; iso: string; score: number; region: string;
}) {
  return (
    <SEO
      title={`${country} Women's Empowerment Index Score 2026 — WEI ${score}`}
      description={`${country}'s WEI score is ${score}/100 in 2026. Explore all 8 pillar scores, historical trends, and the Life Path for women in ${country}. Part of SHEtoken's global gender accountability index covering 105 countries.`}
      url={`${BASE_URL}/country/${iso}`}
      type="article"
    />
  );
}
