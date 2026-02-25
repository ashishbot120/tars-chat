"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMessageTimestamp } from "@/lib/format";

export function Dashboard() {
  const { isLoaded, user } = useUser();
  const conversations = useQuery(api.conversations.listMyConversations);
  const otherUsers = useQuery(
    api.users.listUsers,
    user ? { excludeClerkUserId: user.id, search: "" } : "skip"
  );

  const stats = useMemo(() => {
    const convos = conversations ?? [];
    const totalUsers = (otherUsers?.length ?? 0) + (user ? 1 : 0);
    const unread = convos.reduce(
      (sum, convo) => sum + (convo.unreadCount ?? 0),
      0
    );
    const groupCount = convos.filter((convo) => convo.isGroup).length;
    return {
      totalUsers,
      totalConversations: convos.length,
      unread,
      groupCount,
    };
  }, [conversations, otherUsers?.length, user]);

  const recent = useMemo(() => {
    if (!conversations) return [];
    return conversations.slice(0, 4);
  }, [conversations]);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-glass glass-border rounded-[28px] p-6 md:p-8 animate-rise">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Overview
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
          </h1>
          <p className="mt-3 text-sm text-muted md:text-base">
            Here is a live snapshot of your workspace. Jump into a conversation
            or discover someone new to chat with.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="accent-gradient">
              <Link href="/chat">Open inbox</Link>
            </Button>
            <Button asChild variant="outline" className="bg-white/70">
              <Link href="/users">Find people</Link>
            </Button>
          </div>
        </div>

        <div className="surface-solid ring-soft rounded-[28px] p-6 animate-rise">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-700">Status</p>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
              Live
            </span>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-white/90 p-3">
              <span className="text-neutral-500">Conversations</span>
              <span className="font-semibold text-neutral-800">
                {stats.totalConversations}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/90 p-3">
              <span className="text-neutral-500">Unread messages</span>
              <span className="font-semibold text-neutral-800">
                {stats.unread}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/90 p-3">
              <span className="text-neutral-500">Groups</span>
              <span className="font-semibold text-neutral-800">
                {stats.groupCount}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/90 p-3">
              <span className="text-neutral-500">Users</span>
              <span className="font-semibold text-neutral-800">
                {stats.totalUsers}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="surface-glass glass-border rounded-[26px] p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                Recent
              </p>
              <h2 className="text-xl font-semibold md:text-2xl">
                Conversations
              </h2>
            </div>
            <Button asChild variant="outline" size="sm" className="bg-white/70">
              <Link href="/chat">View all</Link>
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {(conversations === undefined || otherUsers === undefined) && (
              <div className="rounded-2xl bg-white/80 p-4 text-sm text-neutral-500">
                Loading your activity...
              </div>
            )}

            {conversations && conversations.length === 0 && (
              <div className="rounded-2xl bg-white/80 p-4 text-sm text-neutral-500">
                No conversations yet. Start one from the users list.
              </div>
            )}

            {recent.map((conversation) => (
              <Link
                key={conversation.conversationId}
                href={`/chat/${conversation.conversationId}`}
                className="block"
              >
                <div className="hover-lift rounded-2xl bg-white/90 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-800">
                      {conversation.isGroup
                        ? conversation.title ?? "Group chat"
                        : conversation.otherUser?.name ?? "Direct Message"}
                    </p>
                    {conversation.lastMessageAt && (
                      <span className="text-xs text-neutral-400">
                        {formatMessageTimestamp(conversation.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    {conversation.lastMessagePreview ??
                      (conversation.isGroup
                        ? `${conversation.groupMemberCount ?? 0} members`
                        : "No messages yet")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="surface-solid ring-soft rounded-[26px] p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Activity
          </p>
          <h2 className="mt-2 text-xl font-semibold md:text-2xl">
            Momentum
          </h2>
          <div className="mt-4 space-y-3 text-sm text-neutral-600">
            <div className="rounded-2xl bg-white/90 p-4">
              {isLoaded
                ? "Stay consistent with quick replies and group updates."
                : "Sign in to see your latest activity."}
            </div>
            <div className="rounded-2xl bg-white/90 p-4">
              Use reactions to keep chats light without interrupting the flow.
            </div>
            <div className="rounded-2xl bg-white/90 p-4">
              Your presence and typing indicators are shared in real time.
            </div>
          </div>
          <Button asChild className="mt-4 w-full accent-gradient">
            <Link href="/users">Start a conversation</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
