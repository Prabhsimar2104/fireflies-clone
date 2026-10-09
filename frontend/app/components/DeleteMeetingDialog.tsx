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
  const isUserClosingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const requestClose = () => {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    isUserClosingRef.current = true;
    dialog.close();
  };

  const handleDialogClose = () => {
    if (!isUserClosingRef.current) return;
    isUserClosingRef.current = false;
    onClose();
  };

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
    <dialog aria-describedby="delete-meeting-description" aria-labelledby="delete-meeting-heading" className={styles.dialog} onCancel={(event) => { event.preventDefault(); if (!isDeleting) requestClose(); }} onClose={handleDialogClose} ref={dialogRef}>
      <div className={styles.form}>
        <div className={styles.dialogHeader}><div><p className={styles.dangerEyebrow}>Permanent action</p><h2 id="delete-meeting-heading">Delete meeting?</h2></div><button aria-label="Close delete confirmation" className={styles.closeButton} disabled={isDeleting} onClick={requestClose} type="button">×</button></div>
        <p className={styles.deleteCopy} id="delete-meeting-description">Delete “{meetingTitle}”? This permanently removes its transcript, summary, topics, and action items.</p>
        {errorMessage && <div aria-live="assertive" className={styles.formError} role="alert">{errorMessage}</div>}
        <div className={styles.formActions}><button disabled={isDeleting} onClick={requestClose} type="button">Cancel</button><button className={styles.deleteButton} disabled={isDeleting} onClick={handleConfirm} type="button">{isDeleting ? "Deleting…" : "Delete meeting"}</button></div>
      </div>
    </dialog>
  );
}
