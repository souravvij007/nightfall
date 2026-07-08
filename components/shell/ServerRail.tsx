import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/admin";
import { listMyServers } from "@/lib/servers/service";

/** A single circular rail item (home, a server, add, admin). */
function RailItem({
  href,
  label,
  active,
  accent,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} title={label} aria-label={label} className="group relative flex justify-center">
      {/* active pill */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-white transition-all ${
          active ? "h-8" : "h-0 group-hover:h-4"
        }`}
      />
      <span
        className={`flex h-12 w-12 items-center justify-center overflow-hidden text-lg font-semibold transition-all duration-150 ${
          active
            ? "rounded-2xl text-white"
            : "rounded-3xl group-hover:rounded-2xl"
        } ${
          accent
            ? "bg-hover text-brand-fuchsia group-hover:bg-gradient-to-br group-hover:from-brand-indigo group-hover:to-brand-fuchsia group-hover:text-white"
            : active
              ? "bg-gradient-to-br from-brand-indigo to-brand-fuchsia"
              : "bg-hover text-foreground group-hover:bg-gradient-to-br group-hover:from-brand-indigo group-hover:to-brand-fuchsia group-hover:text-white"
        }`}
      >
        {children}
      </span>
    </Link>
  );
}

/** Discord-style far-left rail: Home, your servers, add-server, admin. */
export async function ServerRail({ active }: { active?: string }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const servers = await listMyServers(user.id);
  const staff = isStaff(user);

  return (
    <nav className="flex h-full w-[72px] shrink-0 flex-col items-center gap-2 bg-bg py-3">
      <RailItem href="/feed" label="Home" active={active === "home"}>
        🌙
      </RailItem>
      <div className="my-1 h-px w-8 rounded-full bg-line" />

      <div className="dc-scroll flex flex-1 flex-col items-center gap-2 overflow-y-auto">
        {servers.map((s) => (
          <RailItem key={s.id} href={`/servers/${s.id}`} label={s.name} active={active === s.id}>
            {s.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.iconUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              s.name.charAt(0).toUpperCase()
            )}
          </RailItem>
        ))}
        <RailItem href="/servers/new" label="Add a server" accent active={active === "new"}>
          ＋
        </RailItem>
      </div>

      {staff && (
        <>
          <div className="my-1 h-px w-8 rounded-full bg-line" />
          <RailItem href="/admin/moderation" label="Admin">
            🛡️
          </RailItem>
        </>
      )}
    </nav>
  );
}
