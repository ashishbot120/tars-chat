import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-chat">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Dashboard
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">
              Workspace snapshot
            </h1>
          </div>
          <UserButton />
        </div>

        <Dashboard />
      </div>
    </div>
  );
}
