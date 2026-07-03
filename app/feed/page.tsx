import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getFeed } from "@/lib/social/posts";
import { AppNav } from "@/components/AppNav";
import { PromoBanner } from "@/components/PromoBanner";
import { Composer } from "@/components/social/Composer";
import { PostCard } from "@/components/social/PostCard";

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const posts = await getFeed(user.id);

  return (
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-8 text-white">
      <div className="w-full max-w-xl">
        <AppNav active="feed" />
        <div className="mb-4">
          <PromoBanner variant="feed" />
        </div>
        <Composer />

        <div className="mt-6 space-y-4">
          {posts.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40">
              Your feed is quiet. Post something, or follow people to see their posts here.
            </p>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} likedByMe={post.likedByMe} />)
          )}
        </div>
      </div>
    </div>
  );
}
