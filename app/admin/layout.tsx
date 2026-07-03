import Link from "next/link";
import { requireStaff } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold">Nightfall</span>
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/admin/moderation" className="text-white/70 hover:text-white">
              Moderation
            </Link>
            <Link href="/admin/meetups" className="text-white/70 hover:text-white">
              Meetups
            </Link>
            <Link href="/admin/trips" className="text-white/70 hover:text-white">
              Trips
            </Link>
            <Link href="/admin/finance" className="text-white/70 hover:text-white">
              Finance
            </Link>
            <Link href="/feed" className="text-white/40 hover:text-white">
              ← App
            </Link>
            <span className="text-white/30">@{staff.handle}</span>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
