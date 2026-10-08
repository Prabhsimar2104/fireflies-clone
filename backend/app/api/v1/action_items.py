from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import ActionItem
from app.schemas.action_items import ActionItemCreate, ActionItemResponse, ActionItemUpdate
from app.services import action_items as action_item_service


router = APIRouter(prefix="/meetings/{meeting_id}/action-items")


def _get_meeting_or_404(db: Session, meeting_id: int):
    meeting = action_item_service.get_meeting(db, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    return meeting


@router.get("", response_model=list[ActionItemResponse])
def get_action_items(meeting_id: int, db: Session = Depends(get_db)) -> list[ActionItem]:
    """Return action items for a meeting in stable ID order."""
    _get_meeting_or_404(db, meeting_id)
    return action_item_service.list_action_items(db, meeting_id)


@router.post("", response_model=ActionItemResponse, status_code=status.HTTP_201_CREATED)
def create_action_item(
    meeting_id: int, payload: ActionItemCreate, db: Session = Depends(get_db)
) -> ActionItem:
    """Create a task for a meeting."""
    _get_meeting_or_404(db, meeting_id)
    return action_item_service.create_action_item(db, meeting_id, payload)


@router.patch("/{action_item_id}", response_model=ActionItemResponse)
def update_action_item(
    meeting_id: int,
    action_item_id: int,
    payload: ActionItemUpdate,
    db: Session = Depends(get_db),
) -> ActionItem:
    """Partially update an action item, including its completion state."""
    _get_meeting_or_404(db, meeting_id)
    action_item = action_item_service.get_action_item(db, meeting_id, action_item_id)
    if action_item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found.")
    return action_item_service.update_action_item(db, action_item, payload)


@router.delete("/{action_item_id}")
def delete_action_item(
    meeting_id: int, action_item_id: int, db: Session = Depends(get_db)
) -> dict[str, str]:
    """Delete an action item owned by the requested meeting."""
    _get_meeting_or_404(db, meeting_id)
    action_item = action_item_service.get_action_item(db, meeting_id, action_item_id)
    if action_item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found.")
    action_item_service.delete_action_item(db, action_item)
    return {"detail": "Action item deleted successfully."}
