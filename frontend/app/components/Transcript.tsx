"use client";

import { useEffect, useState } from "react";
import { formatTimestamp } from "../lib/meetingFormatters";
import { getTranscript, type TranscriptSegment } from "../lib/transcripts";
import styles from "./Transcript.module.css";

type TranscriptProps = {
  currentTime: number;
  meetingId: number;
  onSegmentSelect: (startTime: number) => void;
};

export function Transcript({ currentTime, meetingId, onSegmentSelect }: TranscriptProps) {
  const [segments, setSegments] = useState<TranscriptSegment[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTranscript() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await getTranscript(meetingId, controller.signal);
        setSegments(result);
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(error instanceof Error ? error.message : "Unable to load transcript.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadTranscript();
    return () => controller.abort();
  }, [meetingId, requestVersion]);

  const activeSegmentId = segments?.find(
    (segment) => currentTime >= segment.start_time && currentTime < segment.end_time,
  )?.id;

  return (
    <section className={styles.section} aria-labelledby="transcript-heading">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Conversation</p>
          <h2 id="transcript-heading">Transcript</h2>
        </div>
        {segments && <span className={styles.segmentCount}>{segments.length} segments</span>}
      </div>

      {isLoading && <div className={styles.state} aria-busy="true">Loading transcript…</div>}
      {!isLoading && errorMessage && <div className={styles.state} role="alert"><p>We couldn’t load the transcript.</p><span>{errorMessage}</span><button type="button" onClick={() => setRequestVersion((current) => current + 1)}>Try again</button></div>}
      {!isLoading && !errorMessage && segments?.length === 0 && <div className={styles.state}><p>No transcript yet</p><span>Transcript segments will appear here when they are available.</span></div>}
      {!isLoading && !errorMessage && segments && segments.length > 0 && (
        <ol className={styles.segments}>
          {segments.map((segment) => {
            const isActive = segment.id === activeSegmentId;

            return (
              <li className={`${styles.segment} ${isActive ? styles.segmentActive : ""}`} key={segment.id}>
                <button
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Seek to ${formatTimestamp(segment.start_time)}: ${segment.speaker}`}
                  className={styles.segmentButton}
                  onClick={() => onSegmentSelect(segment.start_time)}
                  type="button"
                >
                  <time dateTime={`PT${segment.start_time}S`}>{formatTimestamp(segment.start_time)}</time>
                  <div>
                    <h3>{segment.speaker}</h3>
                    <p>{segment.text}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
