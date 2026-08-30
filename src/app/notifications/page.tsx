import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LiveClock from "@/components/live-clock";
import ProfileMenu from "@/components/profile-menu";
import MobileMenu from "@/components/mobile-menu";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin/dashboard");
  const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <main className="workspace">
      <MobileMenu />
      <aside className="sidebar">
        <div className="side-brand">SHIS<span>•</span></div>
        <p className="side-label">WORKSPACE</p>
        <nav>
          <a href="/dashboard">◈ <span>My dashboard</span></a>
          <a href="/dashboard/tasks">□ <span>My tasks</span></a>
          <a href="/chat">◌ <span>Team chat</span></a>
          <a className="active" href="/notifications">◇ <span>Notifications</span></a>
        </nav>
        <div className="side-bottom"><ProfileMenu initial={user.name} userId={user.id} initialStatus={user.presenceStatus} /></div>
      </aside>
      <section className="workspace-main">
        <header className="topbar">
          <span>IT DEPARTMENT / NOTIFICATIONS</span>
          <div className="topbar-actions">
            <LiveClock />
            <a className="icon-button" href="/notifications" aria-label="Notifications">♢</a>
            <ProfileMenu initial={user.name} userId={user.id} initialStatus={user.presenceStatus} compact />
          </div>
        </header>
        <div className="page-content">
          <div className="welcome">
            <p className="eyebrow">NOTIFICATIONS</p>
            <h1>Your updates</h1>
            <p>Task assignments and alerts for your IT work.</p>
          </div>
          <section className="content-section">
            <div className="task-list">
              {notifications.length === 0 ? (
                <div className="empty-state">No notifications yet.</div>
              ) : notifications.map((item) => (
                <article className="task-row" key={item.id}>
                  <div className="task-icon">{item.isRead ? "✓" : "◇"}</div>
                  <div className="task-main">
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </div>
                  <div className="task-date">{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(item.createdAt)}</div>
                </article>
              ))}
            </div>
          </section>
          <footer className="product-credit">Product Designed by Sanchit</footer>
        </div>
      </section>
    </main>
  );
}
