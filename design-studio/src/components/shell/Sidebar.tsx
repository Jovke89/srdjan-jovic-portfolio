import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import styles from "./Sidebar.module.css";

/* Sidebar building blocks START */
export function SidebarBrand({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className={styles.brand}>
      <span className={styles.brandMark} aria-hidden="true">
        DS
      </span>
      <span className={styles.brandText}>
        <span className={styles.brandTitle}>{title}</span>
        {subtitle ? <span className={styles.brandSubtitle}>{subtitle}</span> : null}
      </span>
    </div>
  );
}

export function SidebarGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav className={styles.group} aria-label={label}>
      <span className="label-bracket">{label}</span>
      <ul className={styles.list}>{children}</ul>
    </nav>
  );
}

type SidebarItemProps = {
  href: Route;
  label: string;
  active?: boolean;
  dotColor?: string;
  count?: number;
  nested?: boolean;
};

export function SidebarItem({ href, label, active, dotColor, count, nested }: SidebarItemProps) {
  return (
    <li>
      <Link
        href={href}
        className={`${styles.item} ${nested ? styles.nested : ""}`}
        aria-current={active ? "page" : undefined}
      >
        {dotColor ? (
          <span className={styles.dot} style={{ background: dotColor }} aria-hidden="true" />
        ) : null}
        <span className={styles.itemLabel}>{label}</span>
        {count !== undefined ? <span className={styles.count}>{count}</span> : null}
      </Link>
    </li>
  );
}

export function SidebarFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>;
}
/* Sidebar building blocks END */
