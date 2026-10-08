"use client";

import { useEffect } from "react";
import styles from "./page.module.css";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.eyebrow}>Workspace</p>
          <h1>Meetings</h1>
        </div>
      </div>
      <div className={styles.errorState} role="alert">
        <h2>We couldn’t load your meetings</h2>
        <p>Check that the backend is running, then try again.</p>
        <button type="button" onClick={reset}>Try again</button>
      </div>
    </section>
  );
}
