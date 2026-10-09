"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MeetingCrud.module.css";

type DeleteMeetingDialogProps = {
  meetingTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteMeetingDialog({ meetingTitle, onClose, onConfirm }: DeleteMeetingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const handleConfirm = async () => {
    setErrorMessage(null);
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete meeting.");
      setIsDeleting(false);
    }
  };

  return (
    <dialog aria-labelledby="delete-meeting-heading" className={styles.dialog} onCancel={(event) => { event.preventDefault(); if (!isDeleting) onClose(); }} ref={dialogRef}>
      <div className={styles.form}>
        <div className={styles.dialogHeader}><div><p className={styles.dangerEyebrow}>Permanent action</p><h2 id="delete-meeting-heading">Delete meeting?</h2></div><button aria-label="Close delete confirmation" className={styles.closeButton} disabled={isDeleting} onClick={onClose} type="button">×</button></div>
        <p className={styles.deleteCopy}>Delete “{meetingTitle}”? This permanently removes its transcript, summary, topics, and action items.</p>
        {errorMessage && <div className={styles.formError} role="alert">{errorMessage}</div>}
        <div className={styles.formActions}><button disabled={isDeleting} onClick={onClose} type="button">Cancel</button><button className={styles.deleteButton} disabled={isDeleting} onClick={handleConfirm} type="button">{isDeleting ? "Deleting…" : "Delete meeting"}</button></div>
      </div>
    </dialog>
  );
}
