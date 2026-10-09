export type Participant = {
  id: number;
  name: string;
};

export type Meeting = {
  id: number;
  title: string;
  meeting_date: string;
  duration_seconds: number;
  participants: Participant[];
};

export type MeetingListResponse = {
  items: Meeting[];
  total: number;
  limit: number;
  offset: number;
};

export type MeetingQuery = {
  search: string;
  participant: string;
  dateFrom: string;
  dateTo: string;
  sortOrder: "newest" | "oldest";
};

export type ParticipantInput = {
  name: string;
};

export type MeetingCreateInput = {
  title: string;
  meeting_date: string;
  duration_seconds: number;
  participants: ParticipantInput[];
};

export type MeetingUpdateInput = Partial<MeetingCreateInput>;

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

function createSearchParams(query: MeetingQuery): URLSearchParams {
  const params = new URLSearchParams({ sort_order: query.sortOrder });

  if (query.search.trim()) params.set("search", query.search.trim());
  if (query.participant.trim()) params.set("participant", query.participant.trim());
  if (query.dateFrom) params.set("date_from", query.dateFrom);
  if (query.dateTo) params.set("date_to", query.dateTo);

  return params;
}

export async function getMeetings(query: MeetingQuery, signal?: AbortSignal): Promise<MeetingListResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/meetings?${createSearchParams(query).toString()}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to load meetings (${response.status}).`);
  }

  return response.json() as Promise<MeetingListResponse>;
}

async function mutationError(response: Response, fallbackMessage: string): Promise<Error> {
  const body = await response.json().catch(() => null) as { detail?: string | Array<{ msg?: string }> } | null;
  const detail = body?.detail;
  const message = typeof detail === "string"
    ? detail
    : Array.isArray(detail)
      ? detail.map((item) => item.msg).filter(Boolean).join(" ")
      : fallbackMessage;

  return new Error(message || fallbackMessage);
}

export async function createMeeting(payload: MeetingCreateInput): Promise<Meeting> {
  const response = await fetch(`${apiBaseUrl}/api/v1/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw await mutationError(response, `Unable to create meeting (${response.status}).`);
  return response.json() as Promise<Meeting>;
}

export async function updateMeeting(meetingId: number, payload: MeetingUpdateInput): Promise<Meeting> {
  const response = await fetch(`${apiBaseUrl}/api/v1/meetings/${meetingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw await mutationError(response, `Unable to update meeting (${response.status}).`);
  return response.json() as Promise<Meeting>;
}

export async function deleteMeeting(meetingId: number): Promise<{ detail: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/meetings/${meetingId}`, { method: "DELETE" });

  if (!response.ok) throw await mutationError(response, `Unable to delete meeting (${response.status}).`);
  return response.json() as Promise<{ detail: string }>;
}
