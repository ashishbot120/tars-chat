import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { HomeNotifications } from "@/components/HomeNotifications";

export default function Home() {
  return (
    <div className="min-h-screen bg-chat">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 md:py-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl accent-gradient shadow-glow" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                Tars Chat
              </p>
              <h1 className="text-2xl font-semibold md:text-3xl">
                Your modern team inbox
              </h1>
            </div>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="surface-glass glass-border rounded-[32px] p-6 md:p-10 animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-medium text-neutral-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time, secure, and fast
            </div>
            <h2 className="mt-5 text-3xl font-semibold md:text-4xl">
              Conversations that feel like a live workspace.
            </h2>
            <p className="mt-4 text-base text-muted md:text-lg">
              Keep focus with presence, typing indicators, and a clean, modern
              chat UI that adapts beautifully across devices.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="accent-gradient shadow-glow">
                <Link href="/users">Browse users</Link>
              </Button>
              <Button asChild variant="outline" className="bg-white/70">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="bg-white/70">
                <Link href="/chat">Open chat</Link>
              </Button>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" className="text-neutral-700">
                    Sign in
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Presence", value: "Live status" },
                { label: "Groups", value: "Quick setup" },
                { label: "Reactions", value: "Lightweight feedback" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white/80 p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-neutral-800">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-solid ring-soft rounded-[28px] p-6 md:p-8 animate-rise">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">Activities</p>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                Live
              </span>
            </div>
            <div className="mt-6">
              <HomeNotifications />
            </div>
            <div className="mt-6 rounded-2xl bg-white/90 p-4 text-sm text-neutral-600">
              Notifications keep you updated the moment someone reaches out.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
