from pydantic import BaseModel, ConfigDict, Field, field_validator


class _TrimmedTextModel(BaseModel):
    """Common trimming rules for summary text fields."""

    @field_validator("title", "summary_text", "description", check_fields=False)
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("This field must not be blank.")
        return normalized_value


class SummaryTopicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    position: int


class SummaryResponse(BaseModel):
    id: int
    meeting_id: int
    summary_text: str
    topics: list[SummaryTopicResponse]


class SummaryUpdate(_TrimmedTextModel):
    summary_text: str = Field(min_length=1)


class SummaryTopicCreate(_TrimmedTextModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    position: int = Field(ge=0)


class SummaryTopicUpdate(_TrimmedTextModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    position: int | None = Field(default=None, ge=0)
