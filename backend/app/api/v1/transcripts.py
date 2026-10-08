from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import TranscriptSegment
from app.schemas.transcripts import (
    TranscriptSegmentCreate,
    TranscriptSegmentResponse,
    TranscriptSegmentUpdate,
)
from app.services import transcripts as transcript_service


router = APIRouter(prefix="/meetings/{meeting_id}/transcript")


def _get_meeting_or_404(db: Session, meeting_id: int):
    meeting = transcript_service.get_meeting(db, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    return meeting


@router.get("", response_model=list[TranscriptSegmentResponse])
def get_transcript(meeting_id: int, db: Session = Depends(get_db)) -> list[TranscriptSegment]:
    """Return a meeting transcript ordered by numeric start time."""
    _get_meeting_or_404(db, meeting_id)
    return transcript_service.list_segments(db, meeting_id)


@router.post("", response_model=TranscriptSegmentResponse, status_code=status.HTTP_201_CREATED)
def create_transcript_segment(
    meeting_id: int,
    payload: TranscriptSegmentCreate,
    db: Session = Depends(get_db),
) -> TranscriptSegment:
    """Add a participant-attributed transcript segment to a meeting."""
    meeting = _get_meeting_or_404(db, meeting_id)
    try:
        return transcript_service.create_segment(db, meeting, payload)
    except transcript_service.TranscriptValidationError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)) from error


@router.patch("/{segment_id}", response_model=TranscriptSegmentResponse)
def update_transcript_segment(
    meeting_id: int,
    segment_id: int,
    payload: TranscriptSegmentUpdate,
    db: Session = Depends(get_db),
) -> TranscriptSegment:
    """Partially update a transcript segment within its owning meeting."""
    meeting = _get_meeting_or_404(db, meeting_id)
    segment = transcript_service.get_segment(db, meeting_id, segment_id)
    if segment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript segment not found.")
    try:
        return transcript_service.update_segment(db, meeting, segment, payload)
    except transcript_service.TranscriptValidationError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)) from error


@router.delete("/{segment_id}")
def delete_transcript_segment(
    meeting_id: int, segment_id: int, db: Session = Depends(get_db)
) -> dict[str, str]:
    """Delete one transcript segment from its owning meeting."""
    _get_meeting_or_404(db, meeting_id)
    segment = transcript_service.get_segment(db, meeting_id, segment_id)
    if segment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript segment not found.")
    transcript_service.delete_segment(db, segment)
    return {"detail": "Transcript segment deleted successfully."}
