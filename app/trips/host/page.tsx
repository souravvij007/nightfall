import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/admin";
import { hasFeature } from "@/lib/gamification/levels";
import { HomePane } from "@/components/shell/HomePane";
import { CreateTripForm } from "@/components/trips/CreateTripForm";

export default async function HostTripPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const staff = isStaff(user);
  const canHost = staff || hasFeature(user.level, "HOST_TRIP");

  return (
    <HomePane active="trips" icon="🧭" title="Host a trip">
      <div className="text-white">
        <CreateTripForm canHost={canHost} isStaff={staff} />
      </div>
    </HomePane>
  );
}
