import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/admin";
import { hasFeature } from "@/lib/gamification/levels";
import { HomePane } from "@/components/shell/HomePane";
import { CreateMeetupForm } from "@/components/meetups/CreateMeetupForm";

export default async function HostMeetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const staff = isStaff(user);
  const canHost = staff || hasFeature(user.level, "HOST_MEETUP");

  return (
    <HomePane active="meetups" icon="📍" title="Host a meetup">
      <div className="text-white">
        <CreateMeetupForm canHost={canHost} isStaff={staff} />
      </div>
    </HomePane>
  );
}
