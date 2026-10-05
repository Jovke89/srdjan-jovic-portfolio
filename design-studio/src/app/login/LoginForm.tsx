"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/lib/actions/auth";
import styles from "./login.module.css";

/* Login form START */
const initialState: SignInState = { error: null, email: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className={styles.form} noValidate>
      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className="input"
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      {state.error ? (
        <p id="login-error" role="alert" className={styles.error}>
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={`button ${styles.submit}`} disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
/* Login form END */
