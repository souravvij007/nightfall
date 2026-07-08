import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getServer } from "@/lib/servers/service";

/** Opening a server jumps to its first text channel (or first channel of any type). */
export default async function ServerIndexPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { serverId } = await params;
  const server = await getServer(user.id, serverId);
  if (!server) notFound();

  const first = server.channels.find((c) => c.type === "TEXT") ?? server.channels[0];
  if (!first) {
    // No channels yet — surface a minimal message rather than a dead end.
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-panel text-muted">
        This server has no channels yet.
      </div>
    );
  }
  redirect(`/servers/${serverId}/${first.id}`);
}
