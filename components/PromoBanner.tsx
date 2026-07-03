import Link from "next/link";

interface Promo {
  emoji: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  gradient: string;
}

const PROMOS: Record<string, Promo> = {
  feed: {
    emoji: "🎙️",
    title: "Rooms are live tonight",
    body: "Jump into a game, win points, climb the ranks.",
    href: "/rooms",
    cta: "Join a room",
    gradient: "from-indigo-600/40 via-purple-600/25 to-fuchsia-600/40",
  },
  rooms: {
    emoji: "🏆",
    title: "Level 5 unlocks hosting",
    body: "Run your own room, build a crowd, earn rewards.",
    href: "/me",
    cta: "Check your level",
    gradient: "from-fuchsia-600/40 via-purple-600/25 to-indigo-600/40",
  },
  meetups: {
    emoji: "📍",
    title: "New meetups just dropped",
    body: "Real plans, real people. Grab your spot before it's gone.",
    href: "/meetups",
    cta: "Browse meetups",
    gradient: "from-emerald-600/30 via-indigo-600/25 to-fuchsia-600/40",
  },
  trips: {
    emoji: "🧭",
    title: "Weekend escapes await",
    body: "Vetted stays, full itineraries, instant crew.",
    href: "/trips",
    cta: "See trips",
    gradient: "from-indigo-600/40 via-sky-600/25 to-fuchsia-600/40",
  },
};

export function PromoBanner({ variant }: { variant: keyof typeof PROMOS }) {
  const p = PROMOS[variant];
  return (
    <Link
      href={p.href}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r ${p.gradient} p-4 transition hover:border-white/25`}
    >
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/10 text-2xl">
        {p.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-white">{p.title}</div>
        <div className="truncate text-sm text-white/60">{p.body}</div>
      </div>
      <span className="hidden flex-none rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-black transition group-hover:bg-white sm:block">
        {p.cta}
      </span>
    </Link>
  );
}
