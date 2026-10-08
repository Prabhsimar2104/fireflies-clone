from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class _ActionItemTextModel(BaseModel):
    """Common trimming rules for action-item text fields."""

    @field_validator("task", "assignee", check_fields=False)
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("This field must not be blank.")
        return normalized_value


class ActionItemCreate(_ActionItemTextModel):
    task: str = Field(min_length=1)
    assignee: str | None = Field(default=None, max_length=255)
    completed: bool = False


class ActionItemUpdate(_ActionItemTextModel):
    task: str | None = Field(default=None, min_length=1)
    assignee: str | None = Field(default=None, max_length=255)
    completed: bool | None = None


class ActionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    task: str
    assignee: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime
