"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { cn } from "@/lib/utils";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isConversation = pathname.startsWith("/chat/") && pathname !== "/chat";

  return (
    <div className="min-h-screen bg-chat">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6 md:py-10">
        <aside
          className={cn(
            "w-full md:w-80",
            isConversation ? "hidden md:block" : "block"
          )}
        >
          <div className="surface-glass glass-border rounded-[28px] p-5 animate-rise">
            <ChatSidebar />
          </div>
        </aside>
        <main
          className={cn(
            "flex-1",
            isConversation ? "block" : "hidden md:block"
          )}
        >
          <div className="surface-glass glass-border rounded-[28px] p-3 md:p-5 animate-rise">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
