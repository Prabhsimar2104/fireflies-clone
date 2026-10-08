export type TranscriptSegment = {
  id: number;
  speaker: string;
  start_time: number;
  end_time: number;
  text: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function getTranscript(meetingId: number, signal?: AbortSignal): Promise<TranscriptSegment[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/meetings/${meetingId}/transcript`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to load transcript (${response.status}).`);
  }

  return response.json() as Promise<TranscriptSegment[]>;
}
