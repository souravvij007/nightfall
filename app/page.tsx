import Link from "next/link";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#08080f] text-white">
      {/* ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-24 top-[-6rem] h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="animate-blob absolute right-[-6rem] top-40 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-3xl [animation-delay:3s]" />
        <div className="animate-blob absolute bottom-40 left-1/3 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl [animation-delay:6s]" />
      </div>

      <div className="relative">
        <MarketingNav />
        <Hero />
        <Marquee />
        <Features />
        <LevelLadder />
        <GenZBanner />
        <FinalCta />
        <Footer />
      </div>
    </div>
  );
}

function MarketingNav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-white/5 bg-[#08080f]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="text-xl">🌙</span> Nightfall
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/demo" className="hidden text-sm text-white/60 transition hover:text-white sm:block">
            How leveling works
          </Link>
          <Link href="/login" className="text-sm text-white/60 transition hover:text-white">
            Log in
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Join free
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/60">
            🌙 The after-dark social club
          </span>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Making friends
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              isn't hard anymore.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-white/60 lg:mx-0">
            Nightfall is where Gen&nbsp;Z actually meets. Play games in live rooms, pull up to real
            meetups, and travel with strangers who get you. The more you show up, the more you unlock.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/login"
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-7 py-3.5 text-center font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:opacity-95 sm:w-auto"
            >
              Join the club — it's free
            </Link>
            <Link
              href="/demo"
              className="w-full rounded-full border border-white/15 px-7 py-3.5 text-center font-semibold text-white/80 transition hover:bg-white/5 sm:w-auto"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/30">No awkward small talk required. Promise.</p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <PhoneMock />
        </div>
      </div>
    </header>
  );
}

/** Stylized app preview. */
function PhoneMock() {
  return (
    <div className="animate-float relative w-64 rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] p-3 shadow-2xl backdrop-blur-xl sm:w-72">
      <div className="rounded-[2rem] bg-[#0b0b16] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">🌙 Nightfall</span>
          <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300">
            LVL 7
          </span>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Level 7 · Gold</div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400" />
          </div>
          <div className="mt-1 text-[10px] text-white/40">320 pts to level 8</div>
        </div>
        <div className="mt-3 space-y-2">
          {["🎙️ Trivia Night is live · 24 in room", "📍 Rooftop Sundowner · Mumbai", "🧭 Himalayan Escape · 12 spots"].map(
            (t) => (
              <div key={t} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
                {t}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function Marquee() {
  const words = ["make friends", "play games", "live rooms", "real meetups", "stranger trips", "level up", "unlock hosting"];
  const row = [...words, ...words];
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-white/[0.02] py-4">
      <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8 text-lg font-semibold text-white/30">
            {w} <span className="text-fuchsia-400/60">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Features() {
  const items = [
    { icon: "🎙️", title: "Live A/V rooms", body: "Drop into audio-video rooms, play host-run games, win points. Hit Level 5 and host your own." },
    { icon: "📍", title: "Real meetups", body: "Browse meetups by city and date, grab your spot, and actually show up. Strangers → your people." },
    { icon: "🧭", title: "Stranger trips", body: "Weekend escapes with full itineraries and vetted stays. Travel with the club, come back with a crew." },
    { icon: "🏆", title: "Level up, unlock more", body: "Earn points for everything you do. Ranks, badges, and hosting powers you actually unlock." },
    { icon: "💬", title: "Slide into DMs", body: "Met someone in a room or at a meetup? Keep the convo going with real-time messages." },
    { icon: "🛡️", title: "Safe by design", body: "Report, block, and human moderation baked in. A club that actually looks out for you." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A whole night out, in one app.</h2>
        <p className="mt-3 text-white/50">Online to IRL, Nightfall is built to turn strangers into your people.</p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-2xl">
              {it.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-white/55">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LevelLadder() {
  const rungs = [
    { lvl: "Lvl 1", label: "Join, vibe, play", tone: "text-white/70" },
    { lvl: "Lvl 5", label: "Host your own A/V rooms", tone: "text-indigo-300" },
    { lvl: "Lvl 10", label: "Host real meetups (earn 70%)", tone: "text-purple-300" },
    { lvl: "Lvl 20", label: "Host stranger trips", tone: "text-fuchsia-300" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-8 sm:p-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The more you show up, the more you unlock.</h2>
            <p className="mt-4 text-white/55">
              Nightfall runs on a real progression system. Every game, meetup, and post earns points —
              and points unlock the good stuff, including getting paid to host.
            </p>
            <Link href="/demo" className="mt-6 inline-block rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5">
              Try the live demo →
            </Link>
          </div>
          <ol className="relative space-y-3 border-l border-white/10 pl-6">
            {rungs.map((r) => (
              <li key={r.lvl} className="relative">
                <span className="absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400" />
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className={`text-sm font-bold ${r.tone}`}>{r.lvl}</span>
                  <span className="ml-2 text-sm text-white/60">{r.label}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function GenZBanner() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-indigo-600/40 via-purple-600/30 to-fuchsia-600/40 p-10 text-center sm:p-16">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Built for Gen Z. Built for IRL.</h2>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Loneliness is not a vibe. Nightfall makes it stupidly easy to find your people — online tonight,
          in person this weekend.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-black transition hover:bg-white/90"
        >
          Start for free
        </Link>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 text-center">
      <div className="text-6xl">🌙</div>
      <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Ready for nightfall?</h2>
      <p className="mt-4 text-white/55">Your people are already here. Come find them.</p>
      <Link
        href="/login"
        className="mt-8 inline-block rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-10 py-4 text-lg font-semibold shadow-lg shadow-fuchsia-500/20 transition hover:opacity-95"
      >
        Join the club
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
        <span className="flex items-center gap-2 font-semibold text-white/70">🌙 Nightfall</span>
        <span>nightfall.club · © {new Date().getFullYear()} · Made for the night owls.</span>
        <Link href="/login" className="text-white/60 hover:text-white">
          Open app →
        </Link>
      </div>
    </footer>
  );
}
