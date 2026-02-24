import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function ChatPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Card className="flex h-full min-h-[320px] items-center justify-center text-sm text-neutral-600">
      Select a conversation to start chatting.
    </Card>
  );
}
