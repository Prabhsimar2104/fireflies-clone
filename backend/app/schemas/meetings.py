from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ParticipantInput(BaseModel):
    name: str = Field(min_length=1, max_length=255, description="Participant display name.")

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("Participant name must not be blank.")
        return normalized_value


class ParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    meeting_date: datetime
    duration_seconds: int = Field(ge=0)
    participants: list[ParticipantInput] = Field(min_length=1, max_length=50)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("Meeting title must not be blank.")
        return normalized_value


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    meeting_date: datetime | None = None
    duration_seconds: int | None = Field(default=None, ge=0)
    participants: list[ParticipantInput] | None = Field(default=None, min_length=1, max_length=50)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("Meeting title must not be blank.")
        return normalized_value


class MeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    meeting_date: datetime
    duration_seconds: int
    participants: list[ParticipantResponse]


class MeetingListResponse(BaseModel):
    items: list[MeetingResponse]
    total: int
    limit: int
    offset: int
