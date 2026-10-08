from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Meeting, TranscriptSegment
from app.schemas.transcripts import TranscriptSegmentCreate, TranscriptSegmentUpdate


class TranscriptValidationError(ValueError):
    """Raised when a transcript change violates meeting-specific rules."""


def get_meeting(session: Session, meeting_id: int) -> Meeting | None:
    """Return a meeting with its participants for transcript validation."""
    return session.scalar(
        select(Meeting)
        .options(selectinload(Meeting.participants))
        .where(Meeting.id == meeting_id)
    )


def list_segments(session: Session, meeting_id: int) -> list[TranscriptSegment]:
    """Return a meeting transcript in media-seek order."""
    return session.scalars(
        select(TranscriptSegment)
        .where(TranscriptSegment.meeting_id == meeting_id)
        .order_by(TranscriptSegment.start_time.asc(), TranscriptSegment.id.asc())
    ).all()


def get_segment(
    session: Session, meeting_id: int, segment_id: int
) -> TranscriptSegment | None:
    """Return a segment only when it belongs to the requested meeting."""
    return session.scalar(
        select(TranscriptSegment).where(
            TranscriptSegment.id == segment_id,
            TranscriptSegment.meeting_id == meeting_id,
        )
    )


def _participant_speaker_name(meeting: Meeting, supplied_speaker: str) -> str:
    """Return the canonical participant name or reject an unrelated speaker."""
    participant_names = {
        participant.name.casefold(): participant.name for participant in meeting.participants
    }
    speaker_name = participant_names.get(supplied_speaker.casefold())
    if speaker_name is None:
        raise TranscriptValidationError(
            "speaker must be a participant associated with this meeting."
        )
    return speaker_name


def _validate_timestamps(meeting: Meeting, start_time: float, end_time: float) -> None:
    """Keep segment timing valid for meeting-media seeking."""
    if start_time < 0:
        raise TranscriptValidationError("start_time must be greater than or equal to zero.")
    if end_time <= start_time:
        raise TranscriptValidationError("end_time must be greater than start_time.")
    if end_time > meeting.duration_seconds:
        raise TranscriptValidationError("end_time must not exceed the meeting duration.")


def create_segment(
    session: Session, meeting: Meeting, payload: TranscriptSegmentCreate
) -> TranscriptSegment:
    """Create one transcript segment for an existing meeting."""
    _validate_timestamps(meeting, payload.start_time, payload.end_time)
    segment = TranscriptSegment(
        meeting_id=meeting.id,
        speaker=_participant_speaker_name(meeting, payload.speaker),
        start_time=payload.start_time,
        end_time=payload.end_time,
        text=payload.text,
    )
    session.add(segment)
    session.commit()
    session.refresh(segment)
    return segment


def update_segment(
    session: Session,
    meeting: Meeting,
    segment: TranscriptSegment,
    payload: TranscriptSegmentUpdate,
) -> TranscriptSegment:
    """Apply a partial update after validating the complete resulting segment."""
    start_time = segment.start_time if payload.start_time is None else payload.start_time
    end_time = segment.end_time if payload.end_time is None else payload.end_time
    _validate_timestamps(meeting, start_time, end_time)

    if payload.speaker is not None:
        segment.speaker = _participant_speaker_name(meeting, payload.speaker)
    if payload.start_time is not None:
        segment.start_time = payload.start_time
    if payload.end_time is not None:
        segment.end_time = payload.end_time
    if payload.text is not None:
        segment.text = payload.text

    session.commit()
    session.refresh(segment)
    return segment


def delete_segment(session: Session, segment: TranscriptSegment) -> None:
    """Delete a transcript segment that was resolved through its parent meeting."""
    session.delete(segment)
    session.commit()
