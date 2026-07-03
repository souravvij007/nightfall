import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/me");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#0a0a12] px-6 py-16 text-white">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Nightfall</h1>
        <p className="mt-2 text-white/50">Sign in with your phone to join the club.</p>
      </div>
      <LoginForm />
    </div>
  );
}
