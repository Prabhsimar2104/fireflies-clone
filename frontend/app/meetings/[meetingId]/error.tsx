"use client";

import Link from "next/link";
import styles from "../../page.module.css";

type MeetingDetailErrorProps = {
  reset: () => void;
};

export default function MeetingDetailError({ reset }: MeetingDetailErrorProps) {
  return (
    <section className={styles.page}>
      <div className={styles.errorState} role="alert">
        <h1>We couldn’t load this meeting</h1>
        <p>Check that the backend is running, then try again.</p>
        <button type="button" onClick={reset}>Try again</button>
        <Link href="/">Back to Meetings</Link>
      </div>
    </section>
  );
}
