import Link from "next/link";

type ServerRole = "OWNER" | "ADMIN" | "MEMBER";

interface MemberLite {
  role: ServerRole;
  user: { id: string; handle: string; displayName: string; avatarUrl: string | null };
}

const ROLE_ORDER: ServerRole[] = ["OWNER", "ADMIN", "MEMBER"];
const ROLE_LABEL: Record<ServerRole, string> = { OWNER: "Owner", ADMIN: "Admins", MEMBER: "Members" };

/** Right-rail member list, grouped by role (Discord-style). */
export function MemberList({ members }: { members: MemberLite[] }) {
  const groups = ROLE_ORDER.map((role) => ({
    role,
    people: members.filter((m) => m.role === role),
  })).filter((g) => g.people.length > 0);

  return (
    <div className="dc-scroll flex h-full flex-col gap-4 overflow-y-auto p-3">
      {groups.map((g) => (
        <div key={g.role}>
          <div className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {ROLE_LABEL[g.role]} — {g.people.length}
          </div>
          <ul className="mt-1 space-y-0.5">
            {g.people.map((m) => (
              <li key={m.user.id}>
                <Link
                  href={`/u/${m.user.handle}`}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-muted transition hover:bg-hover hover:text-bright"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-xs font-bold text-white">
                    {m.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      m.user.displayName.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="truncate text-sm">{m.user.displayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
