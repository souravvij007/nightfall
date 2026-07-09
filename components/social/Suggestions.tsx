import Link from "next/link";
import { suggestedUsers, suggestedMeetups } from "@/lib/social/suggestions";
import { formatMoney } from "@/lib/money";
import { FollowButton } from "./FollowButton";

/**
 * Feed suggestions: people to follow + upcoming meetups to sign up for.
 * Rendered as a right rail on desktop and as an inline card on mobile (same component).
 */
export async function Suggestions({ viewerId }: { viewerId: string }) {
  const [people, meetups] = await Promise.all([suggestedUsers(viewerId, 5), suggestedMeetups(3)]);
  if (people.length === 0 && meetups.length === 0) return null;

  return (
    <div className="space-y-6">
      {people.length > 0 && (
        <section>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Who to follow
          </h3>
          <ul className="space-y-1">
            {people.map((u) => (
              <li key={u.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
                <Link href={`/u/${u.handle}`} className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-xs font-bold text-white">
                    {u.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      u.displayName.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-bright">{u.displayName}</span>
                    <span className="block truncate text-xs text-muted">@{u.handle} · Lvl {u.level}</span>
                  </span>
                </Link>
                <FollowButton targetId={u.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {meetups.length > 0 && (
        <section>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Meetups for you
          </h3>
          <ul className="space-y-1">
            {meetups.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/meetups/${m.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 transition hover:bg-hover"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-bright">📍 {m.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {m.city} · {m.startsAt.toLocaleDateString()}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-md bg-hover px-2 py-1 text-xs font-semibold text-bright">
                    {m.feeCents === 0 ? "Join" : formatMoney(m.feeCents, m.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/meetups" className="mt-2 block px-1 text-xs font-semibold text-brand-fuchsia hover:underline">
            See all meetups →
          </Link>
        </section>
      )}
    </div>
  );
}
