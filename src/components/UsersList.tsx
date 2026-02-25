"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { PresenceDot } from "@/components/chat/PresenceDot";
import { Skeleton } from "@/components/ui/skeleton";
import { isPresenceOnline } from "@/lib/presence";

export function UsersList() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupError, setGroupError] = useState<string | null>(null);
  const getOrCreateDM = useMutation(api.conversations.getOrCreateDM);
  const createGroup = useMutation(api.conversations.createGroup);

  const listArgs = useMemo(() => {
    if (!user) return null;
    return { excludeClerkUserId: user.id, search };
  }, [user, search]);

  const users = useQuery(
    api.users.listUsers,
    listArgs ?? { excludeClerkUserId: "unknown", search: "" }
  );

  const presence =
    useQuery(
      api.presence.listPresence,
      users
        ? { clerkUserIds: users.map((item) => item.clerkUserId) }
        : { clerkUserIds: [] }
    ) ?? [];

  const presenceMap = new Map(
    presence.map((item) => [
      item.clerkUserId,
      isPresenceOnline(item.lastSeenAt, item.online),
    ])
  );

  const handleCreateDM = async (otherClerkUserId: string) => {
    if (!user || isCreating) return;
    setIsCreating(otherClerkUserId);
    try {
      const conversationId = await getOrCreateDM({ otherClerkUserId });
      router.push(`/chat/${conversationId}`);
    } finally {
      setIsCreating(null);
    }
  };

  const toggleSelected = (clerkUserId: string) => {
    setSelected((prev) =>
      prev.includes(clerkUserId)
        ? prev.filter((id) => id !== clerkUserId)
        : [...prev, clerkUserId]
    );
  };

  const handleCreateGroup = async () => {
    if (!user) return;
    const name = groupName.trim();
    if (!name) {
      setGroupError("Enter a group name.");
      return;
    }
    if (selected.length === 0) {
      setGroupError("Select at least one member.");
      return;
    }
    setGroupError(null);
    try {
      const conversationId = await createGroup({
        title: name,
        memberClerkUserIds: selected,
      });
      setGroupName("");
      setSelected([]);
      router.push(`/chat/${conversationId}`);
    } catch {
      setGroupError("Unable to create group. Try again.");
    }
  };

  const isReady = isLoaded && !!user;
  const isUsersLoading = users === undefined;
  const filteredUsers = users ?? [];
  const hasSearch = search.trim().length > 0;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-solid rounded-2xl p-4 md:p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            Search
          </p>
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mt-3 bg-white/90"
          />
        </div>

        <Card className="space-y-3 p-4 animate-fade-in bg-white/80">
          <p className="text-sm font-medium">Create group</p>
          <Input
            placeholder="Group name"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            className="bg-white/90"
          />
          <Button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selected.length === 0}
            className="accent-gradient"
          >
            Create group ({selected.length})
          </Button>
          {groupError && (
            <p className="text-xs text-red-600">{groupError}</p>
          )}
        </Card>
      </div>

      {(!isReady || isUsersLoading) && (
        <Card className="space-y-3 p-6 animate-fade-in">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      )}

      {isReady && !isUsersLoading && filteredUsers.length === 0 && !hasSearch && (
        <Card className="p-6 text-sm text-neutral-600 animate-fade-in">
          No other users found yet.
        </Card>
      )}

      {isReady && !isUsersLoading && filteredUsers.length === 0 && hasSearch && (
        <Card className="p-6 text-sm text-neutral-600 animate-fade-in">
          No users match your search.
        </Card>
      )}

      <div className="space-y-3">
        {isReady &&
          filteredUsers.map((listedUser) => (
            <Card
              key={listedUser._id}
              className="flex flex-col gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-sm bg-white/85 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-neutral-900"
                  checked={selected.includes(listedUser.clerkUserId)}
                  onChange={() => toggleSelected(listedUser.clerkUserId)}
                />
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={listedUser.imageUrl ?? undefined} />
                    <AvatarFallback>
                      {listedUser.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <PresenceDot
                    online={presenceMap.get(listedUser.clerkUserId) ?? false}
                    className="absolute -bottom-0.5 -right-0.5"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{listedUser.name}</p>
                  {listedUser.email && (
                    <p className="text-xs text-neutral-500">
                      {listedUser.email}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleCreateDM(listedUser.clerkUserId)}
                disabled={isCreating !== null}
                className="w-full md:w-auto"
              >
                {isCreating === listedUser.clerkUserId
                  ? "Opening..."
                  : "Message"}
              </Button>
            </Card>
          ))}
      </div>
    </div>
  );
}
