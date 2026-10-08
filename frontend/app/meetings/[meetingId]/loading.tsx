import styles from "../../page.module.css";

export default function MeetingDetailLoading() {
  return (
    <section className={styles.page} aria-busy="true">
      <p className={styles.eyebrow}>Meeting</p>
      <h1 className={styles.loadingTitle}>Loading meeting…</h1>
      <div className={styles.loadingState}>Loading meeting details…</div>
    </section>
  );
}
