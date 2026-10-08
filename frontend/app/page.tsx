import { MeetingList } from "./components/MeetingList";
import { getMeetings } from "./lib/meetings";
import styles from "./page.module.css";

export default async function Home() {
  const { items, total } = await getMeetings();

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.eyebrow}>Workspace</p>
          <h1>Meetings</h1>
          <p className={styles.description}>
            {total === 0 ? "Your meeting library is empty." : `${total} meeting${total === 1 ? "" : "s"} in your library.`}
          </p>
        </div>
      </div>
      <MeetingList meetings={items} />
    </section>
  );
}
