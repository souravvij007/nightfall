import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listLiveRooms } from "@/lib/rooms/service";
import { hasFeature, FEATURE_UNLOCK_LEVEL } from "@/lib/gamification/levels";
import { HomePane } from "@/components/shell/HomePane";
import { PromoBanner } from "@/components/PromoBanner";
import { CreateRoomForm } from "@/components/rooms/CreateRoomForm";

export default async function RoomsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rooms = await listLiveRooms();
  const canHost = hasFeature(user.level, "HOST_AV_ROOM");

  return (
    <HomePane
      active="rooms"
      icon="🎙️"
      title="Live rooms"
      headerRight={
        <span className="text-xs text-muted">Host unlocks at Level {FEATURE_UNLOCK_LEVEL.HOST_AV_ROOM}</span>
      }
    >
      <div className="mb-4">
        <PromoBanner variant="meetups" />
      </div>

      <CreateRoomForm canHost={canHost} />

      <div className="mt-6 space-y-3">
        {rooms.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">
            No rooms are live right now.{canHost ? " Start one above!" : ""}
          </p>
        ) : (
          rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition hover:bg-hover"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="font-semibold text-bright">{room.title}</span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  hosted by {room.host.displayName} · @{room.host.handle}
                </div>
              </div>
              <div className="text-sm text-muted">
                {room._count.participants} 👥
              </div>
            </Link>
          ))
        )}
      </div>
    </HomePane>
  );
}
