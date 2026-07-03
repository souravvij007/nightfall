import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getRoom } from "@/lib/rooms/service";
import { AppNav } from "@/components/AppNav";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";
import { LiveKitStage } from "@/components/rooms/LiveKitStage";
import { joinRoomAction, leaveRoomAction, endRoomAction, awardRoomAction } from "../actions";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { roomId } = await params;
  const room = await getRoom(roomId);
  if (!room) notFound();

  const isHost = room.hostId === user.id;
  const me = room.participants.find((p) => p.userId === user.id);
  const inRoom = Boolean(me);

  // Ended room, or lobby (not yet joined).
  if (room.status === "ENDED") {
    return (
      <Shell>
        <h1 className="text-xl font-bold">{room.title}</h1>
        <p className="mt-2 text-white/50">This room has ended.</p>
        <Link href="/rooms" className="mt-4 inline-block text-sm text-fuchsia-300 hover:underline">
          ← Back to live rooms
        </Link>
      </Shell>
    );
  }

  if (!inRoom) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">{room.title}</h1>
        {room.description && <p className="mt-1 text-white/60">{room.description}</p>}
        <p className="mt-2 text-sm text-white/40">
          hosted by {room.host.displayName} · {room.participants.length} in the room
        </p>
        <form action={joinRoomAction} className="mt-5">
          <input type="hidden" name="roomId" value={room.id} />
          <button className="rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-2.5 font-semibold text-white">
            Join room
          </button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell>
      <RealtimeRefresh topic="room" id={room.id} />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{room.title}</h1>
          <p className="text-sm text-white/40">hosted by {room.host.displayName}</p>
        </div>
        {isHost ? (
          <form action={endRoomAction}>
            <input type="hidden" name="roomId" value={room.id} />
            <button className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/25">
              End room
            </button>
          </form>
        ) : (
          <form action={leaveRoomAction}>
            <input type="hidden" name="roomId" value={room.id} />
            <button className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5">
              Leave
            </button>
          </form>
        )}
      </div>

      <div className="mt-4">
        <LiveKitStage roomId={room.id} />
      </div>

      <div className="mt-6">
        <div className="mb-2 text-xs uppercase tracking-widest text-white/40">
          In the room · {room.participants.length}
        </div>
        <ul className="space-y-2">
          {room.participants.map((p) => (
            <li
              key={p.userId}
              className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold">
                  {p.user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {p.user.displayName}
                    {p.role === "HOST" && (
                      <span className="ml-2 rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-xs text-fuchsia-300">HOST</span>
                    )}
                  </div>
                  <div className="text-xs text-white/40">Lvl {p.user.level} · {p.user.rank}</div>
                </div>
              </div>

              {/* Host awards points to participants for games/tasks. */}
              {isHost && p.userId !== user.id && (
                <div className="flex gap-1">
                  <AwardButton roomId={room.id} userId={p.userId} reason="ROOM_GAME_WIN" label="🏆 +50" />
                  <AwardButton roomId={room.id} userId={p.userId} reason="ROOM_TASK_COMPLETE" label="✅ +20" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

function AwardButton({
  roomId,
  userId,
  reason,
  label,
}: {
  roomId: string;
  userId: string;
  reason: string;
  label: string;
}) {
  return (
    <form action={awardRoomAction}>
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="targetUserId" value={userId} />
      <input type="hidden" name="reason" value={reason} />
      <button className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 transition hover:border-white/25 hover:bg-white/10">
        {label}
      </button>
    </form>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-8 text-white">
      <div className="w-full max-w-xl">
        <AppNav />
        {children}
      </div>
    </div>
  );
}
