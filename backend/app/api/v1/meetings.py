from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.meetings import MeetingCreate, MeetingListResponse, MeetingResponse, MeetingUpdate
from app.services import meetings as meeting_service


router = APIRouter(prefix="/meetings")


@router.get("", response_model=MeetingListResponse)
def list_meetings(
    search: str | None = Query(default=None, max_length=255, description="Case-insensitive title search."),
    participant: str | None = Query(
        default=None, max_length=255, description="Case-insensitive participant-name filter."
    ),
    date_from: date | None = Query(default=None, description="Include meetings on or after this date."),
    date_to: date | None = Query(default=None, description="Include meetings on or before this date."),
    sort_order: Literal["newest", "oldest"] = Query(
        default="newest", description="Sort by meeting date; newest is the default."
    ),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum meetings to return."),
    offset: int = Query(default=0, ge=0, description="Number of meetings to skip."),
    db: Session = Depends(get_db),
) -> MeetingListResponse:
    """Return a paginated meeting library without transcript content."""
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="date_from must be on or before date_to.")

    items, total = meeting_service.list_meetings(
        db,
        search=search,
        participant=participant,
        date_from=date_from,
        date_to=date_to,
        sort_order=sort_order,
        limit=limit,
        offset=offset,
    )
    return MeetingListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)) -> Meeting:
    """Return one meeting and its participants."""
    meeting = meeting_service.get_meeting(db, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    return meeting


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: MeetingCreate, db: Session = Depends(get_db)) -> Meeting:
    """Create a meeting while reusing any matching participant records."""
    try:
        return meeting_service.create_meeting(db, payload)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The meeting could not be created.",
        ) from error


@router.patch("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: int, payload: MeetingUpdate, db: Session = Depends(get_db)
) -> Meeting:
    """Partially update a meeting and optionally replace its participants."""
    meeting = meeting_service.get_meeting(db, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    try:
        return meeting_service.update_meeting(db, meeting, payload)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The meeting could not be updated.",
        ) from error


@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    """Delete a meeting and its meeting-owned child records."""
    meeting = meeting_service.get_meeting(db, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    meeting_service.delete_meeting(db, meeting)
    return {"detail": "Meeting deleted successfully."}
