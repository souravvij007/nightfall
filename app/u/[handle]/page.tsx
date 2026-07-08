import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { isFollowing, followCounts } from "@/lib/social/graph";
import { isBlockedEither } from "@/lib/social/safety";
import { getUserPosts } from "@/lib/social/posts";
import { progressForPoints } from "@/lib/gamification/levels";
import { HomePane } from "@/components/shell/HomePane";
import { PostCard } from "@/components/social/PostCard";
import { followAction, unfollowAction, blockAction, reportUserAction, startDmAction } from "./actions";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login");

  const { handle } = await params;
  const profile = await prisma.user.findUnique({ where: { handle } });
  if (!profile) notFound();

  const isSelf = profile.id === viewer.id;
  const [following, counts, blocked] = await Promise.all([
    isSelf ? Promise.resolve(false) : isFollowing(viewer.id, profile.id),
    followCounts(profile.id),
    isSelf ? Promise.resolve(false) : isBlockedEither(viewer.id, profile.id),
  ]);

  const p = progressForPoints(profile.pointsBalance);
  const posts = blocked ? [] : await getUserPosts(profile.id);

  return (
    <HomePane active="" icon="👤" title={profile.displayName}>
      <div className="rounded-2xl border border-line bg-surface p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-xl font-bold">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                profile.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-bright">{profile.displayName}</h1>
              <p className="text-muted">@{profile.handle}</p>
              <p className="mt-1 text-sm text-white/60">
                Lvl {p.level} · {p.rank} · {counts.followers} followers · {counts.following} following
              </p>
            </div>
          </div>
        </div>
        {profile.bio && <p className="mt-4 text-white/80">{profile.bio}</p>}

        {!isSelf && !blocked && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <form action={following ? unfollowAction : followAction}>
              <input type="hidden" name="targetId" value={profile.id} />
              <input type="hidden" name="handle" value={profile.handle} />
              <button
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  following
                    ? "border border-line text-white/70 hover:bg-hover"
                    : "bg-gradient-to-r from-brand-indigo to-brand-fuchsia text-white"
                }`}
              >
                {following ? "Following" : "Follow"}
              </button>
            </form>
            <form action={startDmAction}>
              <input type="hidden" name="targetId" value={profile.id} />
              <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-hover">
                Message
              </button>
            </form>
            <form action={blockAction}>
              <input type="hidden" name="targetId" value={profile.id} />
              <input type="hidden" name="handle" value={profile.handle} />
              <button className="rounded-lg border border-line px-4 py-2 text-sm text-white/60 transition hover:bg-hover">
                Block
              </button>
            </form>
            <form action={reportUserAction} className="flex items-center gap-1">
              <input type="hidden" name="targetId" value={profile.id} />
              <input type="hidden" name="handle" value={profile.handle} />
              <input type="hidden" name="reason" value="HARASSMENT" />
              <button className="rounded-lg px-3 py-2 text-sm text-white/40 transition hover:text-red-300">
                Report
              </button>
            </form>
          </div>
        )}
        {isSelf && <p className="mt-5 text-sm text-muted">This is you.</p>}
        {blocked && <p className="mt-5 text-sm text-muted">You can&apos;t interact with this account.</p>}
      </div>

      <div className="mt-6 space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {!blocked && posts.length === 0 && (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">
            No posts yet.
          </p>
        )}
      </div>
    </HomePane>
  );
}
