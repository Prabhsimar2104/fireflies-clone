import Link from "next/link";
import type { Meeting } from "../lib/meetings";
import { formatDuration, formatMeetingDate } from "../lib/meetingFormatters";
import styles from "./MeetingDetail.module.css";
import { Transcript } from "./Transcript";

type MeetingDetailProps = {
  meeting: Meeting;
};

export function MeetingDetail({ meeting }: MeetingDetailProps) {
  return (
    <section className={styles.page}>
      <Link className={styles.backLink} href="/">← Back to Meetings</Link>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Meeting</p>
        <h1>{meeting.title}</h1>
      </div>
      <dl className={styles.details}>
        <div>
          <dt>Date and time</dt>
          <dd>{formatMeetingDate(meeting.meeting_date)}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(meeting.duration_seconds)}</dd>
        </div>
        <div className={styles.participantSection}>
          <dt>Participants</dt>
          <dd>{meeting.participants.map((participant) => participant.name).join(", ")}</dd>
        </div>
      </dl>
      <Transcript meetingId={meeting.id} />
    </section>
  );
}
