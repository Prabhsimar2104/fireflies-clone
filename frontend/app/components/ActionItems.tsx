"use client";

import { useEffect, useState } from "react";
import {
  createActionItem,
  deleteActionItem,
  getActionItems,
  updateActionItem,
  type ActionItem,
} from "../lib/meetingInsights";
import styles from "./MeetingInsights.module.css";

type ActionItemsProps = {
  meetingId: number;
};

export function ActionItems({ meetingId }: ActionItemsProps) {
  const [actionItems, setActionItems] = useState<ActionItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [task, setTask] = useState("");
  const [assignee, setAssignee] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editCompleted, setEditCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadActionItems() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        setActionItems(await getActionItems(meetingId, controller.signal));
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load action items.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadActionItems();
    return () => controller.abort();
  }, [meetingId, requestVersion]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task.trim()) {
      setOperationError("Enter a task description.");
      return;
    }

    setIsSaving(true);
    setOperationError(null);

    try {
      const created = await createActionItem(meetingId, {
        task: task.trim(),
        assignee: assignee.trim() || null,
      });
      setActionItems((current) => [...(current ?? []), created]);
      setTask("");
      setAssignee("");
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : "Unable to create action item.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(item: ActionItem) {
    setEditingId(item.id);
    setEditTask(item.task);
    setEditAssignee(item.assignee ?? "");
    setEditCompleted(item.completed);
    setOperationError(null);
  }

  async function handleUpdate(itemId: number) {
    if (!editTask.trim()) {
      setOperationError("Task description cannot be empty.");
      return;
    }

    setIsSaving(true);
    setOperationError(null);

    try {
      const updated = await updateActionItem(meetingId, itemId, {
        task: editTask.trim(),
        assignee: editAssignee.trim() || null,
        completed: editCompleted,
      });
      setActionItems((current) =>
        current?.map((item) => (item.id === itemId ? updated : item)) ?? [],
      );
      setEditingId(null);
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : "Unable to update action item.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleCompleted(item: ActionItem) {
    setIsSaving(true);
    setOperationError(null);

    try {
      const updated = await updateActionItem(meetingId, item.id, {
        completed: !item.completed,
      });
      setActionItems((current) =>
        current?.map((entry) => (entry.id === item.id ? updated : entry)) ?? [],
      );
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : "Unable to update action item.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: ActionItem) {
    if (!window.confirm(`Delete this action item?\n\n${item.task}`)) return;

    setIsSaving(true);
    setOperationError(null);

    try {
      await deleteActionItem(meetingId, item.id);
      setActionItems((current) =>
        current?.filter((entry) => entry.id !== item.id) ?? [],
      );
      if (editingId === item.id) setEditingId(null);
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : "Unable to delete action item.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="action-items-heading">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Follow-up</p>
          <h2 id="action-items-heading">Action items</h2>
        </div>
        {actionItems && (
          <span className={styles.itemCount}>{actionItems.length} items</span>
        )}
      </div>

      {isLoading && (
        <div className={styles.state} aria-busy="true">
          Loading action items...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className={styles.state} role="alert">
          <p>We couldn&apos;t load the action items.</p>
          <span>{errorMessage}</span>
          <button
            onClick={() => setRequestVersion((current) => current + 1)}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && (
        <>
          <form onSubmit={handleCreate} className={styles.actionItemForm}>
            <label>
              Task
              <input
                value={task}
                onChange={(event) => setTask(event.target.value)}
                placeholder="What needs to be done?"
                maxLength={2000}
                required
              />
            </label>
            <label>
              Assignee (optional)
              <input
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                placeholder="Person responsible"
                maxLength={255}
              />
            </label>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Add action item"}
            </button>
          </form>

          {operationError && (
            <p className={styles.state} role="alert">
              {operationError}
            </p>
          )}

          {actionItems?.length === 0 && (
            <div className={styles.state}>
              <p>No action items yet</p>
              <span>Add a follow-up task using the form above.</span>
            </div>
          )}

          {!!actionItems?.length && (
            <ul className={styles.actionItems}>
              {actionItems.map((item) => (
                <li key={item.id}>
                  {editingId === item.id ? (
                    <div className={styles.actionItemEditor}>
                      <label>
                        Task
                        <input
                          value={editTask}
                          onChange={(event) => setEditTask(event.target.value)}
                          maxLength={2000}
                          required
                        />
                      </label>
                      <label>
                        Assignee
                        <input
                          value={editAssignee}
                          onChange={(event) =>
                            setEditAssignee(event.target.value)
                          }
                          maxLength={255}
                        />
                      </label>
                      <label className={styles.actionItemCheckbox}>
                        <input
                          type="checkbox"
                          checked={editCompleted}
                          onChange={(event) =>
                            setEditCompleted(event.target.checked)
                          }
                        />
                        Completed
                      </label>
                      <div className={styles.actionItemActions}>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleUpdate(item.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.actionItemToggle}
                        disabled={isSaving}
                        aria-label={
                          item.completed
                            ? `Reopen ${item.task}`
                            : `Complete ${item.task}`
                        }
                        onClick={() => handleToggleCompleted(item)}
                      >
                        {item.completed ? "✓" : "○"}
                      </button>
                      <div className={styles.actionItemContent}>
                        <p
                          className={
                            item.completed ? styles.completedTask : ""
                          }
                        >
                          {item.task}
                        </p>
                        <span>
                          {item.assignee
                            ? `Assigned to ${item.assignee}`
                            : "Unassigned"}
                        </span>
                      </div>
                      <span
                        className={`${styles.statusLabel} ${
                          item.completed ? styles.completedLabel : ""
                        }`}
                      >
                        {item.completed ? "Completed" : "Open"}
                      </span>
                      <div className={styles.actionItemActions}>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => startEditing(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}