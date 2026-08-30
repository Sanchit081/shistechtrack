"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import MobileMenu from "@/components/mobile-menu";

type Message = { id: string; message: string; createdAt: string; messageType?: string; sender: { id: string; name: string }; attachments?: { id: string; originalFilename: string }[] };
const roomId = "general-it-team";

function playMessageSound() {
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(740, context.currentTime);
  oscillator.frequency.setValueAtTime(980, context.currentTime + 0.09);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.24);
  oscillator.addEventListener("ended", () => void context.close());
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewerId, setViewerId] = useState("");
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownMessages = useRef<Set<string> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/chat/messages?roomId=${roomId}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json() as { messages: Message[]; viewerId: string };
    const nextIds = new Set(data.messages.map((item) => item.id));
    if (knownMessages.current && soundEnabled && data.messages.some((item) => !knownMessages.current?.has(item.id) && item.sender.id !== data.viewerId)) playMessageSound();
    knownMessages.current = nextIds;
    setMessages(data.messages);
    setViewerId(data.viewerId);
  }, [soundEnabled]);

  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 1800); return () => window.clearInterval(timer); }, [refresh]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function send(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (file) {
      const payload = new FormData(); payload.append("roomId", roomId); payload.append("file", file);
      const response = await fetch("/api/chat/upload", { method: "POST", body: payload });
      if (!response.ok) { setError((await response.json()).error); return; }
      setFile(null); const input = document.getElementById("chat-file") as HTMLInputElement | null; if (input) input.value = ""; refresh(); return;
    }
    if (!draft.trim()) return;
    const response = await fetch("/api/chat/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId, message: draft }) });
    if (response.ok) { setDraft(""); refresh(); }
  }

  async function toggleSound() { if (soundEnabled && "Notification" in window && Notification.permission === "default") { await Notification.requestPermission(); playMessageSound(); return; } const next = !soundEnabled; if (next) playMessageSound(); setSoundEnabled(next); }

  return <main className="chat-page"><MobileMenu /><header className="chat-header"><a href="/dashboard">← Workspace</a><div><p className="eyebrow">LIVE CHANNEL</p><h1>General IT Team</h1></div><button className={`sound-toggle ${soundEnabled ? "on" : ""}`} onClick={toggleSound} aria-pressed={soundEnabled}>{soundEnabled ? "Sound on" : "Sound off"}</button><span className="live-dot">LIVE</span></header><section className="messages">{messages.length === 0 && <div className="chat-empty">Start the conversation with your IT team.</div>}{messages.map((item) => <div className={`message ${item.sender.id === viewerId ? "mine" : ""}`} key={item.id}><div className="message-avatar">{item.sender.name.charAt(0)}</div><div><strong>{item.sender.name}</strong><p>{item.attachments?.[0] ? <a className="attachment-link" href={`/api/chat/files/${item.attachments[0].id}`} target="_blank" rel="noreferrer">{item.message} ↗</a> : item.message}</p><small>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div></div>)}<div ref={endRef} /></section>{error && <p className="form-error chat-error">{error}</p>}<form className="chat-composer" onSubmit={send}><label className="file-button" htmlFor="chat-file">＋ file<input id="chat-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={file ? file.name : "Write a message to the team..."} maxLength={4000} disabled={Boolean(file)} /><button className="primary-button">{file ? "Upload" : "Send"} <span>↗</span></button></form></main>;
}
