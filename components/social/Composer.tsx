"use client";

import { useRef, useState } from "react";
import { createPostAction } from "@/app/feed/actions";

const MAX = 2000;

export function Composer() {
  const formRef = useRef<HTMLFormElement>(null);
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [justPosted, setJustPosted] = useState(false);

  const empty = caption.trim().length === 0 && media.trim().length === 0;

  async function submit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const res = await createPostAction({}, formData);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    formRef.current?.reset();
    setCaption("");
    setMedia("");
    setJustPosted(true);
    setTimeout(() => setJustPosted(false), 2000);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !empty && !pending) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form
      ref={formRef}
      action={submit}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition focus-within:border-fuchsia-400/50 focus-within:bg-white/[0.05]"
    >
      <label htmlFor="composer-caption" className="sr-only">
        Share something with the club
      </label>
      <textarea
        id="composer-caption"
        name="caption"
        rows={3}
        maxLength={MAX}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Share something with the club…"
        className="w-full resize-none bg-transparent text-white placeholder-white/30 outline-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <input
          name="mediaUrl"
          value={media}
          onChange={(e) => setMedia(e.target.value)}
          placeholder="Image URL (optional)"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-fuchsia-400"
        />
        <button
          type="submit"
          disabled={pending || empty}
          className="shrink-0 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span aria-live="polite">
          {justPosted ? (
            <span className="text-emerald-400">Posted ✓</span>
          ) : error ? (
            <span className="text-red-400">{error}</span>
          ) : null}
        </span>
        <span className={`tabular-nums ${caption.length > MAX - 100 ? "text-amber-400" : "text-white/25"}`}>
          {caption.length > MAX - 200 ? `${caption.length}/${MAX}` : ""}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-white/25">Tip: press ⌘/Ctrl + Enter to post</p>
    </form>
  );
}
