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
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Directory
          </p>
          <h1 className="text-2xl font-semibold">Users</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/chat">Back to Chat</Link>
          </Button>
          <UserButton />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-10">
        <div className="card-glass rounded-3xl border border-white/60 p-5">
          <UsersList />
        </div>
      </div>
    </div>
  );
}
