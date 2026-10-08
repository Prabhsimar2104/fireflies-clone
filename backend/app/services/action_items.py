from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ActionItem, Meeting
from app.schemas.action_items import ActionItemCreate, ActionItemUpdate


def get_meeting(session: Session, meeting_id: int) -> Meeting | None:
    """Return a meeting used to verify action-item ownership."""
    return session.get(Meeting, meeting_id)


def list_action_items(session: Session, meeting_id: int) -> list[ActionItem]:
    """Return action items in stable creation/ID order."""
    return session.scalars(
        select(ActionItem)
        .where(ActionItem.meeting_id == meeting_id)
        .order_by(ActionItem.id.asc())
    ).all()


def get_action_item(
    session: Session, meeting_id: int, action_item_id: int
) -> ActionItem | None:
    """Return an action item only when it belongs to the requested meeting."""
    return session.scalar(
        select(ActionItem).where(
            ActionItem.id == action_item_id,
            ActionItem.meeting_id == meeting_id,
        )
    )


def create_action_item(
    session: Session, meeting_id: int, payload: ActionItemCreate
) -> ActionItem:
    """Create one action item for an existing meeting."""
    action_item = ActionItem(
        meeting_id=meeting_id,
        task=payload.task,
        assignee=payload.assignee,
        completed=payload.completed,
    )
    session.add(action_item)
    session.commit()
    session.refresh(action_item)
    return action_item


def update_action_item(
    session: Session, action_item: ActionItem, payload: ActionItemUpdate
) -> ActionItem:
    """Apply supplied action-item fields while supporting false and null values."""
    if payload.task is not None:
        action_item.task = payload.task
    if "assignee" in payload.model_fields_set:
        action_item.assignee = payload.assignee
    if payload.completed is not None:
        action_item.completed = payload.completed

    session.commit()
    session.refresh(action_item)
    return action_item


def delete_action_item(session: Session, action_item: ActionItem) -> None:
    """Delete an action item already resolved through its parent meeting."""
    session.delete(action_item)
    session.commit()
