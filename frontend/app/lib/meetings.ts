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

const apiBaseUrl = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function getMeetings(): Promise<MeetingListResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/meetings`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to load meetings (${response.status}).`);
  }

  return response.json() as Promise<MeetingListResponse>;
}
