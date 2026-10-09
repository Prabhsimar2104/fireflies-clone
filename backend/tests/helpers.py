from fastapi.testclient import TestClient


def meeting_payload(
    *,
    title: str = "Planning session",
    meeting_date: str = "2026-01-15T10:00:00",
    duration_seconds: int = 1800,
    participants: list[str] | None = None,
) -> dict[str, object]:
    names = ["Ada Lovelace"] if participants is None else participants
    return {
        "title": title,
        "meeting_date": meeting_date,
        "duration_seconds": duration_seconds,
        "participants": [{"name": name} for name in names],
    }


def create_meeting(client: TestClient, **overrides: object) -> dict[str, object]:
    payload = meeting_payload(**overrides)
    response = client.post("/api/v1/meetings", json=payload)
    assert response.status_code == 201, response.text
    return response.json()
