import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UsersList } from "@/components/UsersList";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function UsersPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-chat">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Directory
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">Users</h1>
            <p className="mt-2 text-sm text-muted">
              Start a new chat or build a group in seconds.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="bg-white/70">
              <Link href="/chat">Back to Chat</Link>
            </Button>
            <UserButton />
          </div>
        </div>

        <div className="surface-glass glass-border rounded-[28px] p-4 md:p-6 animate-rise">
          <UsersList />
        </div>
      </div>
    </div>
  );
}
