"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PresenceDot } from "@/components/chat/PresenceDot";
import { isPresenceOnline } from "@/lib/presence";
import { formatMessageTimestamp } from "@/lib/format";
import { Input } from "@/components/ui/input";

export function ChatSidebar() {
  const pathname = usePathname();
  const conversations = useQuery(api.conversations.listMyConversations);
  const [search, setSearch] = useState("");
  const otherUserIds = conversations
    ? conversations
        .map((conversation) => conversation.otherUser?.clerkUserId)
        .filter((value): value is string => Boolean(value))
    : [];

  const presence =
    useQuery(api.presence.listPresence, { clerkUserIds: otherUserIds }) ?? [];

  const presenceMap = new Map(
    presence.map((item) => [
      item.clerkUserId,
      isPresenceOnline(item.lastSeenAt, item.online),
    ])
  );

  const isLoading = conversations === undefined;
  const filtered = useMemo(() => {
    if (!conversations) return [];
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const name = conversation.isGroup
        ? conversation.title ?? "group"
        : conversation.otherUser?.name ?? "direct message";
      return name.toLowerCase().includes(query);
    });
  }, [conversations, search]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Inbox
          </p>
          <h2 className="text-2xl font-semibold">Chats</h2>
        </div>
        <UserButton />
      </div>

      <Link
        href="/users"
        className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
      >
        Find people
      </Link>

      <Input
        placeholder="Search conversations..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="bg-white/85"
      />

      <div className="space-y-3">
        {isLoading && (
          <Card className="p-4 text-sm text-neutral-600">
            Loading conversations...
          </Card>
        )}

        {!isLoading && filtered.length === 0 && (
          <Card className="p-4 text-sm text-neutral-600">
            {conversations && conversations.length > 0
              ? "No conversations match your search."
              : "No conversations yet. Start a chat from the users list."}
          </Card>
        )}

        {!isLoading &&
          filtered.map((conversation) => {
          const isActive = pathname === `/chat/${conversation.conversationId}`;
          const otherUser = conversation.otherUser;
          const online = otherUser
            ? presenceMap.get(otherUser.clerkUserId) ?? false
            : false;

          const previewPrefix = conversation.isGroup
            ? ""
            : conversation.lastMessageSenderId &&
              conversation.lastMessageSenderId === otherUser?.clerkUserId
            ? ""
            : conversation.lastMessageSenderId
            ? "You: "
            : "";

          return (
            <Link
              key={conversation.conversationId}
              href={`/chat/${conversation.conversationId}`}
              className="block"
            >
              <Card
                className={`flex items-center gap-3 p-3 transition ${
                  isActive
                    ? "border-emerald-300 bg-emerald-50/80 shadow-sm"
                    : "hover:bg-white/80"
                } animate-slide-up`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={otherUser?.imageUrl} />
                    <AvatarFallback>
                      {conversation.isGroup
                        ? (conversation.title ?? "Group")
                            .slice(0, 2)
                            .toUpperCase()
                        : otherUser?.name
                        ? otherUser.name.slice(0, 2).toUpperCase()
                        : "DM"}
                    </AvatarFallback>
                  </Avatar>
                  {!conversation.isGroup && (
                    <PresenceDot
                      online={online}
                      className="absolute -bottom-0.5 -right-0.5"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {conversation.isGroup
                      ? conversation.title ?? "Group chat"
                      : otherUser?.name ?? "Direct Message"}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {conversation.lastMessagePreview
                      ? `${previewPrefix}${conversation.lastMessagePreview}`
                      : conversation.isGroup
                      ? `${conversation.groupMemberCount ?? 0} members`
                      : "No messages yet"}
                  </p>
                </div>
                {conversation.lastMessageAt && (
                  <span className="text-[11px] text-neutral-400">
                    {formatMessageTimestamp(conversation.lastMessageAt)}
                  </span>
                )}
                {conversation.unreadCount > 0 && (
                  <Badge>{conversation.unreadCount}</Badge>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
