"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PresenceDot } from "@/components/chat/PresenceDot";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import {
  formatDateDivider,
  formatLastSeen,
  formatMessageTimestamp,
} from "@/lib/format";
import { isPresenceOnline } from "@/lib/presence";

type ChatWindowProps = {
  conversationId: Id<"conversations">;
};

const SCROLL_THRESHOLD_PX = 80;
const REACTION_EMOJIS = [
  "\u2764\ufe0f",
  "\ud83d\udc4d",
  "\ud83d\ude02",
  "\ud83d\udd25",
  "\ud83d\udc40",
];

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const conversation = useQuery(api.conversations.getConversation, {
    conversationId,
  });
  const messageResults = useQuery(api.messages.listMessages, { conversationId });
  const messages = useMemo(() => messageResults ?? [], [messageResults]);
  const typingResults = useQuery(api.typing.listTyping, { conversationId });
  const typing = useMemo(() => typingResults ?? [], [typingResults]);
  const markConversationRead = useMutation(api.conversations.markConversationRead);
  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const updateTyping = useMutation(api.typing.updateTyping);

  const otherUser = conversation?.otherUser ?? null;
  const { user } = useUser();
  const presence =
    useQuery(api.presence.listPresence, {
      clerkUserIds: otherUser ? [otherUser.clerkUserId] : [],
    }) ?? [];
  const isOtherOnline = presence[0]
    ? isPresenceOnline(presence[0].lastSeenAt, presence[0].online)
    : false;
  const lastSeenLabel = presence[0]?.lastSeenAt
    ? formatLastSeen(presence[0].lastSeenAt)
    : "Offline";

  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [retryBody, setRetryBody] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const lastTypingAtRef = useRef(0);
  const lastMessageCountRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const typingLabel = useMemo(() => {
    if (typing.length === 0) return null;
    if (conversation?.isGroup) {
      const names = typing
        .map((item) =>
          conversation.members.find(
            (member) => member.clerkUserId === item.clerkUserId
          )?.name ?? "Someone"
        )
        .slice(0, 2);
      return `${names.join(", ")} ${
        typing.length > 1 ? "are" : "is"
      } typing...`;
    }
    const name = otherUser?.name ?? "Someone";
    return `${name} is typing...`;
  }, [typing, otherUser?.name, conversation?.isGroup, conversation?.members]);

  useEffect(() => {
    if (!conversation) return;
    if (messages.length === 0) return;
    void markConversationRead({ conversationId });
  }, [conversationId, conversation, messages.length, markConversationRead]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const nearBottom = distanceFromBottom < SCROLL_THRESHOLD_PX;
      setIsAtBottom(nearBottom);
      if (nearBottom) {
        setShowNewMessages(false);
      }
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;

    const hasNewMessages = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowNewMessages(false);
    } else if (hasNewMessages) {
      setShowNewMessages(true);
    }
  }, [messages, isAtBottom]);

  const handleSend = async () => {
    const trimmed = messageBody.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    setSendError(null);
    try {
      await sendMessage({ conversationId, body: trimmed });
      setMessageBody("");
      setRetryBody(null);
      setShowNewMessages(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setSendError("Message failed to send.");
      setRetryBody(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = async () => {
    if (!retryBody) return;
    setMessageBody(retryBody);
    await handleSend();
  };

  const handleInputChange = (value: string) => {
    setMessageBody(value);
    const now = Date.now();
    if (now - lastTypingAtRef.current > 700) {
      lastTypingAtRef.current = now;
      void updateTyping({ conversationId });
    }
  };

  if (conversation === undefined) {
    return (
      <Card className="p-6 text-sm text-neutral-600">
        Loading conversation...
      </Card>
    );
  }

  if (conversation === null) {
    return (
      <Card className="p-6 text-sm text-neutral-600">
        Conversation not found.
      </Card>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-[24px] border border-white/70 bg-white/80 backdrop-blur animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-200/70 px-4 py-4 md:px-5">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="md:hidden"
          >
            <Link href="/chat">Back</Link>
          </Button>
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
                online={isOtherOnline}
                className="absolute -bottom-0.5 -right-0.5"
              />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {conversation.isGroup
                ? conversation.title ?? "Group chat"
                : otherUser?.name ?? "Direct Message"}
            </p>
            <p className="text-xs text-neutral-500">
              {conversation.isGroup
                ? `${conversation.members.length} members`
                : isOtherOnline
                ? "Online"
                : lastSeenLabel}
            </p>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="relative flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-5 bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(248,250,252,0.9)_100%)]"
      >
        {messageResults === undefined ? (
          <Card className="p-6 text-center text-sm text-neutral-600 animate-fade-in">
            Loading messages...
          </Card>
        ) : messages.length === 0 ? (
          <Card className="p-6 text-center text-sm text-neutral-600 animate-fade-in">
            No messages yet. Say hello!
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = user?.id ? message.senderId === user.id : false;
              const senderName =
                conversation.isGroup && !isOwn
                  ? conversation.members.find(
                      (member) => member.clerkUserId === message.senderId
                    )?.name ?? "Member"
                  : null;
              const prev = messages[index - 1];
              const showDivider =
                !prev ||
                new Date(prev.createdAt).toDateString() !==
                  new Date(message.createdAt).toDateString();
              return (
                <div key={message._id}>
                  {showDivider && (
                    <div className="my-2 flex items-center justify-center">
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs text-neutral-500 shadow-sm">
                        {formatDateDivider(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
                        isOwn ? "bubble-out" : "bubble-in"
                      } animate-slide-up`}
                    >
                    {senderName && (
                      <p className="text-xs font-semibold text-emerald-700">
                        {senderName}
                      </p>
                    )}
                    <p className={message.deletedAt ? "italic text-neutral-300" : ""}>
                      {message.deletedAt ? "This message was deleted" : message.body}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] opacity-70">
                      <span>{formatMessageTimestamp(message.createdAt)}</span>
                      {isOwn && !message.deletedAt && (
                        <button
                          type="button"
                          className="text-[11px] underline"
                          onClick={async () => {
                            try {
                              setActionError(null);
                              await deleteMessage({ messageId: message._id });
                            } catch {
                              setActionError("Unable to delete message.");
                            }
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    {!message.deletedAt && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {REACTION_EMOJIS.map((emoji) => {
                          const countInfo = message.reactionCounts?.find(
                            (item) => item.emoji === emoji
                          );
                          return (
                            <button
                              key={emoji}
                              type="button"
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                countInfo?.reacted
                                  ? "chip-reaction-active"
                                  : "chip-reaction"
                              } hover:-translate-y-0.5`}
                              onClick={async () => {
                                try {
                                  setActionError(null);
                                  await toggleReaction({
                                    messageId: message._id,
                                    emoji,
                                  });
                                } catch {
                                  setActionError("Unable to update reaction.");
                                }
                              }}
                            >
                              {emoji} {countInfo?.count ?? 0}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {typingLabel && <TypingIndicator label={typingLabel} />}

        <div ref={bottomRef} />

        {showNewMessages && (
          <div className="sticky bottom-2 flex justify-center">
            <Button
              size="sm"
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              New messages
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-white/60 px-4 py-4 md:px-5">
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          <Input
            value={messageBody}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder="Type your message..."
            className="bg-white/90"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!messageBody.trim() || isSending}
            className="accent-gradient"
          >
            Send
          </Button>
        </div>
        {sendError && (
          <div className="mt-2 flex items-center gap-3 text-xs text-red-600">
            <span>{sendError}</span>
            {retryBody && (
              <button type="button" className="underline" onClick={handleRetry}>
                Retry
              </button>
            )}
          </div>
        )}
        {actionError && (
          <div className="mt-2 text-xs text-red-600">{actionError}</div>
        )}
      </div>
    </div>
  );
}
