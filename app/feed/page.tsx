import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getFeed } from "@/lib/social/posts";
import { AppShell } from "@/components/shell/AppShell";
import { HomeSidebar } from "@/components/shell/HomeSidebar";
import { PromoBanner } from "@/components/PromoBanner";
import { Composer } from "@/components/social/Composer";
import { PostCard } from "@/components/social/PostCard";

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const posts = await getFeed(user.id);

  return (
    <AppShell activeServerId="home" sidebar={<HomeSidebar active="feed" />}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4 shadow-sm">
        <span className="text-muted">🏠</span>
        <span className="font-semibold text-bright">Feed</span>
      </header>

      <div className="dc-scroll flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-xl px-4 py-6">
          <div className="mb-4">
            <PromoBanner variant="feed" />
          </div>
          <Composer />

          <div className="mt-6 space-y-4">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo/20 to-brand-fuchsia/20 text-2xl">
                  🌙
                </div>
                <h2 className="text-base font-semibold text-bright">Your feed is quiet</h2>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
                  Share your first post above, or follow people to see their posts here.
                </p>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} likedByMe={post.likedByMe} />)
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
