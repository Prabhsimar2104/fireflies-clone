export type SummaryTopic = {
  id: number;
  title: string;
  description: string | null;
  position: number;
};

export type MeetingSummary = {
  id: number;
  meeting_id: number;
  summary_text: string;
  topics: SummaryTopic[];
};

export type ActionItem = {
  id: number;
  meeting_id: number;
  task: string;
  assignee: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function getMeetingSummary(meetingId: number, signal?: AbortSignal): Promise<MeetingSummary | null> {
  const response = await fetch(`${apiBaseUrl}/api/v1/meetings/${meetingId}/summary`, {
    cache: "no-store",
    signal,
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Unable to load summary (${response.status}).`);

  return response.json() as Promise<MeetingSummary>;
}

export async function getActionItems(meetingId: number, signal?: AbortSignal): Promise<ActionItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/meetings/${meetingId}/action-items`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) throw new Error(`Unable to load action items (${response.status}).`);

  return response.json() as Promise<ActionItem[]>;
}

export type ActionItemInput = {
  task: string;
  assignee: string | null;
  completed?: boolean;
};

export async function createActionItem(
  meetingId: number,
  input: ActionItemInput,
): Promise<ActionItem> {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/meetings/${meetingId}/action-items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to create action item (${response.status}).`);
  }

  return response.json() as Promise<ActionItem>;
}

export async function updateActionItem(
  meetingId: number,
  actionItemId: number,
  input: Partial<ActionItemInput>,
): Promise<ActionItem> {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/meetings/${meetingId}/action-items/${actionItemId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to update action item (${response.status}).`);
  }

  return response.json() as Promise<ActionItem>;
}

export async function deleteActionItem(
  meetingId: number,
  actionItemId: number,
): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/meetings/${meetingId}/action-items/${actionItemId}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(`Unable to delete action item (${response.status}).`);
  }
}