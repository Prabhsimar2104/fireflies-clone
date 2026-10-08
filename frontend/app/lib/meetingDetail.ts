import type { Meeting } from "./meetings";

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function getMeeting(meetingId: number): Promise<Meeting | null> {
  const response = await fetch(`${apiBaseUrl}/api/v1/meetings/${meetingId}`, {
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Unable to load meeting (${response.status}).`);

  return response.json() as Promise<Meeting>;
}
