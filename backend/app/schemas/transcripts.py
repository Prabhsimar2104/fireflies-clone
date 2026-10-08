from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class TranscriptSegmentCreate(BaseModel):
    speaker: str = Field(min_length=1, max_length=255)
    start_time: float = Field(ge=0)
    end_time: float = Field(ge=0)
    text: str = Field(min_length=1)

    @field_validator("speaker", "text")
    @classmethod
    def require_non_blank_text(cls, value: str) -> str:
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("This field must not be blank.")
        return normalized_value

    @model_validator(mode="after")
    def validate_timestamp_range(self) -> "TranscriptSegmentCreate":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be greater than start_time.")
        return self


class TranscriptSegmentUpdate(BaseModel):
    speaker: str | None = Field(default=None, min_length=1, max_length=255)
    start_time: float | None = Field(default=None, ge=0)
    end_time: float | None = Field(default=None, ge=0)
    text: str | None = Field(default=None, min_length=1)

    @field_validator("speaker", "text")
    @classmethod
    def require_non_blank_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("This field must not be blank.")
        return normalized_value

    @model_validator(mode="after")
    def validate_supplied_timestamp_range(self) -> "TranscriptSegmentUpdate":
        if (
            self.start_time is not None
            and self.end_time is not None
            and self.end_time <= self.start_time
        ):
            raise ValueError("end_time must be greater than start_time.")
        return self


class TranscriptSegmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    speaker: str
    start_time: float
    end_time: float
    text: str
