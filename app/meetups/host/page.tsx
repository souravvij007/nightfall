import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/admin";
import { hasFeature } from "@/lib/gamification/levels";
import { AppNav } from "@/components/AppNav";
import { CreateMeetupForm } from "@/components/meetups/CreateMeetupForm";

export default async function HostMeetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const staff = isStaff(user);
  const canHost = staff || hasFeature(user.level, "HOST_MEETUP");

  return (
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-8 text-white">
      <div className="w-full max-w-xl">
        <AppNav />
        <h1 className="mb-4 text-xl font-bold">Host a meetup</h1>
        <CreateMeetupForm canHost={canHost} isStaff={staff} />
      </div>
    </div>
  );
}
