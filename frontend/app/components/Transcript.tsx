"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatTimestamp } from "../lib/meetingFormatters";
import { getTranscript, type TranscriptSegment } from "../lib/transcripts";
import styles from "./Transcript.module.css";

type TranscriptProps = {
  currentTime: number;
  meetingId: number;
  onSegmentSelect: (startTime: number) => void;
};

function highlightMatches(text: string, query: string): ReactNode {
  if (!query) return text;

  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const parts: ReactNode[] = [];
  let startIndex = 0;
  let matchIndex = normalizedText.indexOf(normalizedQuery, startIndex);

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) parts.push(text.slice(startIndex, matchIndex));

    const endIndex = matchIndex + query.length;
    parts.push(<mark className={styles.matchHighlight} key={matchIndex}>{text.slice(matchIndex, endIndex)}</mark>);
    startIndex = endIndex;
    matchIndex = normalizedText.indexOf(normalizedQuery, startIndex);
  }

  if (startIndex < text.length) parts.push(text.slice(startIndex));

  return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
}

export function Transcript({ currentTime, meetingId, onSegmentSelect }: TranscriptProps) {
  const [segments, setSegments] = useState<TranscriptSegment[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const segmentRefs = useRef(new Map<number, HTMLLIElement>());

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
  const normalizedQuery = searchQuery.toLowerCase();
  const matchingSegments = useMemo(
    () => segments?.filter((segment) => segment.text.toLowerCase().includes(normalizedQuery)) ?? [],
    [normalizedQuery, segments],
  );
  const visibleSegments = normalizedQuery ? matchingSegments : segments ?? [];
  const selectedSegment = normalizedQuery ? matchingSegments[selectedMatchIndex] : undefined;

  useEffect(() => {
    if (!selectedSegment) return;

    segmentRefs.current.get(selectedSegment.id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedSegment]);

  const selectPreviousMatch = () => {
    setSelectedMatchIndex((currentIndex) => (
      currentIndex === 0 ? matchingSegments.length - 1 : currentIndex - 1
    ));
  };

  const selectNextMatch = () => {
    setSelectedMatchIndex((currentIndex) => (
      currentIndex === matchingSegments.length - 1 ? 0 : currentIndex + 1
    ));
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setSelectedMatchIndex(0);
  };

  return (
    <section className={styles.section} aria-labelledby="transcript-heading">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Conversation</p>
          <h2 id="transcript-heading">Transcript</h2>
        </div>
        {segments && <span className={styles.segmentCount}>{segments.length} segments</span>}
      </div>

      {!isLoading && !errorMessage && segments && segments.length > 0 && (
        <div className={styles.searchControls}>
          <label className={styles.searchField}>
            <span className={styles.srOnly}>Search transcript</span>
            <input
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search transcript"
              type="search"
              value={searchQuery}
            />
          </label>
          {searchQuery && <button className={styles.clearSearch} onClick={() => handleSearchChange("")} type="button">Clear</button>}
          {normalizedQuery && (
            <div className={styles.matchNavigation} aria-label="Search result navigation">
              <span className={styles.matchCount}>{matchingSegments.length} matching {matchingSegments.length === 1 ? "segment" : "segments"}</span>
              <button aria-label="Previous matching transcript segment" disabled={matchingSegments.length === 0} onClick={selectPreviousMatch} type="button">Previous</button>
              <span aria-live="polite" className={styles.currentMatch}>
                {matchingSegments.length > 0 ? `${selectedMatchIndex + 1} of ${matchingSegments.length}` : "No selected match"}
              </span>
              <button aria-label="Next matching transcript segment" disabled={matchingSegments.length === 0} onClick={selectNextMatch} type="button">Next</button>
            </div>
          )}
        </div>
      )}

      {isLoading && <div className={styles.state} aria-busy="true">Loading transcript…</div>}
      {!isLoading && errorMessage && <div className={styles.state} role="alert"><p>We couldn’t load the transcript.</p><span>{errorMessage}</span><button type="button" onClick={() => setRequestVersion((current) => current + 1)}>Try again</button></div>}
      {!isLoading && !errorMessage && segments?.length === 0 && <div className={styles.state}><p>No transcript yet</p><span>Transcript segments will appear here when they are available.</span></div>}
      {!isLoading && !errorMessage && normalizedQuery && matchingSegments.length === 0 && (
        <div className={styles.searchEmpty} role="status">No transcript segments match “{searchQuery}”.</div>
      )}
      {!isLoading && !errorMessage && visibleSegments.length > 0 && (
        <ol className={styles.segments}>
          {visibleSegments.map((segment) => {
            const isActive = segment.id === activeSegmentId;
            const isSelectedMatch = segment.id === selectedSegment?.id;

            return (
              <li
                className={`${styles.segment} ${isActive ? styles.segmentActive : ""} ${isSelectedMatch ? styles.segmentSearchSelected : ""}`}
                key={segment.id}
                ref={(element) => {
                  if (element) segmentRefs.current.set(segment.id, element);
                  else segmentRefs.current.delete(segment.id);
                }}
              >
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
                    <p>{highlightMatches(segment.text, normalizedQuery)}</p>
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
