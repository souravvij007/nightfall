import { LiveKitStage } from "@/components/rooms/LiveKitStage";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";
import { joinVoiceAction, leaveVoiceAction } from "@/app/servers/actions";

interface Participant {
  userId: string;
  role: "HOST" | "SPEAKER" | "LISTENER";
  user: { id: string; handle: string; displayName: string; avatarUrl: string | null; level: number; rank: string };
}

interface VoiceState {
  channel: { id: string; name: string };
  roomId: string | null;
  participants: Participant[];
  inRoom: boolean;
}

/** The main-pane UI for a VOICE channel: a lobby to join, then the A/V stage + live participants. */
export function VoiceChannel({ serverId, voice }: { serverId: string; voice: VoiceState }) {
  const { channel, roomId, participants, inRoom } = voice;

  return (
    <div className="dc-scroll flex-1 overflow-y-auto p-6">
      {/* Poll room presence so the participant list stays live (topic=room). */}
      {roomId && <RealtimeRefresh topic="room" id={roomId} />}

      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-2xl">
            🔊
          </div>
          <div>
            <h1 className="text-xl font-bold text-bright">{channel.name}</h1>
            <p className="text-sm text-muted">
              {participants.length === 0
                ? "No one's here yet"
                : `${participants.length} in voice`}
            </p>
          </div>
        </div>

        {/* Present participants */}
        {participants.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {participants.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-sm font-bold text-white">
                  {p.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    p.user.displayName.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="text-sm font-medium text-bright">{p.user.displayName}</span>
                {p.role === "HOST" && (
                  <span className="rounded bg-brand-fuchsia/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-fuchsia">
                    HOST
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Join / stage */}
        <div className="mt-6">
          {inRoom && roomId ? (
            <>
              <LiveKitStage roomId={roomId} />
              <form action={leaveVoiceAction} className="mt-4">
                <input type="hidden" name="serverId" value={serverId} />
                <input type="hidden" name="channelId" value={channel.id} />
                <button className="rounded-lg bg-red-500/15 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/25">
                  Disconnect
                </button>
              </form>
            </>
          ) : (
            <form action={joinVoiceAction}>
              <input type="hidden" name="serverId" value={serverId} />
              <input type="hidden" name="channelId" value={channel.id} />
              <button className="rounded-lg bg-gradient-to-r from-brand-indigo to-brand-fuchsia px-6 py-2.5 font-semibold text-white transition hover:brightness-110">
                Join Voice
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
