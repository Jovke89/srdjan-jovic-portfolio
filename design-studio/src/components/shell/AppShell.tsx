import type { ReactNode } from "react";
import styles from "./AppShell.module.css";

/* App shell START */
// Layout frame shared by admin and client link views:
// narrow sidebar on the left, top bar and scrollable main area on the right.
// On narrow screens the sidebar stacks above the content.
type AppShellProps = {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <aside className={styles.sidebar} aria-label="Sidebar">
        {sidebar}
      </aside>
      <div className={styles.body}>
        <header className={styles.topbar}>{topbar}</header>
        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
/* App shell END */
