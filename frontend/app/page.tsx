"use client";

import { useEffect, useRef, useState } from "react";
import { MeetingFilters } from "./components/MeetingFilters";
import { MeetingFormDialog } from "./components/MeetingFormDialog";
import { MeetingList } from "./components/MeetingList";
import { createMeeting, getMeetings, type MeetingCreateInput, type MeetingListResponse, type MeetingQuery } from "./lib/meetings";
import styles from "./page.module.css";

const defaultQuery: MeetingQuery = {
  search: "",
  participant: "",
  dateFrom: "",
  dateTo: "",
  sortOrder: "newest",
};

export default function Home() {
  const [query, setQuery] = useState<MeetingQuery>(defaultQuery);
  const [meetings, setMeetings] = useState<MeetingListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const newMeetingButtonRef = useRef<HTMLButtonElement>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const message = window.sessionStorage.getItem("meeting-feedback");
    window.sessionStorage.removeItem("meeting-feedback");
    return message;
  });

  useEffect(() => {
    const controller = new AbortController();
    const debounceTimer = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await getMeetings(query, controller.signal);
        setMeetings(result);
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(error instanceof Error ? error.message : "Unable to load meetings.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [query, requestVersion]);

  const updateQuery = (updates: Partial<MeetingQuery>) => setQuery((current) => ({ ...current, ...updates }));
  const hasActiveFilters = Boolean(query.search || query.participant || query.dateFrom || query.dateTo || query.sortOrder === "oldest");
  const handleCreate = async (payload: MeetingCreateInput) => {
    const meeting = await createMeeting(payload);
    setFeedbackMessage(`“${meeting.title}” was created.`);
    setRequestVersion((current) => current + 1);
  };

  const handleCreateDialogClose = () => {
    setIsCreateOpen(false);
    const opener = newMeetingButtonRef.current;
    if (opener?.isConnected && !opener.disabled) opener.focus();
  };

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.eyebrow}>Workspace</p>
          <h1>Meetings</h1>
          <p className={styles.description}>
            {meetings ? (meetings.total === 0 ? "No meetings match your current view." : `${meetings.total} meeting${meetings.total === 1 ? "" : "s"} in your library.`) : "Loading your meetings…"}
          </p>
        </div>
        <button className={styles.newMeetingButton} onClick={() => setIsCreateOpen(true)} ref={newMeetingButtonRef} type="button">New meeting</button>
      </div>

      {feedbackMessage && <div className={styles.successState} role="status">{feedbackMessage}</div>}
      <MeetingFilters query={query} onQueryChange={updateQuery} onClear={() => setQuery(defaultQuery)} />

      {isLoading && <div className={styles.loadingState} aria-busy="true">Loading meetings…</div>}
      {!isLoading && errorMessage && <div className={styles.errorState} role="alert"><h2>We couldn’t load your meetings</h2><p>{errorMessage}</p><button type="button" onClick={() => setRequestVersion((current) => current + 1)}>Try again</button></div>}
      {!isLoading && !errorMessage && meetings && <MeetingList meetings={meetings.items} hasActiveFilters={hasActiveFilters} />}
      {isCreateOpen && <MeetingFormDialog onClose={handleCreateDialogClose} onSave={handleCreate} />}
    </section>
  );
}
