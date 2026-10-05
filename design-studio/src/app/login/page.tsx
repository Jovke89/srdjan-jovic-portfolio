import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "Sign in" };

/* Login page START */
export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            DS
          </span>
          <span className={styles.brandTitle}>Design Studio</span>
        </div>
        <div className={styles.heading}>
          <span className="label-bracket">Admin</span>
          <h1 className={styles.title}>Sign in</h1>
        </div>
        <LoginForm />
        <p className={styles.note}>
          Clients open their project with the shared link. No account needed.
        </p>
      </div>
    </main>
  );
}
/* Login page END */
