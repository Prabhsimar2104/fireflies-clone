import type { Meeting } from "../lib/meetings";
import styles from "./MeetingList.module.css";

type MeetingListProps = {
  meetings: Meeting[];
  hasActiveFilters?: boolean;
};

function formatMeetingDate(meetingDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(meetingDate));
}

function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

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
        <li className={styles.meeting} key={meeting.id}>
          <div className={styles.meetingDetails}>
            <h2>{meeting.title}</h2>
            <p>{formatMeetingDate(meeting.meeting_date)} · {formatDuration(meeting.duration_seconds)}</p>
          </div>
          <div className={styles.participants}>
            <span className={styles.participantLabel}>Participants</span>
            <span>{meeting.participants.map((participant) => participant.name).join(", ")}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
