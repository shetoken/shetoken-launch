import { jsPDF } from "jspdf";
import { PW, PH, M, C, type RGB, paintBackground, headerBand, pageFooter, panel, drawTable, getLogoDataUrl } from "@/lib/pdfTheme";

const SUBTITLE = "Whitepaper · v2.0 · May 2026 · $SHE";
const CONTENT_W = PW - 2 * M;
const BOTTOM = PH - 46; // keep clear of the footer

/** Generate and download the full SHEtoken whitepaper, styled to match the website. */
export async function downloadWhitepaper() {
  const logo = await getLogoDataUrl();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let page = 1;
  let y = 0;

  const startPage = (first = false) => {
    if (!first) {
      doc.addPage();
      page += 1;
    }
    paintBackground(doc);
    headerBand(doc, SUBTITLE, logo);
    pageFooter(doc, "© 2026 SHE Foundation · Informational only — not financial advice.", `shetoken.org  ·  p.${page}`);
    y = 92;
  };

  const ensure = (h: number) => { if (y + h > BOTTOM) startPage(); };

  const heading = (num: string, text: string) => {
    ensure(40);
    y += 8;
    // purple number chip + gold title (echoes the site's purple→gold gradient)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    if (num) {
      doc.setFillColor(...C.purple);
      doc.roundedRect(M, y - 11, 18, 16, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(num, M + 9, y + 1, { align: "center" });
    }
    doc.setTextColor(...C.gold);
    doc.text(text, M + (num ? 26 : 0), y);
    y += 16;
  };

  const para = (text: string, color: RGB = C.mut, opts: { size?: number; italic?: boolean; gap?: number } = {}) => {
    const size = opts.size ?? 9.5;
    const lineH = size * 1.42;
    doc.setFont("helvetica", opts.italic ? "italic" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    lines.forEach((ln: string) => { ensure(lineH); doc.text(ln, M, y + lineH * 0.8); y += lineH; });
    y += opts.gap ?? 6;
  };

  const bullet = (text: string, dot: RGB) => {
    const size = 9.5;
    const lineH = size * 1.42;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, CONTENT_W - 18);
    ensure(lineH * lines.length);
    doc.setFillColor(...dot);
    doc.circle(M + 4, y + lineH * 0.55, 2.4, "F");
    doc.setTextColor(...C.ink);
    lines.forEach((ln: string, i: number) => doc.text(ln, M + 16, y + lineH * 0.8 + i * lineH));
    y += lineH * lines.length + 3;
  };

  const formulaBox = (title: string, lines: string[]) => {
    const lineH = 12;
    const h = 18 + lines.length * lineH + 10;
    ensure(h + 6);
    panel(doc, M, y, CONTENT_W, h, C.card);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.gold);
    doc.text(title, M + 12, y + 16);
    doc.setFont("courier", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.mut);
    lines.forEach((ln, i) => doc.text(ln, M + 12, y + 30 + i * lineH));
    y += h + 8;
  };

  const table = (headers: string[], rows: string[][], weights?: number[]) => {
    ensure(60);
    y = drawTable(doc, {
      x: M, width: CONTENT_W, startY: y, headers, rows, weights,
      bottomLimit: BOTTOM,
      onBreak: () => { startPage(); return y; },
    });
    y += 12;
  };

  // ════════════════════════════════════════════════════════════════════════
  startPage(true);

  // Title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...C.ink);
  doc.text("The SHEtoken Whitepaper", M, y + 12);
  y += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.mut);
  para("The world's first data-backed gender-accountability token — methodology, tokenomics, and investment framework.", C.mut, { size: 10.5, gap: 10 });

  // Version banner
  panel(doc, M, y, CONTENT_W, 26, C.cardTop);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.gold);
  doc.text("SHEtoken Whitepaper · Version 2.0 · May 2026 · Ticker: $SHE", M + 12, y + 17);
  y += 38;

  heading("", "Abstract");
  para(
    "SHE (the Women's Empowerment Index Token) is the world's first data-backed cryptocurrency whose value is " +
    "algorithmically tied to real-world women's empowerment outcomes. SHE's value is governed by the Women's " +
    "Empowerment Index (WEI) — a composite annual score measuring female literacy, economic empowerment, safety " +
    "from crime, poverty levels, and political participation across every nation and major state or province."
  );
  bullet("When women's conditions improve, tokens are minted.", C.emerald);
  bullet("When crimes against women rise or female poverty deepens, tokens are burned.", C.red);
  para(
    "Mission: To make the advancement of women's rights financially measurable, publicly transparent, and globally " +
    "investable — so that the world's progress on gender equality is not just moral, but economic.",
    C.ink, { italic: true, gap: 8 }
  );

  heading("1", "The Problem");
  table(
    ["Indicator", "Scale", "Source"],
    [
      ["Violence against women", "1 in 3 women experience physical/sexual violence globally", "WHO 2021"],
      ["Female literacy gap", "Two-thirds of the world's illiterate adults are women", "UNESCO"],
      ["Feminization of poverty", "Women represent 70% of those in extreme poverty", "UN Women"],
      ["Political representation", "Only 26% of parliamentary seats held by women", "IPU 2024"],
      ["Gender pay gap", "Women earn 20% less than men on average", "ILO"],
    ],
    [1.1, 2.2, 0.9]
  );
  para(
    "No single public-facing tool simultaneously measures, penalises, and rewards progress across all these " +
    "dimensions. Existing indices are for researchers. Existing women-focused crypto is speculative. SHE bridges this gap."
  );

  heading("2", "The WEI Formula v3.0");
  para(
    "The Women's Empowerment Index (WEI) is calculated annually for each country on a 0–100 scale, covering " +
    "8 weighted pillars plus a violence penalty:"
  );
  table(
    ["Pillar", "Weight", "Key Indicators"],
    [
      ["Empowerment", "15%", "Parliamentary seats, ministerial roles, legal rights, freedom of movement"],
      ["Bodily Autonomy", "15%", "Reproductive rights, child marriage, FGM, period poverty — new in v3.0"],
      ["Safety & Justice", "14%", "DV laws, femicide, honour-based violence, legal aid, police responsiveness"],
      ["Education", "12%", "Literacy, enrollment, STEM, menstrual barriers to attendance"],
      ["Economic Inclusion", "12%", "Pay gap, formal employment, banking access, property rights"],
      ["Health & Survival", "12%", "Maternal mortality, life expectancy, anaemia, cancer screening"],
      ["Dignity & Welfare", "10%", "Widow rights, caregiver burden, food insecurity, mental health"],
      ["Digital & Social", "10%", "Online harassment, internet & mobile gender gaps — new in v3.0"],
      ["Violence Penalty", "-10%", "Rape, acid attacks, dowry violence, femicide — subtracted from score"],
    ],
    [1.2, 0.7, 3]
  );
  formulaBox("WEI Formula", [
    "WEI = (Empowerment x 0.15) + (Bodily Autonomy x 0.15) + (Safety x 0.14)",
    "      + (Education x 0.12) + (Economic x 0.12) + (Health x 0.12)",
    "      + (Dignity x 0.10) + (Digital x 0.10) - (Violence Penalty x 0.10)",
  ]);
  table(
    ["Tier", "WEI Score", "Description"],
    [
      ["Tier 1 — Preferred", "70+", "High-performing nations (Nordic, Canada, NZ) — recommended for investment"],
      ["Tier 2 — Acceptable", "45–69", "Mid-performing, showing progress"],
      ["Tier 3 — Caution", "20–44", "Significant gender gaps"],
      ["Tier 4 — Avoid", "<20", "Crisis-level gender inequality"],
    ],
    [1.3, 0.8, 3]
  );

  heading("3", "Tokenomics");
  table(
    ["Parameter", "Value"],
    [
      ["Token Name", "SHE (Women's Empowerment Index Token)"],
      ["Ticker", "$SHE"],
      ["Blockchain", "Ethereum ERC-20 + Polygon L2"],
      ["Total Supply", "1,000,000,000 SHE"],
      ["Smart Contract", "CertiK + OpenZeppelin audit (pre-launch)"],
    ],
    [1, 2.2]
  );
  table(
    ["Allocation", "%"],
    [
      ["Public Sale / Community", "40%"],
      ["WEI Impact Fund", "25%"],
      ["Founding Team (3-year vesting)", "15%"],
      ["Ecosystem & Partnerships", "10%"],
      ["Reserve & Liquidity", "10%"],
    ],
    [3, 1]
  );

  heading("4", "Geographic Investment Tiers");
  table(
    ["Tier", "Token Format", "Description", "Launch"],
    [
      ["Global Index", "$SHE", "Tracks worldwide WEI score. One token, whole world", "Year 1"],
      ["Country Sub-Token", "$SHE-IND, $SHE-NGA, $SHE-USA", "Each country pegged to its own national WEI score", "Year 2"],
      ["State / Province Token", "$SHE-WB, $SHE-KL, $SHE-MH", "State-level tokens. Profit directly from local programs", "Year 3"],
    ],
    [1, 1.3, 2, 0.6]
  );

  heading("5", "India as a Model");
  para("India provides the most compelling real-world proof that targeted programs measurably improve women's empowerment.");
  table(
    ["Scheme", "Scale", "WEI Pillar"],
    [
      ["Lakshmi Bhandar (West Bengal)", "24.1M beneficiaries — direct cash Rs 1,500–1,700/month", "Economic Inclusion"],
      ["Kanyashree (West Bengal)", "10M girls — UNESCO top honour winner", "Education & Literacy"],
      ["Kudumbashree (Kerala)", "Asia's largest women's SHG network — 46 lakh members", "Economic, Education, Health"],
      ["JEEViKA (Bihar)", "1.04M SHGs — Rs 11,000+ crore in bank credit leveraged", "Economic Inclusion"],
      ["Educate Girls (Rajasthan/MP)", "6.7M beneficiaries — 380,000+ girls enrolled", "Education & Literacy"],
    ],
    [1.4, 2.4, 1.1]
  );

  heading("6", "Data Sources");
  table(
    ["Source", "Data Provided"],
    [
      ["UN Women", "Political empowerment, legal protections, violence statistics"],
      ["World Bank Gender Data Portal", "Economic participation, poverty rates, financial inclusion"],
      ["UNESCO Institute for Statistics", "Female literacy rates, school enrollment, education completion"],
      ["UNODC (UN Crime Office)", "Femicide rates, sexual violence reporting, trafficking statistics"],
      ["WHO Global Health Observatory", "Maternal mortality, reproductive health, life expectancy"],
      ["ILO", "Gender pay gap, labour force participation rates"],
      ["OECD SIGI", "Social norms, inheritance rights, legal discrimination"],
    ],
    [1.2, 2.4]
  );

  heading("7", "Roadmap");
  table(
    ["Phase", "Timeline", "Key Milestone"],
    [
      ["Foundation", "Months 1–3", "Whitepaper, WEI formula, shetoken.org live"],
      ["Build", "Months 4–6", "Smart contract dev, NGO outreach, institutional pitches"],
      ["Testnet", "Months 7–9", "Ethereum testnet, Chainlink oracle, DAO governance"],
      ["Mainnet", "Months 10–12", "Public token sale, Uniswap V3, CoinGecko listing"],
      ["Country Tokens", "Year 2", "$SHE-IND, $SHE-NGA, $SHE-USA + 10 more"],
      ["State Tokens", "Year 3", "$SHE-WB, $SHE-KL, $SHE-MH, NGO portal"],
      ["Scale", "Year 4+", "UN Women partnership, 50+ country tokens"],
    ],
    [1, 1, 2.6]
  );

  heading("8", "Legal Disclaimer");
  para(
    "This whitepaper is for informational purposes only and does not constitute financial, investment, or legal advice. " +
    "Cryptocurrency investments carry significant risk. SHEtoken is in pre-launch phase and no tokens are currently " +
    "available for purchase. Past performance of any index does not guarantee future token value. Please consult a " +
    "qualified financial advisor before making any investment decisions.",
    C.mut, { size: 8.5 }
  );

  // Partner CTA
  ensure(60);
  y += 6;
  panel(doc, M, y, CONTENT_W, 48, C.card);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.gold);
  doc.text("Interested in partnering?", PW / 2, y + 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.mut);
  doc.text("We welcome impact investors, NGOs, government partners, and Web3 infrastructure providers.", PW / 2, y + 31, { align: "center" });
  doc.setTextColor(...C.ink);
  doc.text("contact@shetoken.org", PW / 2, y + 42, { align: "center" });

  doc.save("SHEtoken-Whitepaper-v2.0.pdf");
}
