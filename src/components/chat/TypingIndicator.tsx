"use client";

import { cn } from "@/lib/utils";

type TypingIndicatorProps = {
  label: string;
  className?: string;
};

export function TypingIndicator({ label, className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-emerald-600", className)}>
      <span>{label}</span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.2s]" />
      </span>
    </div>
  );
}
