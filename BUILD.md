# CNC Precision Machines — Website Build Doc

> The history of how this was made. Update the Build Log every time the project is touched.

## What it is
This is a rebuild of the public website for CNC Precision Machines International, LLC, an El Paso, TX machine-tool distributor and service company serving El Paso, New Mexico and Northern Mexico. It replaces the existing cncprecision.com.

The site has five pages (Home, About, Products, Services, Contact), plus downloadable English and Spanish PDF brochures. It is currently served as a preview on GitHub Pages at https://stevensamaniego.github.io/cncprecision.com/, pending the client's go-ahead for the DNS cutover.

## Stack & architecture
- **Front end:** plain static HTML, CSS and JavaScript. There is no framework and no build step.
  - Pages: `index.html`, `about.html`, `products.html`, `services.html`, `contact.html`
  - Styles: `css/style.css`
  - Scripts: `js/` (site behaviour, client-side search, intro animation)
- **Libraries (CDN):** GSAP 3.12.5 + ScrollTrigger (cdnjs) on all pages; Swiper 11 (jsDelivr) on the home page machine showcase.
- **Fonts:** Google Fonts (Bebas Neue, Inter, IBM Plex Mono).
- **Maps:** OpenStreetMap embed iframes on About and Contact. They use a fixed bounding box around the US–Mexico border, centered on El Paso and locked against pan/zoom.
- **Intro animation:** canvas-based laser trace, blueprint grid, sparks and coolant mist, plus a 6-axis logo reveal. It respects `prefers-reduced-motion` and is lighter on mobile.
- **Search:** client-side keyword index in JS. Results deep-link into the Products accordion via the URL hash.
- **Brochures:**
  - Source pages: `brochure.html` (EN) and `brochure-es.html` (ES)
  - Rendered to PDF with Puppeteer: `assets/CNC-Precision-Brochure-EN.pdf` and `-ES.pdf`
  - Brochure images: `assets/brochure-images/`
- **Assets:** `assets/logos/` (partner/brand logos and CNC logos), `assets/images/` (machine photos), `assets/videos/splash.mp4`.
- **Hosting:** GitHub Pages, legacy build from `main` at `/`. No custom domain is set (CNAME removed 2026-03-17).

## How to run, build, deploy
- **Local:** open the HTML files directly or serve the folder with any static server (e.g. `python3 -m http.server`).
- **Build:** none for the site itself.
- **Brochure PDFs:** render `brochure.html` and `brochure-es.html` with Puppeteer, using its native footer for page numbers, letter size, and the `@page` margins in the HTML. The Puppeteer script is **not in the repo**; only the generated PDFs are committed.
- **Deploy:** push to `main` and GitHub Pages rebuilds automatically.

## Configuration
- No env vars, secrets, or server-side code.
- External links point to partner/vendor websites and the client's Instagram.

## Key decisions
- 2026-03-17 — Rebuild as a static 5-page site on GitHub Pages, using content and assets scraped from the existing site (15 partner logos, 6 machine images). Notes describe GitHub Pages as preview-phase hosting.
- 2026-03-17 — Remove the CNAME (016cb25, by Steven). The site is served at the github.io preview URL instead of cncprecision.com. Reason not recorded; notes say DNS cutover waits on client approval.
- 2026-03-17 — Splash animation built to echo the original site's intro video. An SVG path-tracing version was rejected; the sparks/lasers version was approved. A working baseline was committed first (cba7253) so later attempts could be compared or reverted.
- 2026-03-17 — Stock-image backgrounds tested and rejected. Steven preferred a clean flat design.
- 2026-03-17 — Link every partner logo and product brand name to the vendor's website (7854973). Reason not recorded.
- 2026-03-19 — "Premium" cinematic rebuild with Swiper + GSAP (53e388c → d0c313b). This responded to client feedback asking for a less bland design, all machines on the home page, a 3D red/white/blue logo, and a copyright year of 2000 instead of 1998.
- 2026-03-26 — Use the client-supplied 3D logo. A clean transparent PNG (`CNC-3D-LOGO-NEW.png`) replaced the JPG and blend-mode workaround.
- 2026-03-26 — Full-page spark/laser background effects tried and then reverted (be180dc → adaec7b). A dedicated CNC-themed intro was used instead (d0705cf); notes record that it was approved.
- 2026-03-26 — Replace the outdated 14-page Spanish brochure PDF with a modern brochure matching the new site, in English and Spanish, generated from HTML.
- 2026-03-26 — Brochure page numbers use Puppeteer's native footer instead of HTML footers (dbb2f5a). Reason: consistent bottom placement on every page.
- 2026-04-14 — Intro sound effect skipped. It was recommended against and Steven agreed.
- 2026-04-14 — Lock maps against pan/zoom, centered on El Paso; show partner logos in full color instead of grayscale (9c994c3). Reason not recorded.

## Build log
### 2026-03-17 — Initial rebuild and splash animation
- cba7253: first full site (5 pages, `css/style.css`, `js/main.js`, `js/splash.js`, scraped logos/images, `splash.mp4`). Committed as a working "v1 baseline" splash.
- 459e8c0: splash v2, with the logo built by lasers and sparks and a progressive bottom-to-top reveal.
- 016cb25: CNAME deleted (Steven).
- 7854973: vendor hyperlinks on all partner logos and product brand names.

### 2026-03-19 — Client feedback round 1: "less bland"
- 53e388c, c6eebce, d0c313b: 3D logo, machine overview/showcase, cinematic redesign using Swiper and GSAP.

### 2026-03-26 — Round 2 polish, CNC intro, Round 3, PDF brochure (long session)
- **Midday content fixes:**
  - b132062: Open Graph tags with the 3D logo on all pages
  - 0728d99: embedded coverage map on About
  - db85234: Why Choose Us copy
  - d5c0bf3: Services rewrite
  - f51138a: Contact map was rendering black-and-white because of a `saturate(0)` filter; removed it
- **Logo:**
  - 84faa2c: client's 3D logo in the preloader and Who We Are section
  - 0a1e7d4: `mix-blend-mode: lighten` workaround
  - b9df92f: replaced with the transparent PNG
- **Bug:** service cards disappeared on the Services page because of a double animation (fade-in class plus a dedicated GSAP animation). Fixed in 4d21caf with a CSS `opacity:1` fallback. 52259d0 removed `rotateX` skew from the cards.
- **Animation experiments:**
  - 1b8b31c: overhaul
  - 9e66f41: CNC sparks/laser dividers
  - be180dc: heavier effects
  - e9a1ead: canvas z-index fix
  - a3d19be, 1d255da, adaec7b: reverted to the pre-effects state
- **Final intro:**
  - de80c82: transparent PNG in the preloader
  - d0705cf: 5-stage intro (laser line, blueprint grid, laser trace, 6-axis logo reveal, letter-by-letter name)
  - 6cdd393, 48b06cb, d439ce9, f012df8: oval shape, size and position tuning
- **Round 3** (4f25976): 19-category Products accordion, partner list updates, iPad scroll fix, coverage map markings, About text, Why Choose Us fix.
- **Partner logos:**
  - df5d143, 13de8e4: new logos for Chevalier, Hanwha, CRESS, EDGE, TAKAMAZ, Gorman, Engineered Filtration, then fixed on the Products page too
  - e3bdb62 → bb4de6f: repeated tweaks to make the Hanwha and EDGE logos readable on the dark background. Final state: Hanwha file supplied by Steven, scaled only; EDGE recolored white with its original transparency kept.
  - Problem: palette-indexed PNGs had to be converted to RGB before alpha/color edits worked.
- **PDF brochure:**
  - 770790a, 37a31de, d2a1d2d: created, linked from Products, white print background
  - 2512f41, 63373ab: alignment fixes, Spanish version, separate EN/ES downloads
  - 6cf7476, 2e07bd3: machine images added
  - dbb2f5a: Puppeteer native footer
  - 7a47a9e, bc7e905: flow-layout rewrite with `@page` rules, orphans/widows control and break rules
  - 6ddfde3, bd87390: richer content with brand logos; final EN and ES PDFs

### 2026-04-14 — Round 4
- 9c994c3:
  - "View More Machines" button
  - About map locked and centered on El Paso with a logo watermark
  - Contact map locked
  - full-color partner logos
  - 3D nav logo
- 13e58c0: the nav logo used the wrong SVG; swapped to the 3D logo PNG from the intro animation.

### 2026-04-15 — Round 5
- 00f4f5a:
  - The intro laser now samples the logo's alpha silhouette and traces its real contour, with a rounded-rect fallback.
  - Coverage maps widened to the full US–Mexico border, Tijuana to Brownsville plus Albuquerque.
  - Instagram icon added to the footer.
  - Client-side site search added, with deep links into the accordion.

### 2026-06-17 — Round 6
- 942f503: coverage maps, Instagram visibility, Our Story image, partner brands update (14 new SVG brand logos).

### 2026-06-19 — Coverage map expansion
- 69816d7: coverage map expanded south (Sonora, Chihuahua, Monterrey), city labels removed, About and Contact kept in sync.
- A standalone `coverage-map.html` and `coverage-map-preview.png` were created locally the same evening. They are **not committed**.

### 2026-10-06 — Build doc
- Added this BUILD.md, reconstructed from git history and project notes.

**Who:**
- Commits are authored as Orion (AI assistant). Many carry Claude Code (Claude Opus 4.6) co-author trailers.
- Steven made 016cb25 and supplied the Hanwha logo file.
- Design direction came from Steven and the client's feedback rounds.

## Current status & next steps
- **Status:** live preview on GitHub Pages. All requested changes through Round 6 are done.
- **Waiting on:** the client's approval for the DNS cutover to cncprecision.com. When it comes, re-add a CNAME and point DNS.
- **Open:** the untracked `coverage-map.html` / `coverage-map-preview.png` need to be committed or discarded.
- **Gap:** the Puppeteer brochure-render script isn't versioned. Recreate it before the next brochure change.

## Gotchas
- **Palette-indexed PNG logos** need converting to RGB before any alpha or recolor work. Otherwise the edits silently fail.
- **Don't stack GSAP animations.** A generic fade-in class plus a dedicated GSAP animation on the same element can leave it invisible. Keep a CSS `opacity:1` fallback.
- **Canvas effects layered over content** need an explicit z-index. Heavy full-page particle effects were reverted, so prefer a contained intro.
- **Map embeds:** a CSS `saturate(0)` filter turns the map grayscale.
- **Brochure PDFs:**
  - Use Puppeteer's native footer, not HTML footers.
  - Use natural content flow with `@page` rules rather than fixed-height page divs.
  - Regenerate both EN and ES together.
- **Commit a working baseline** before each design experiment. Several rounds here were reverted.
- **Pushing to `main` deploys immediately.** There is no staging.
