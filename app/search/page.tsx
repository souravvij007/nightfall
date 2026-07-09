import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { searchAll } from "@/lib/search/service";
import { formatMoney } from "@/lib/money";
import { AppShell } from "@/components/shell/AppShell";
import { HomeSidebar } from "@/components/shell/HomeSidebar";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { q = "" } = await searchParams;
  const { query, users, meetups, trips } = await searchAll(user.id, q);
  const total = users.length + meetups.length + trips.length;

  return (
    <AppShell activeServerId="home" sidebar={<HomeSidebar active="search" />}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4 shadow-sm">
        <span className="text-muted">🔍</span>
        <form method="get" className="flex-1">
          <input
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Search people, meetups, trips…"
            className="w-full max-w-xl rounded-md bg-[#383a40] px-3 py-1.5 text-sm text-bright placeholder-muted outline-none focus:ring-2 focus:ring-brand-fuchsia/50"
          />
        </form>
      </header>

      <div className="dc-scroll flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-6">
          {query.length === 0 ? (
            <EmptyHint />
          ) : total === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">
              No results for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="space-y-6">
              {users.length > 0 && (
                <Section title={`People · ${users.length}`}>
                  {users.map((u) => (
                    <Link
                      key={u.id}
                      href={`/u/${u.handle}`}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition hover:bg-hover"
                    >
                      <Avatar name={u.displayName} url={u.avatarUrl} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-bright">{u.displayName}</div>
                        <div className="truncate text-xs text-muted">
                          @{u.handle} · Lvl {u.level} · {u.rank}
                        </div>
                      </div>
                    </Link>
                  ))}
                </Section>
              )}

              {meetups.length > 0 && (
                <Section title={`Meetups · ${meetups.length}`}>
                  {meetups.map((m) => (
                    <Link
                      key={m.id}
                      href={`/meetups/${m.id}`}
                      className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 transition hover:bg-hover"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-bright">📍 {m.title}</div>
                        <div className="truncate text-xs text-muted">
                          {m.city} · {m.startsAt.toLocaleDateString()} · by {m.host.displayName}
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-bright">
                        {m.feeCents === 0 ? "Free" : formatMoney(m.feeCents, m.currency)}
                      </span>
                    </Link>
                  ))}
                </Section>
              )}

              {trips.length > 0 && (
                <Section title={`Trips · ${trips.length}`}>
                  {trips.map((t) => (
                    <Link
                      key={t.id}
                      href={`/trips/${t.id}`}
                      className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 transition hover:bg-hover"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-bright">🧭 {t.title}</div>
                        <div className="truncate text-xs text-muted">
                          {t.destination} · {t.startsAt.toLocaleDateString()} · by {t.host.displayName}
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-bright">
                        {t.priceCents === 0 ? "Free" : formatMoney(t.priceCents, t.currency)}
                      </span>
                    </Link>
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia font-bold text-white">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center">
      <div className="mb-2 text-3xl">🔍</div>
      <h2 className="text-base font-semibold text-bright">Search Nightfall</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
        Find people to follow, meetups to join, and trips to take.
      </p>
    </div>
  );
}
