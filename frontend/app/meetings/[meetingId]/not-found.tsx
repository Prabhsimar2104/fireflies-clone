import Link from "next/link";
import styles from "../../page.module.css";

export default function MeetingNotFound() {
  return (
    <section className={styles.page}>
      <div className={styles.errorState}>
        <h1>Meeting not found</h1>
        <p>This meeting may have been removed or the link is invalid.</p>
        <Link href="/">Back to Meetings</Link>
      </div>
    </section>
  );
}
