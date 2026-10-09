"use client";

import { useEffect, useRef, useState } from "react";
import type { Meeting, MeetingCreateInput } from "../lib/meetings";
import styles from "./MeetingCrud.module.css";

type MeetingFormDialogProps = {
  initialMeeting?: Meeting;
  onClose: () => void;
  onSave: (payload: MeetingCreateInput) => Promise<void>;
};

function toDateTimeInput(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 16);
  return value.replace(" ", "T").slice(0, 16);
}

function toApiDateTime(value: string): string {
  return `${value}:00`;
}

export function MeetingFormDialog({ initialMeeting, onClose, onSave }: MeetingFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(initialMeeting?.title ?? "");
  const [meetingDate, setMeetingDate] = useState(toDateTimeInput(initialMeeting?.meeting_date));
  const [durationSeconds, setDurationSeconds] = useState(String(initialMeeting?.duration_seconds ?? 0));
  const [participants, setParticipants] = useState(initialMeeting?.participants.map((participant) => participant.name) ?? [""]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(initialMeeting);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const updateParticipant = (index: number, value: string) => {
    setParticipants((current) => current.map((participant, participantIndex) => (
      participantIndex === index ? value : participant
    )));
  };

  const removeParticipant = (index: number) => {
    setParticipants((current) => current.length === 1 ? current : current.filter((_, participantIndex) => participantIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    const normalizedParticipants = participants.map((participant) => participant.trim());
    const duration = Number(durationSeconds);

    if (!normalizedTitle || normalizedTitle.length > 255) return setErrorMessage("Enter a meeting title of up to 255 characters.");
    if (!meetingDate || Number.isNaN(new Date(meetingDate).getTime())) return setErrorMessage("Enter a valid meeting date and time.");
    if (!Number.isSafeInteger(duration) || duration < 0) return setErrorMessage("Duration must be a non-negative whole number of seconds.");
    if (normalizedParticipants.length < 1 || normalizedParticipants.length > 50) return setErrorMessage("Add between 1 and 50 participants.");
    if (normalizedParticipants.some((participant) => !participant || participant.length > 255)) return setErrorMessage("Each participant name must contain 1 to 255 characters.");

    setErrorMessage(null);
    setIsSaving(true);
    try {
      await onSave({
        title: normalizedTitle,
        meeting_date: toApiDateTime(meetingDate),
        duration_seconds: duration,
        participants: normalizedParticipants.map((name) => ({ name })),
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save meeting.");
      setIsSaving(false);
    }
  };

  return (
    <dialog aria-labelledby="meeting-form-heading" className={styles.dialog} onCancel={(event) => { event.preventDefault(); if (!isSaving) onClose(); }} ref={dialogRef}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.eyebrow}>{isEditing ? "Update" : "Create"}</p>
            <h2 id="meeting-form-heading">{isEditing ? "Edit meeting" : "New meeting"}</h2>
          </div>
          <button aria-label="Close meeting form" className={styles.closeButton} disabled={isSaving} onClick={onClose} type="button">×</button>
        </div>
        {errorMessage && <div className={styles.formError} role="alert">{errorMessage}</div>}
        <label className={styles.field}><span>Title</span><input autoFocus disabled={isSaving} maxLength={255} onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
        <label className={styles.field}><span>Date and time</span><input disabled={isSaving} onChange={(event) => setMeetingDate(event.target.value)} required type="datetime-local" value={meetingDate} /></label>
        <label className={styles.field}><span>Duration (seconds)</span><input disabled={isSaving} min="0" onChange={(event) => setDurationSeconds(event.target.value)} required step="1" type="number" value={durationSeconds} /></label>
        <fieldset className={styles.participants}><legend>Participants</legend>
          {participants.map((participant, index) => (
            <div className={styles.participantRow} key={index}>
              <label className={styles.srOnly} htmlFor={`participant-${index}`}>Participant {index + 1}</label>
              <input disabled={isSaving} id={`participant-${index}`} maxLength={255} onChange={(event) => updateParticipant(index, event.target.value)} required value={participant} />
              <button disabled={isSaving || participants.length === 1} onClick={() => removeParticipant(index)} type="button">Remove</button>
            </div>
          ))}
          <button className={styles.addParticipant} disabled={isSaving || participants.length >= 50} onClick={() => setParticipants((current) => [...current, ""])} type="button">Add participant</button>
        </fieldset>
        <div className={styles.formActions}><button disabled={isSaving} onClick={onClose} type="button">Cancel</button><button className={styles.primaryButton} disabled={isSaving} type="submit">{isSaving ? "Saving…" : isEditing ? "Save changes" : "Create meeting"}</button></div>
      </form>
    </dialog>
  );
}
