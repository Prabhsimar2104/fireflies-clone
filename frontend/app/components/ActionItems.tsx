"use client";

import { useEffect, useState } from "react";
import { getActionItems, type ActionItem } from "../lib/meetingInsights";
import styles from "./MeetingInsights.module.css";

type ActionItemsProps = {
  meetingId: number;
};

export function ActionItems({ meetingId }: ActionItemsProps) {
  const [actionItems, setActionItems] = useState<ActionItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadActionItems() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        setActionItems(await getActionItems(meetingId, controller.signal));
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(error instanceof Error ? error.message : "Unable to load action items.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadActionItems();
    return () => controller.abort();
  }, [meetingId, requestVersion]);

  return (
    <section className={styles.section} aria-labelledby="action-items-heading">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Follow-up</p>
          <h2 id="action-items-heading">Action items</h2>
        </div>
        {actionItems && <span className={styles.itemCount}>{actionItems.length} items</span>}
      </div>

      {isLoading && <div className={styles.state} aria-busy="true">Loading action items…</div>}
      {!isLoading && errorMessage && <div className={styles.state} role="alert"><p>We couldn’t load the action items.</p><span>{errorMessage}</span><button onClick={() => setRequestVersion((current) => current + 1)} type="button">Try again</button></div>}
      {!isLoading && !errorMessage && actionItems?.length === 0 && <div className={styles.state}><p>No action items yet</p><span>Follow-up tasks will appear here when they are available.</span></div>}
      {!isLoading && !errorMessage && actionItems && actionItems.length > 0 && (
        <ul className={styles.actionItems}>
          {actionItems.map((item) => (
            <li key={item.id}>
              <span aria-label={item.completed ? "Completed" : "Open"} className={`${styles.status} ${item.completed ? styles.completed : ""}`} />
              <div>
                <p className={item.completed ? styles.completedTask : ""}>{item.task}</p>
                <span>{item.assignee ? `Assigned to ${item.assignee}` : "Unassigned"}</span>
              </div>
              <span className={`${styles.statusLabel} ${item.completed ? styles.completedLabel : ""}`}>{item.completed ? "Completed" : "Open"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
