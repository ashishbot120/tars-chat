"use client";

import { cn } from "@/lib/utils";

type PresenceDotProps = {
  online: boolean;
  className?: string;
};

export function PresenceDot({ online, className }: PresenceDotProps) {
  return (
    <span
      className={cn(
        "inline-flex h-2.5 w-2.5 rounded-full border border-white",
        online ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" : "bg-neutral-300",
        className
      )}
      aria-label={online ? "Online" : "Offline"}
      title={online ? "Online" : "Offline"}
    />
  );
}
