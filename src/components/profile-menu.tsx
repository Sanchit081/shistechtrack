"use client";

import { useEffect, useRef, useState } from "react";

const statusValues = { "Available now": "AVAILABLE", "Away for now": "AWAY", "Do not disturb": "DO_NOT_DISTURB", "Be right back": "BE_RIGHT_BACK", Offline: "OFFLINE" } as const;
type Presence = { label: keyof typeof statusValues; tone: string };
const statuses: Presence[] = [
  { label: "Available now", tone: "available" },
  { label: "Away for now", tone: "away" },
  { label: "Do not disturb", tone: "busy" },
  { label: "Be right back", tone: "brb" },
  { label: "Offline", tone: "offline" },
];

export default function ProfileMenu({ initial, userId, initialStatus = "AVAILABLE", compact = false }: { initial: string; userId?: string; initialStatus?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Presence>(() => statuses.find((item) => statusValues[item.label] === initialStatus) ?? statuses[0]);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => { fetch("/api/me", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => { const match = statuses.find((item) => statusValues[item.label] === data?.user?.presenceStatus); if (match) setStatus(match); }); }, []);
  useEffect(() => { const close = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  async function choose(next: Presence) { setStatus(next); setOpen(false); if (userId) await fetch("/api/me/status", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: statusValues[next.label as keyof typeof statusValues] }) }); }
  return <div className={`profile-menu ${compact ? "compact" : ""}`} ref={menuRef}><button className="profile-trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Open profile and availability menu"><span className="profile-chip">{initial.charAt(0)}</span>{!compact && <span className="profile-trigger-copy"><strong>{initial}</strong><small><i className={`presence-dot ${status.tone}`} />{status.label}</small></span>}<span className="profile-chevron">⌄</span></button>{open && <div className="profile-popover"><div className="profile-summary"><div className={`presence-dot ${status.tone}`} /><div><strong>{initial}</strong><small>{status.label}</small></div></div><div className="presence-options">{statuses.map((item) => <button key={item.label} onClick={() => choose(item)}><span className={`presence-dot ${item.tone}`} />{item.label}{item.label === status.label && <b>✓</b>}</button>)}</div><button className="menu-action" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}>Sign out</button></div>}</div>;
}
