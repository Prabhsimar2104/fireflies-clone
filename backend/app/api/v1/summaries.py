from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import Summary, SummaryTopic
from app.schemas.summaries import (
    SummaryResponse,
    SummaryTopicCreate,
    SummaryTopicResponse,
    SummaryTopicUpdate,
    SummaryUpdate,
)
from app.services import summaries as summary_service


router = APIRouter(prefix="/meetings/{meeting_id}/summary")


def _get_meeting_or_404(db: Session, meeting_id: int):
    meeting = summary_service.get_meeting(db, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    return meeting


def _get_summary_or_404(db: Session, meeting_id: int) -> Summary:
    summary = summary_service.get_summary(db, meeting_id)
    if summary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")
    return summary


def _summary_response(db: Session, summary: Summary) -> SummaryResponse:
    topics = summary_service.list_topics(db, summary.meeting_id)
    return SummaryResponse(
        id=summary.id,
        meeting_id=summary.meeting_id,
        summary_text=summary.summary_text,
        topics=[SummaryTopicResponse.model_validate(topic) for topic in topics],
    )


def _topic_conflict(error: IntegrityError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="A summary topic already uses that position for this meeting.",
    )


@router.get("", response_model=SummaryResponse)
def get_summary(meeting_id: int, db: Session = Depends(get_db)) -> SummaryResponse:
    """Return an existing summary with topics ordered by position."""
    _get_meeting_or_404(db, meeting_id)
    return _summary_response(db, _get_summary_or_404(db, meeting_id))


@router.patch("", response_model=SummaryResponse)
def update_summary(
    meeting_id: int, payload: SummaryUpdate, db: Session = Depends(get_db)
) -> SummaryResponse:
    """Update summary text for a meeting that already has a summary."""
    _get_meeting_or_404(db, meeting_id)
    summary = summary_service.update_summary(db, _get_summary_or_404(db, meeting_id), payload)
    return _summary_response(db, summary)


@router.post("/topics", response_model=SummaryTopicResponse, status_code=status.HTTP_201_CREATED)
def create_summary_topic(
    meeting_id: int, payload: SummaryTopicCreate, db: Session = Depends(get_db)
) -> SummaryTopic:
    """Create an ordered topic for a meeting summary."""
    _get_meeting_or_404(db, meeting_id)
    try:
        return summary_service.create_topic(db, meeting_id, payload)
    except IntegrityError as error:
        db.rollback()
        raise _topic_conflict(error) from error


@router.patch("/topics/{topic_id}", response_model=SummaryTopicResponse)
def update_summary_topic(
    meeting_id: int,
    topic_id: int,
    payload: SummaryTopicUpdate,
    db: Session = Depends(get_db),
) -> SummaryTopic:
    """Partially update a topic owned by the requested meeting."""
    _get_meeting_or_404(db, meeting_id)
    topic = summary_service.get_topic(db, meeting_id, topic_id)
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary topic not found.")
    try:
        return summary_service.update_topic(db, topic, payload)
    except IntegrityError as error:
        db.rollback()
        raise _topic_conflict(error) from error


@router.delete("/topics/{topic_id}")
def delete_summary_topic(
    meeting_id: int, topic_id: int, db: Session = Depends(get_db)
) -> dict[str, str]:
    """Delete a topic owned by the requested meeting."""
    _get_meeting_or_404(db, meeting_id)
    topic = summary_service.get_topic(db, meeting_id, topic_id)
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary topic not found.")
    summary_service.delete_topic(db, topic)
    return {"detail": "Summary topic deleted successfully."}
