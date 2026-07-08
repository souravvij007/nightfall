interface Author {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}
interface Msg {
  id: string;
  authorId: string;
  body: string;
  createdAt: Date;
  author: Author;
}

function stamp(d: Date): string {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Discord-style message list: consecutive messages by one author within 5 min are grouped. */
export function ChannelMessages({ messages, channelName }: { messages: Msg[]; channelName: string }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-end px-4 pb-4">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-hover text-3xl">#</div>
        <h2 className="text-2xl font-bold text-bright">Welcome to #{channelName}</h2>
        <p className="text-sm text-muted">This is the start of the #{channelName} channel.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 py-4">
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const grouped =
          prev &&
          prev.authorId === m.authorId &&
          new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;

        if (grouped) {
          return (
            <div key={m.id} className="group flex gap-4 px-4 hover:bg-black/10">
              <span className="w-10 shrink-0 pt-0.5 text-right text-[10px] text-muted opacity-0 group-hover:opacity-100">
                {new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </span>
              <p className="min-w-0 whitespace-pre-wrap break-words text-[15px] text-foreground">{m.body}</p>
            </div>
          );
        }

        return (
          <div key={m.id} className="group mt-3 flex gap-4 px-4 hover:bg-black/10">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-sm font-bold text-white">
              {m.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.author.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                m.author.displayName.charAt(0).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-bright">{m.author.displayName}</span>
                <span className="text-xs text-muted">{stamp(m.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-[15px] text-foreground">{m.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
