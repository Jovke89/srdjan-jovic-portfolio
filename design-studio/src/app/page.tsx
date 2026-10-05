import { AppShell } from "@/components/shell/AppShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { SidebarBrand, SidebarFooter, SidebarGroup, SidebarItem } from "@/components/shell/Sidebar";
import { requireAdmin } from "@/lib/auth/admin";
import { signOut } from "@/lib/actions/auth";
import styles from "./page.module.css";

/* Dashboard skeleton START */
// Phase 0 placeholder: shell, navigation and empty state only.
// Real data, filters and dialogs arrive in phase 2.
const statuses = [
  { key: "active", label: "Active", color: "var(--color-status-active)" },
  { key: "paused", label: "Paused", color: "var(--color-status-paused)" },
  { key: "closed", label: "Closed", color: "var(--color-status-closed)" },
] as const;

type Status = (typeof statuses)[number]["key"];

function isStatus(value: unknown): value is Status {
  return statuses.some((status) => status.key === value);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status: rawStatus } = await searchParams;
  const status: Status = isStatus(rawStatus) ? rawStatus : "active";
  const current = statuses.find((item) => item.key === status) ?? statuses[0];

  return (
    <AppShell
      sidebar={
        <>
          <SidebarBrand title="Design Studio" subtitle="Srdjan Jovic" />
          <SidebarGroup label="Projects">
            {statuses.map((item) => (
              <SidebarItem
                key={item.key}
                href={`/?status=${item.key}`}
                label={item.label}
                dotColor={item.color}
                count={0}
                active={item.key === status}
                nested
              />
            ))}
          </SidebarGroup>
          <SidebarFooter>
            <form action={signOut}>
              <button type="submit" className="button is-ghost">
                Sign out
              </button>
            </form>
          </SidebarFooter>
        </>
      }
      topbar={<Breadcrumbs items={[{ label: "Projects", href: "/" }, { label: current.label }]} />}
    >
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <span className="label-bracket">01 Projects</span>
            <h1 className={styles.title}>{current.label} projects</h1>
          </div>
          <button type="button" className="button" disabled>
            + New client
          </button>
        </div>
        <div className={styles.empty}>
          <p>No projects yet. The database and project cards come in the next phases.</p>
        </div>
      </div>
    </AppShell>
  );
}
/* Dashboard skeleton END */
