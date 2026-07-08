import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listMyServers } from "@/lib/servers/service";

/** /servers with no target: open your first server, or the create-server screen. */
export default async function ServersIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const servers = await listMyServers(user.id);
  redirect(servers[0] ? `/servers/${servers[0].id}` : "/servers/new");
}
