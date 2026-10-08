from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Meeting, Summary, SummaryTopic
from app.schemas.summaries import SummaryTopicCreate, SummaryTopicUpdate, SummaryUpdate


def get_meeting(session: Session, meeting_id: int) -> Meeting | None:
    """Return a meeting used to verify summary-resource ownership."""
    return session.get(Meeting, meeting_id)


def get_summary(session: Session, meeting_id: int) -> Summary | None:
    """Return the stored summary for a meeting, if it exists."""
    return session.scalar(select(Summary).where(Summary.meeting_id == meeting_id))


def list_topics(session: Session, meeting_id: int) -> list[SummaryTopic]:
    """Return summary topics in their persisted display order."""
    return session.scalars(
        select(SummaryTopic)
        .where(SummaryTopic.meeting_id == meeting_id)
        .order_by(SummaryTopic.position.asc(), SummaryTopic.id.asc())
    ).all()


def get_topic(session: Session, meeting_id: int, topic_id: int) -> SummaryTopic | None:
    """Return a topic only when it belongs to the requested meeting."""
    return session.scalar(
        select(SummaryTopic).where(
            SummaryTopic.id == topic_id,
            SummaryTopic.meeting_id == meeting_id,
        )
    )


def update_summary(session: Session, summary: Summary, payload: SummaryUpdate) -> Summary:
    """Update existing stored summary text without creating a new summary."""
    summary.summary_text = payload.summary_text
    session.commit()
    session.refresh(summary)
    return summary


def create_topic(
    session: Session, meeting_id: int, payload: SummaryTopicCreate
) -> SummaryTopic:
    """Create one ordered summary topic for an existing meeting."""
    topic = SummaryTopic(
        meeting_id=meeting_id,
        title=payload.title,
        description=payload.description,
        position=payload.position,
    )
    session.add(topic)
    session.commit()
    session.refresh(topic)
    return topic


def update_topic(
    session: Session, topic: SummaryTopic, payload: SummaryTopicUpdate
) -> SummaryTopic:
    """Apply the supplied topic fields while retaining unspecified values."""
    if payload.title is not None:
        topic.title = payload.title
    if "description" in payload.model_fields_set:
        topic.description = payload.description
    if payload.position is not None:
        topic.position = payload.position

    session.commit()
    session.refresh(topic)
    return topic


def delete_topic(session: Session, topic: SummaryTopic) -> None:
    """Delete a topic already resolved through its parent meeting."""
    session.delete(topic)
    session.commit()
