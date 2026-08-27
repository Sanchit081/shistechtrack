import type { Metadata } from "next";
import "./globals.css";
import BackgroundChatNotifier from "@/components/background-chat-notifier";

export const metadata: Metadata = { title: "SHIS TechTrack", description: "IT Department Management & Communication" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><BackgroundChatNotifier />{children}</body></html>;
}
