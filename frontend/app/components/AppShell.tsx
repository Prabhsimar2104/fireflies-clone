import type { ReactNode } from "react";
import styles from "./AppShell.module.css";

type AppShellProps = { children: ReactNode };

const navigationItems = [
  { label: "Meetings", icon: "meetings", active: true },
  { label: "Search", icon: "search", active: false },
  { label: "Settings", icon: "settings", active: false },
];

function NavIcon({ name }: { name: string }) {
  if (name === "search") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></svg>;
  if (name === "settings") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V20.3h-3v-.08A1.7 1.7 0 0 0 10.66 18.66a1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.56-1.04h-.08v-3h.08A1.7 1.7 0 0 0 7 9.92a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.04-1.56V4.62h3v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04h.08v3h-.08A1.7 1.7 0 0 0 19.4 15Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>;
}

function AppMark() {
  return <span className={styles.appMark} aria-hidden="true"><span /><span /><span /></span>;
}

export function AppShell({ children }: AppShellProps) {
  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><AppMark /><span className={styles.brandName}>fireflies</span></div>
      <nav className={styles.navigation} aria-label="Primary navigation">
        {navigationItems.map((item) => <a className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`} href="#" key={item.label}><NavIcon name={item.icon} /><span>{item.label}</span></a>)}
      </nav>
      <div className={styles.sidebarFooter}><button className={styles.inviteButton} type="button"><span aria-hidden="true">+</span><span>Invite teammates</span></button></div>
    </aside>
    <section className={styles.workspace}>
      <header className={styles.header}>
        <button className={styles.workspacePicker} type="button" aria-label="Select workspace"><span className={styles.workspaceAvatar}>F</span><span>Fireflies workspace</span><span className={styles.chevron} aria-hidden="true">⌄</span></button>
        <div className={styles.headerActions}>
          <button className={styles.iconButton} type="button" aria-label="Notifications"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg></button>
          <button className={styles.profileButton} type="button" aria-label="Open profile menu">JD</button>
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </section>
  </div>;
}
