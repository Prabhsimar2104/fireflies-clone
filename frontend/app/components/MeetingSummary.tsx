"use client";

import { useEffect, useState } from "react";
import { getMeetingSummary, type MeetingSummary as MeetingSummaryData } from "../lib/meetingInsights";
import styles from "./MeetingInsights.module.css";

type MeetingSummaryProps = {
  meetingId: number;
};

export function MeetingSummary({ meetingId }: MeetingSummaryProps) {
  const [summary, setSummary] = useState<MeetingSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        setSummary(await getMeetingSummary(meetingId, controller.signal));
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(error instanceof Error ? error.message : "Unable to load summary.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadSummary();
    return () => controller.abort();
  }, [meetingId, requestVersion]);

  return (
    <section className={styles.section} aria-labelledby="summary-heading">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Overview</p>
          <h2 id="summary-heading">Summary</h2>
        </div>
      </div>

      {isLoading && <div className={styles.state} aria-busy="true">Loading summary…</div>}
      {!isLoading && errorMessage && <div className={styles.state} role="alert"><p>We couldn’t load the summary.</p><span>{errorMessage}</span><button onClick={() => setRequestVersion((current) => current + 1)} type="button">Try again</button></div>}
      {!isLoading && !errorMessage && !summary && <div className={styles.state}><p>No summary yet</p><span>A summary will appear here when it is available.</span></div>}
      {!isLoading && !errorMessage && summary && (
        <div className={styles.summaryContent}>
          <p className={styles.summaryText}>{summary.summary_text}</p>
          {summary.topics.length > 0 && (
            <div className={styles.topics}>
              <h3>Key topics</h3>
              <ol>
                {summary.topics.map((topic) => (
                  <li key={topic.id}>
                    <h4>{topic.title}</h4>
                    {topic.description && <p>{topic.description}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {summary.topics.length === 0 && <p className={styles.muted}>No summary topics yet.</p>}
        </div>
      )}
    </section>
  );
}
