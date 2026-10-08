import { notFound } from "next/navigation";
import { MeetingDetail } from "../../components/MeetingDetail";
import { getMeeting } from "../../lib/meetingDetail";

type MeetingDetailPageProps = {
  params: Promise<{ meetingId: string }>;
};

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { meetingId } = await params;
  const numericMeetingId = Number(meetingId);

  if (!Number.isSafeInteger(numericMeetingId) || numericMeetingId < 1) notFound();

  const meeting = await getMeeting(numericMeetingId);
  if (!meeting) notFound();

  return <MeetingDetail meeting={meeting} />;
}
