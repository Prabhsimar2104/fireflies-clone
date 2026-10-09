"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Meeting } from "../lib/meetings";
import { deleteMeeting, updateMeeting, type MeetingCreateInput, type MeetingUpdateInput } from "../lib/meetings";
import { formatDuration, formatMeetingDate } from "../lib/meetingFormatters";
import { ActionItems } from "./ActionItems";
import { DeleteMeetingDialog } from "./DeleteMeetingDialog";
import styles from "./MeetingDetail.module.css";
import { MeetingFormDialog } from "./MeetingFormDialog";
import { MeetingPlayback } from "./MeetingPlayback";
import { MeetingSummary } from "./MeetingSummary";

type MeetingDetailProps = {
  meeting: Meeting;
};

export function MeetingDetail({ meeting }: MeetingDetailProps) {
  const router = useRouter();
  const [currentMeeting, setCurrentMeeting] = useState(meeting);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const restoreFocus = (opener: React.RefObject<HTMLButtonElement | null>) => {
    if (opener.current?.isConnected && !opener.current.disabled) opener.current.focus();
  };

  const handleEditDialogClose = () => {
    setIsEditOpen(false);
    if (!isDeleteOpen) restoreFocus(editButtonRef);
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteOpen(false);
    if (!isEditOpen) restoreFocus(deleteButtonRef);
  };

  const handleEdit = async (payload: MeetingCreateInput) => {
    const updatePayload: MeetingUpdateInput = {};
    if (payload.title !== currentMeeting.title) updatePayload.title = payload.title;
    if (payload.meeting_date.slice(0, 16) !== currentMeeting.meeting_date.replace(" ", "T").slice(0, 16)) updatePayload.meeting_date = payload.meeting_date;
    if (payload.duration_seconds !== currentMeeting.duration_seconds) updatePayload.duration_seconds = payload.duration_seconds;

    const participantsChanged = payload.participants.length !== currentMeeting.participants.length
      || payload.participants.some((participant, index) => participant.name !== currentMeeting.participants[index]?.name);
    if (participantsChanged) updatePayload.participants = payload.participants;

    if (Object.keys(updatePayload).length === 0) {
      setFeedbackMessage("No meeting changes to save.");
      return;
    }

    const updatedMeeting = await updateMeeting(currentMeeting.id, updatePayload);
    setCurrentMeeting(updatedMeeting);
    setFeedbackMessage("Meeting changes saved.");
  };

  const handleDelete = async () => {
    await deleteMeeting(currentMeeting.id);
    window.sessionStorage.setItem("meeting-feedback", `“${currentMeeting.title}” was deleted.`);
    router.push("/");
  };

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} href="/">← Back to Meetings</Link>
      <div className={styles.header}>
        <div><p className={styles.eyebrow}>Meeting</p><h1>{currentMeeting.title}</h1></div>
        <div className={styles.actions}><button onClick={() => setIsEditOpen(true)} ref={editButtonRef} type="button">Edit</button><button className={styles.deleteButton} onClick={() => setIsDeleteOpen(true)} ref={deleteButtonRef} type="button">Delete</button></div>
      </div>
      {feedbackMessage && <div className={styles.successState} role="status">{feedbackMessage}</div>}
      <dl className={styles.details}>
        <div>
          <dt>Date and time</dt>
          <dd>{formatMeetingDate(currentMeeting.meeting_date)}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(currentMeeting.duration_seconds)}</dd>
        </div>
        <div className={styles.participantSection}>
          <dt>Participants</dt>
          <dd>{currentMeeting.participants.map((participant) => participant.name).join(", ")}</dd>
        </div>
      </dl>
      <MeetingPlayback durationSeconds={currentMeeting.duration_seconds} meetingId={currentMeeting.id} />
      <MeetingSummary meetingId={currentMeeting.id} />
      <ActionItems meetingId={currentMeeting.id} />
      {isEditOpen && <MeetingFormDialog initialMeeting={currentMeeting} onClose={handleEditDialogClose} onSave={handleEdit} />}
      {isDeleteOpen && <DeleteMeetingDialog meetingTitle={currentMeeting.title} onClose={handleDeleteDialogClose} onConfirm={handleDelete} />}
    </section>
  );
}
