"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error); setLoading(false); return; }
    router.replace(result.redirectTo);
  }

  return <main className="login-page"><section className="login-visual"><div className="brand-mark">SHIS<span>•</span></div><p className="eyebrow">INTERNAL OPERATIONS</p><h1>Track.<br />Collaborate.<br /><em>Deliver.</em></h1><p className="visual-copy">One calm workspace for the people keeping SHIS connected, secure, and moving forward.</p><div className="signal"><span />System ready <strong>•</strong> All services operational</div></section><section className="login-panel"><div className="login-form-wrap"><p className="eyebrow">SHIS TECHTRACK</p><h2>Welcome back</h2><p className="muted">Sign in to your IT workspace.</p><form onSubmit={submit}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@shis.edu.in" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" minLength={8} required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? "Signing in..." : "Sign in to TechTrack"}<span>↗</span></button></form><p className="form-note">Access is limited to authorised IT department members.</p></div><footer>SHIS IT DEPARTMENT <span>•</span> v0.1 foundation</footer></section></main>;
}
