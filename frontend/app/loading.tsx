import styles from "./page.module.css";

export default function Loading() {
  return (
    <section className={styles.page} aria-busy="true">
      <div className={styles.titleRow}>
        <div>
          <p className={styles.eyebrow}>Workspace</p>
          <h1>Meetings</h1>
          <p className={styles.description}>Loading your meetings…</p>
        </div>
      </div>
      <div className={styles.loadingState}>Loading meetings…</div>
    </section>
  );
}
