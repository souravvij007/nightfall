import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/AppShell";
import { CreateServerForm } from "@/components/shell/CreateServerForm";

export default async function NewServerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell activeServerId="new">
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-3xl">
            🌙
          </div>
          <h1 className="text-2xl font-bold text-bright">Create your server</h1>
          <p className="mt-1 text-sm text-muted">
            Your server is where you and your friends hang out. Make one and start talking.
          </p>
        </div>
        <CreateServerForm />
      </div>
    </AppShell>
  );
}
