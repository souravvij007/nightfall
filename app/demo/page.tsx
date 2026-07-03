import Link from "next/link";
import { LevelPlayground } from "@/components/gamification/LevelPlayground";

export default function DemoPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#08080f] px-6 py-16 text-white">
      <Link href="/" className="mb-6 text-sm text-white/40 hover:text-white">
        ← Back to Nightfall
      </Link>
      <header className="mb-8 max-w-xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">The level system, live</h1>
        <p className="mt-2 text-white/50">
          Earn points, climb levels, unlock hosting. Drag or tap to see it in action.
        </p>
      </header>
      <LevelPlayground />
    </div>
  );
}
