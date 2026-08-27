"use client";

import { useEffect, useRef } from "react";

function beep() {
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(740, context.currentTime);
  oscillator.frequency.setValueAtTime(980, context.currentTime + 0.09);
  gain.gain.setValueAtTime(0.3, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.25);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.3);
  oscillator.addEventListener("ended", () => void context.close());
}

export default function BackgroundChatNotifier() {
  const known = useRef<Set<string> | null>(null);
  const unlocked = useRef(false);
  useEffect(() => {
    const unlock = () => {
      unlocked.current = true;
      const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        ctx.close().catch(() => {});
      }
    };
    const events = ['pointerdown', 'keydown', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, unlock, { once: true }));
    async function check() {
      if (window.location.pathname === "/chat" || window.location.pathname === "/login") return;
      const response = await fetch("/api/chat/messages?roomId=general-it-team", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { messages: { id: string; sender: { id: string; name: string } }[]; viewerId: string };
      const ids = new Set(data.messages.map((message) => message.id));
      const incoming = data.messages.filter((message) => !known.current?.has(message.id) && message.sender.id !== data.viewerId);
      if (known.current && incoming.length) {
        if (unlocked.current) beep();
        if ("Notification" in window && Notification.permission === "granted") {
          const latest = incoming[incoming.length - 1];
          new Notification("New SHIS TechTrack message", { body: `${latest.sender.name} sent a new team message.`, tag: "shis-chat-message" });
        }
      }
      known.current = ids;
    }
    void check();
    const timer = window.setInterval(() => void check(), 1800);
    return () => { 
      window.clearInterval(timer); 
      events.forEach(event => window.removeEventListener(event, unlock)); 
    };
  }, []);
  return null;
}
