"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatMessageTimestamp } from "@/lib/format";

export function HomeNotifications() {
  const { isLoaded, user } = useUser();
  const conversations = useQuery(
    api.conversations.listMyConversations,
    user ? {} : "skip"
  );

  const recent = useMemo(() => {
    if (!conversations) return [];
    return conversations.slice(0, 3);
  }, [conversations]);

  if (!isLoaded) {
    return (
      <div className="rounded-2xl bg-white/90 p-4 text-sm text-neutral-500">
        Loading notifications...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl bg-white/90 p-4 text-sm text-neutral-500">
        Sign in to see your latest notifications.
      </div>
    );
  }

  if (conversations && conversations.length === 0) {
    return (
      <div className="rounded-2xl bg-white/90 p-4 text-sm text-neutral-500">
        No messages yet. Start a conversation to see notifications here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recent.map((conversation) => {
        const title = conversation.isGroup
          ? `New group message in ${conversation.title ?? "Group chat"}`
          : `New message from ${
              conversation.otherUser?.name ?? "Someone"
            }`;
        const preview =
          conversation.lastMessagePreview ??
          (conversation.isGroup
            ? `${conversation.groupMemberCount ?? 0} members`
            : "No messages yet");
        const time = conversation.lastMessageAt
          ? formatMessageTimestamp(conversation.lastMessageAt)
          : "Just now";
        return (
          <Link
            key={conversation.conversationId}
            href={`/chat/${conversation.conversationId}`}
            className="block"
          >
            <div className="flex items-center justify-between rounded-2xl bg-white/90 p-4 shadow-sm hover-lift">
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-neutral-500">{preview}</p>
              </div>
              <p className="text-xs text-neutral-400">{time}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
