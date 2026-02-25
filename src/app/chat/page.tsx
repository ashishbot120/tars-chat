import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ChatPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Card className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 bg-white/80 p-6 text-center text-sm text-neutral-600 animate-fade-in">
      <div className="text-2xl font-semibold text-neutral-800">
        Your inbox is ready.
      </div>
      <p className="max-w-sm text-sm text-muted">
        Pick a conversation from the left or discover someone new to chat with.
      </p>
      <Button asChild variant="outline" className="bg-white/70">
        <Link href="/users">Find people</Link>
      </Button>
    </Card>
  );
}
