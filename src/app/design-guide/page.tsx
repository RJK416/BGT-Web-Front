import Link from "next/link";

const paletteClass =
  "rounded-xl border border-amber-900/40 bg-amber-950/60 shadow-lg p-4 space-y-3 md:p-6";

const fontClass =
  "grid gap-3 md:grid-cols-3 bg-amber-950/50 rounded-xl border border-amber-900/30 p-4";

const sectionTitleClass =
  "text-2xl md:text-3xl font-bold text-orange-300 mb-4 md:mb-6 tracking-[0.12em] uppercase";

const itemTitleClass =
  "text-sm md:text-base font-semibold text-amber-200 uppercase tracking-[0.2em]";

const colorRowClass =
  "grid grid-cols-[120px_1fr] md:grid-cols-[160px_220px_1fr] gap-3 md:gap-4 items-center text-sm md:text-base text-amber-200";

const colorSwatch = (hex: string) => (
  <span
    className="h-10 w-10 rounded-full border border-amber-900/40 shadow-md"
    style={{ backgroundColor: hex }}
    aria-hidden
  />
);

const ColorRow = ({
  label,
  name,
  hex,
  usage,
}: {
  label: string;
  name: string;
  hex: string;
  usage: string;
}) => (
  <div className={`${colorRowClass}`}>
    <span className="font-semibold text-orange-300">{label}</span>
    <div className="flex items-center gap-3">
      {colorSwatch(hex)}
      <div className="space-y-1">
        <div className="font-medium text-amber-100">{name}</div>
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
          {hex}
        </div>
      </div>
    </div>
    <p className="text-amber-200/90">{usage}</p>
  </div>
);

const FontRow = ({
  role,
  font,
  notes,
}: {
  role: string;
  font: string;
  notes: string;
}) => (
  <div className="bg-amber-950/40 rounded-lg border border-amber-900/30 p-4 space-y-2">
    <div className="flex flex-col gap-1">
      <div className="text-sm uppercase tracking-[0.3em] text-orange-300">
        {role}
      </div>
      <div className="text-lg font-semibold text-amber-100">{font}</div>
    </div>
    <p className="text-amber-200/80 text-sm">{notes}</p>
  </div>
);

export default function DesignGuidePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgba(8,47,35,0.98),rgba(4,30,24,0.95))] text-amber-100">
      <header className="border-b border-amber-900/40 bg-[linear-gradient(to_right,rgba(20,83,45,0.92),rgba(12,50,35,0.92))] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between md:py-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-orange-300 tracking-[0.18em] uppercase">
              Guild UI Style Scrolls
            </h1>
            <p className="mt-2 max-w-xl text-amber-200/80">
              Two alternate themes for the guild interface—Dark Tavern Mood and
              Vivid Emerald Guild—complete with palettes, typography, and layout
              guidance.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-amber-900/40 bg-amber-950/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-100 transition hover:bg-amber-900/60"
          >
            ← Back to Realms
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 md:py-12">
        {/* Version I */}
        <section className="space-y-6 rounded-2xl border border-amber-900/40 bg-amber-950/50 p-6 shadow-lg md:p-8">
          <div className="border-b border-amber-900/40 pb-4">
            <h2 className={sectionTitleClass}>Version I · Dark Tavern Mood</h2>
            <p className="text-amber-200/85">
              Low-light ambience, shimmering bronze highlights, and parchment
              typography for a late-night adventurer’s tavern.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className={itemTitleClass}>Color Palette</h3>
            <div className={`${paletteClass} space-y-4`}>
              <ColorRow
                label="Primary Background"
                name="Dark Forest Green"
                hex="#1C352D"
                usage="Main app background and header bar with a soft vignette."
              />
              <ColorRow
                label="Panel Backgrounds"
                name="Weathered Wood Brown"
                hex="#3B2A1E"
                usage="Player lists, tournament cards—apply subtle wood grain noise."
              />
              <ColorRow
                label="Accent Borders"
                name="Burnished Bronze"
                hex="#9C6B3E"
                usage="Card outlines, dividers, decorative flourishes."
              />
              <ColorRow
                label="Highlight / Button"
                name="Dragonfire Gold"
                hex="#E7B45D"
                usage="Buttons, XP fills, victory icons."
              />
              <ColorRow
                label="Primary Text"
                name="Parchment White"
                hex="#F4EBD0"
                usage="Headings, key stats; especially on darker backdrops."
              />
              <ColorRow
                label="Secondary Text"
                name="Ash Gray"
                hex="#B6AA96"
                usage="Labels, helper copy, muted metadata."
              />
              <ColorRow
                label="Error / Logout"
                name="Blood Red"
                hex="#802C2C"
                usage="Danger buttons, warning toasts."
              />
              <ColorRow
                label="Success Accent"
                name="Deep Emerald"
                hex="#3C7A57"
                usage="Affirmative actions, status badges."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className={itemTitleClass}>Fonts</h3>
            <div className={fontClass}>
              <FontRow
                role="Headers & Titles"
                font="Cinzel Decorative"
                notes="Use for major headings; combine with parchment text color."
              />
              <FontRow
                role="Body / UI Copy"
                font="Lora · Cardo"
                notes="Readable serifs for longer copy blocks and tooltips."
              />
              <FontRow
                role="Buttons & Stats"
                font="Inter"
                notes="Keep action labels crisp against textured backgrounds."
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className={itemTitleClass}>Placement Guidance</h3>
            <ul className="list-disc space-y-2 pl-5 text-amber-200/85">
              <li>
                Background base: Dark Forest Green with vignette corners and
                faint candle-glow.
              </li>
              <li>
                Panels: Weathered wood gradient, optional grain overlay (10%
                opacity).
              </li>
              <li>
                Headline text: Cinzel Decorative in Parchment White, all-caps,
                subtle letter spacing.
              </li>
              <li>XP bars: Bronze outline with Dragonfire Gold fill.</li>
              <li>
                Buttons: Dragonfire → Bronze gradient; use parchment text and
                slight emboss (inset shadow).
              </li>
              <li>
                Decorative borders: Burnished Bronze or Deep Mahogany (#2A1D12)
                for trim.
              </li>
            </ul>
          </div>
        </section>

        {/* Version II */}
        <section className="space-y-6 rounded-2xl border border-emerald-900/40 bg-emerald-950/50 p-6 shadow-lg md:p-8">
          <div className="border-b border-emerald-900/40 pb-4">
            <h2 className={`${sectionTitleClass} text-emerald-200`}>
              Version II · Vivid Emerald Guild
            </h2>
            <p className="text-emerald-100/85">
              Lush emerald backdrops, golden line-work, and glowing amber accents
              for a lively guild hall aesthetic.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className={`${itemTitleClass} text-emerald-200`}>
              Color Palette
            </h3>
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/60 p-4 md:p-6 space-y-4">
              <ColorRow
                label="Primary Background"
                name="Emerald Green"
                hex="#1F573D"
                usage="Navbar, page backdrop; consider animated motes for depth."
              />
              <ColorRow
                label="Panel Background"
                name="Warm Chestnut"
                hex="#5C331F"
                usage="Card containers with subtle inner shadow."
              />
              <ColorRow
                label="Accent / Lines"
                name="Goldleaf"
                hex="#D4A849"
                usage="Borders, icon strokes, score highlights."
              />
              <ColorRow
                label="Highlight Glow"
                name="Amber Fire"
                hex="#F2B045"
                usage="Hover halos, XP fill, glowing chips."
              />
              <ColorRow
                label="Primary Text"
                name="Ivory White"
                hex="#FFF5DC"
                usage="Headings and key stats on warm backgrounds."
              />
              <ColorRow
                label="Secondary Text"
                name="Sand Beige"
                hex="#D5C7A2"
                usage="Descriptions, metadata, tooltips."
              />
              <ColorRow
                label="Danger"
                name="Rustic Red"
                hex="#A93C32"
                usage="Logout, destructive actions, alerts."
              />
              <ColorRow
                label="Action"
                name="Jade Green"
                hex="#3F8758"
                usage="Primary CTA, “Open” or “Join” buttons."
              />
              <ColorRow
                label="Shadow"
                name="Deep Olive"
                hex="#12261C"
                usage="Drop shadows, elevated card edges."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className={`${itemTitleClass} text-emerald-200`}>Fonts</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 bg-emerald-950/60 rounded-xl border border-emerald-900/40 p-4">
              <FontRow
                role="Logo & Titles"
                font="Cinzel · Bold"
                notes="Display the guild name with gold leaf, uppercase."
              />
              <FontRow
                role="Body Text"
                font="Merriweather"
                notes="Warm serif for readable paragraphs and tooltips."
              />
              <FontRow
                role="Buttons / HUD"
                font="Nunito Sans"
                notes="Friendly sans-serif for badges, timers, microcopy."
              />
              <FontRow
                role="XP & Numbers"
                font="Oswald"
                notes="Tall condensed numerals; pairs well with glowing meters."
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className={`${itemTitleClass} text-emerald-200`}>
              Placement Guidance
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-emerald-100/85">
              <li>Navbar: Emerald Green base, Goldleaf text/icons.</li>
              <li>
                Player cards: Chestnut with inner shadow; animate Amber Fire
                glow on hover.
              </li>
              <li>
                Buttons: Gradient Jade → Gold on hover, Ivory text for contrast.
              </li>
              <li>XP Bars: Goldleaf outline, Amber Fire fill with sparkle.</li>
              <li>
                Guild crest area: Emerald shield, Goldleaf border, soft glow
                shadow (Deep Olive).
              </li>
              <li>
                Tournaments section: Chestnut frame, parchment-toned typography
                for high readability.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className={`${itemTitleClass} text-emerald-200`}>
              Optional Finishing Touches
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-emerald-100/85">
              <li>
                Overlay subtle grain / parchment texture (3–5% opacity) on all
                panels.
              </li>
              <li>
                Add candlelight gradients—Amber Fire to transparent—at edges for
                glow.
              </li>
              <li>
                Scatter small Goldleaf motes around headers for animated life.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

