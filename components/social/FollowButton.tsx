"use client";

import { useOptimistic, useTransition } from "react";
import { followUserAction } from "@/app/feed/actions";

/** Compact optimistic follow button for suggestion lists. */
export function FollowButton({ targetId }: { targetId: string }) {
  const [followed, setFollowed] = useOptimistic(false);
  const [, startTransition] = useTransition();

  function onFollow() {
    startTransition(async () => {
      setFollowed(true);
      const fd = new FormData();
      fd.set("targetId", targetId);
      await followUserAction(fd);
    });
  }

  if (followed) {
    return <span className="text-xs font-semibold text-muted">Following</span>;
  }
  return (
    <button
      onClick={onFollow}
      className="rounded-md bg-gradient-to-r from-brand-indigo to-brand-fuchsia px-3 py-1 text-xs font-semibold text-white transition hover:brightness-110"
    >
      Follow
    </button>
  );
}
