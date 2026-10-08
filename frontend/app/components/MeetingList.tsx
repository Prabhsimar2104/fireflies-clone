import Link from "next/link";
import type { Meeting } from "../lib/meetings";
import { formatDuration, formatMeetingDate } from "../lib/meetingFormatters";
import styles from "./MeetingList.module.css";

type MeetingListProps = {
  meetings: Meeting[];
  hasActiveFilters?: boolean;
};

export function MeetingList({ meetings, hasActiveFilters = false }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>{hasActiveFilters ? "No meetings found" : "No meetings yet"}</h2>
        <p>{hasActiveFilters ? "Try adjusting or clearing your filters." : "When meetings are added, they will appear here."}</p>
      </div>
    );
  }

  return (
    <ul className={styles.list} aria-label="Meetings">
      {meetings.map((meeting) => (
        <li key={meeting.id}>
          <Link className={styles.meeting} href={`/meetings/${meeting.id}`}>
            <div className={styles.meetingDetails}>
              <h2>{meeting.title}</h2>
              <p>{formatMeetingDate(meeting.meeting_date)} · {formatDuration(meeting.duration_seconds)}</p>
            </div>
            <div className={styles.participants}>
              <span className={styles.participantLabel}>Participants</span>
              <span>{meeting.participants.map((participant) => participant.name).join(", ")}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
