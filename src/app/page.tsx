import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-chat">
      <main className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Tars Chat</h1>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
        <p className="mt-4 text-neutral-600">
          Real-time one-on-one messaging powered by Clerk and Convex.
        </p>
        <div className="mt-6">
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="bg-emerald-500 text-white hover:bg-emerald-600">
            <Link href="/users">Go to Users</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/chat">Go to Chat</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
