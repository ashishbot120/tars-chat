"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function SyncUser() {
  const { isLoaded, user } = useUser();
  const [hasSynced, setHasSynced] = useState(false);
  const upsertUserFromClerk = useMutation(api.users.upsertUserFromClerk);

  const name = useMemo(() => {
    if (!user) return "User";
    return (
      user.fullName ??
      user.firstName ??
      user.username ??
      user.primaryEmailAddress?.emailAddress ??
      "User"
    );
  }, [user]);

  useEffect(() => {
    if (!isLoaded || !user || hasSynced) return;

    void upsertUserFromClerk({
      clerkUserId: user.id,
      name,
      email: user.primaryEmailAddress?.emailAddress,
      imageUrl: user.imageUrl,
    }).finally(() => setHasSynced(true));
  }, [isLoaded, user, hasSynced, upsertUserFromClerk, name]);

  return null;
}
