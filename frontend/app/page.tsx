import styles from "./page.module.css";

export default function Home() {
  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.eyebrow}>Workspace</p>
          <h1>Meetings</h1>
          <p className={styles.description}>Review and organize every conversation in one place.</p>
        </div>
        <button className={styles.newMeetingButton} type="button">New meeting</button>
      </div>
      <div className={styles.placeholder}>
        <div className={styles.placeholderIcon} aria-hidden="true"><span /><span /><span /></div>
        <h2>Your meetings library will live here</h2>
        <p>This foundation is ready for the dashboard, filters, and meeting data in the next phase.</p>
      </div>
    </section>
  );
}
