from datetime import date, datetime, time

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Meeting, Participant
from app.schemas.meetings import MeetingCreate, MeetingUpdate, ParticipantInput


def _meeting_with_participants_query():
    return select(Meeting).options(selectinload(Meeting.participants))


def get_meeting(session: Session, meeting_id: int) -> Meeting | None:
    """Return one meeting and its participants, if it exists."""
    return session.scalar(
        _meeting_with_participants_query().where(Meeting.id == meeting_id)
    )


def list_meetings(
    session: Session,
    *,
    search: str | None,
    participant: str | None,
    date_from: date | None,
    date_to: date | None,
    sort_order: str,
    limit: int,
    offset: int,
) -> tuple[list[Meeting], int]:
    """List meetings with dashboard-oriented filtering and pagination."""
    statement = select(Meeting)

    if search:
        statement = statement.where(Meeting.title.ilike(f"%{search.strip()}%"))
    if participant:
        statement = statement.join(Meeting.participants).where(
            Participant.name.ilike(f"%{participant.strip()}%")
        )
    if date_from:
        statement = statement.where(Meeting.meeting_date >= datetime.combine(date_from, time.min))
    if date_to:
        statement = statement.where(Meeting.meeting_date <= datetime.combine(date_to, time.max))

    statement = statement.distinct()
    total = session.scalar(select(func.count()).select_from(statement.subquery())) or 0

    order_column = Meeting.meeting_date.desc() if sort_order == "newest" else Meeting.meeting_date.asc()
    items = session.scalars(
        statement.options(selectinload(Meeting.participants))
        .order_by(order_column, Meeting.id.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return items, total


def _participants_for_input(
    session: Session, participant_inputs: list[ParticipantInput]
) -> list[Participant]:
    """Find existing participants case-insensitively and create only missing names."""
    names_by_key: dict[str, str] = {}
    for participant in participant_inputs:
        names_by_key.setdefault(participant.name.casefold(), participant.name)

    existing_participants = session.scalars(
        select(Participant).where(func.lower(Participant.name).in_(names_by_key))
    ).all()
    participants_by_key = {
        participant.name.casefold(): participant for participant in existing_participants
    }

    for name_key, display_name in names_by_key.items():
        if name_key not in participants_by_key:
            participant = Participant(name=display_name)
            session.add(participant)
            participants_by_key[name_key] = participant

    return [participants_by_key[name_key] for name_key in names_by_key]


def create_meeting(session: Session, payload: MeetingCreate) -> Meeting:
    """Create a meeting and connect it to existing or newly supplied participants."""
    meeting = Meeting(
        title=payload.title,
        meeting_date=payload.meeting_date,
        duration_seconds=payload.duration_seconds,
    )
    meeting.participants = _participants_for_input(session, payload.participants)
    session.add(meeting)
    session.commit()
    return get_meeting(session, meeting.id)  # type: ignore[return-value]


def update_meeting(session: Session, meeting: Meeting, payload: MeetingUpdate) -> Meeting:
    """Apply the supplied meeting fields and replace participants when provided."""
    values = payload.model_dump(exclude_unset=True, exclude={"participants"})
    for field_name, value in values.items():
        if value is not None:
            setattr(meeting, field_name, value)

    if "participants" in payload.model_fields_set and payload.participants is not None:
        meeting.participants = _participants_for_input(session, payload.participants)

    session.commit()
    return get_meeting(session, meeting.id)  # type: ignore[return-value]


def delete_meeting(session: Session, meeting: Meeting) -> None:
    """Delete a meeting; the database removes its meeting-owned child records."""
    session.delete(meeting)
    session.commit()
