import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listLiveRooms } from "@/lib/rooms/service";
import { hasFeature, FEATURE_UNLOCK_LEVEL } from "@/lib/gamification/levels";
import { AppNav } from "@/components/AppNav";
import { PromoBanner } from "@/components/PromoBanner";
import { CreateRoomForm } from "@/components/rooms/CreateRoomForm";

export default async function RoomsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rooms = await listLiveRooms();
  const canHost = hasFeature(user.level, "HOST_AV_ROOM");

  return (
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-8 text-white">
      <div className="w-full max-w-xl">
        <AppNav active="rooms" />
        <div className="mb-4">
          <PromoBanner variant="meetups" />
        </div>
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-xl font-bold">Live rooms</h1>
          <span className="text-xs text-white/40">Host unlocks at Level {FEATURE_UNLOCK_LEVEL.HOST_AV_ROOM}</span>
        </div>

        <CreateRoomForm canHost={canHost} />

        <div className="mt-6 space-y-3">
          {rooms.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40">
              No rooms are live right now.{canHost ? " Start one above!" : ""}
            </p>
          ) : (
            rooms.map((room) => (
              <Link
                key={room.id}
                href={`/rooms/${room.id}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    <span className="font-semibold">{room.title}</span>
                  </div>
                  <div className="mt-1 text-xs text-white/40">
                    hosted by {room.host.displayName} · @{room.host.handle}
                  </div>
                </div>
                <div className="text-sm text-white/50">
                  {room._count.participants} 👥
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
