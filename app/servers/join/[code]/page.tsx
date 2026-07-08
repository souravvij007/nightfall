import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getInvite, membershipRole } from "@/lib/servers/service";
import { AppShell } from "@/components/shell/AppShell";
import { joinServerAction } from "@/app/servers/actions";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { code } = await params;
  const invite = await getInvite(code);

  return (
    <AppShell>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center">
          {!invite ? (
            <>
              <div className="mb-2 text-4xl">💀</div>
              <h1 className="text-lg font-bold text-bright">Invalid invite</h1>
              <p className="mt-1 text-sm text-muted">This invite is invalid, expired, or used up.</p>
              <Link href="/feed" className="mt-4 inline-block text-sm text-brand-fuchsia hover:underline">
                Back home
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-2xl font-bold text-white">
                {invite.server.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={invite.server.iconUrl} alt="" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  invite.server.name.charAt(0).toUpperCase()
                )}
              </div>
              <p className="text-xs uppercase tracking-wide text-muted">You&apos;ve been invited to join</p>
              <h1 className="mt-1 text-xl font-bold text-bright">{invite.server.name}</h1>
              <p className="mt-1 text-sm text-muted">{invite.server._count.members} members</p>
              <form action={joinServerAction} className="mt-5">
                <input type="hidden" name="code" value={code} />
                <button className="w-full rounded-lg bg-gradient-to-r from-brand-indigo to-brand-fuchsia px-4 py-3 font-semibold text-white transition hover:brightness-110">
                  {(await membershipRole(user.id, invite.server.id)) ? "Open Server" : "Accept Invite"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
