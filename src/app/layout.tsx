import type { Metadata } from "next";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import { JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { SyncUser } from "@/components/SyncUser";
import { PresenceHeartbeat } from "@/components/PresenceHeartbeat";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tars App",
  description: "Next.js with Clerk, Convex, and shadcn/ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ClerkProvider>
          <ConvexClientProvider>
            <SignedIn>
              <SyncUser />
              <PresenceHeartbeat />
            </SignedIn>
            {children}
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
