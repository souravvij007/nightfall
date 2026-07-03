import { redirect } from "next/navigation";
import { getCurrentUser, getPendingPhone } from "@/lib/auth/session";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

export default async function OnboardingPage() {
  if (await getCurrentUser()) redirect("/me");
  if (!(await getPendingPhone())) redirect("/login");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#0a0a12] px-6 py-16 text-white">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Set up your profile</h1>
        <p className="mt-2 text-white/50">This is how the club will see you.</p>
      </div>
      <OnboardingForm />
    </div>
  );
}
