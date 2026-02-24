import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";
import type { Id } from "../../../../convex/_generated/dataModel";

type ChatConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ChatConversationPage({
  params,
}: ChatConversationPageProps) {
  const { conversationId } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <ChatWindow conversationId={conversationId as Id<"conversations">} />
  );
}
