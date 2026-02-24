"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const HEARTBEAT_INTERVAL_MS = 25_000;

export function PresenceHeartbeat() {
  const { isLoaded, isSignedIn } = useUser();
  const heartbeat = useMutation(api.presence.heartbeat);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let isCancelled = false;

    const beat = () => {
      if (isCancelled) return;
      void heartbeat();
    };

    beat();
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isLoaded, isSignedIn, heartbeat]);

  return null;
}
