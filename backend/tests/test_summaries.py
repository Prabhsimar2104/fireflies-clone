from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.db.models import Summary
from tests.helpers import create_meeting


def test_summary_updates_topics_are_ordered_and_positions_are_unique(
    client: TestClient, test_session_factory: sessionmaker[Session]
) -> None:
    meeting = create_meeting(client)
    meeting_id = meeting["id"]

    assert client.get(f"/api/v1/meetings/{meeting_id}/summary").status_code == 404
    with test_session_factory.begin() as session:
        session.add(Summary(meeting_id=meeting_id, summary_text="Initial summary"))

    updated_summary = client.patch(
        f"/api/v1/meetings/{meeting_id}/summary",
        json={"summary_text": "  Updated summary  "},
    )
    assert updated_summary.status_code == 200
    assert updated_summary.json()["summary_text"] == "Updated summary"

    second_topic = client.post(
        f"/api/v1/meetings/{meeting_id}/summary/topics",
        json={"title": "Second", "description": "Later", "position": 1},
    )
    first_topic = client.post(
        f"/api/v1/meetings/{meeting_id}/summary/topics",
        json={"title": "First", "position": 0},
    )
    assert second_topic.status_code == 201
    assert first_topic.status_code == 201

    duplicate_position = client.post(
        f"/api/v1/meetings/{meeting_id}/summary/topics",
        json={"title": "Duplicate", "position": 0},
    )
    assert duplicate_position.status_code == 409

    summary = client.get(f"/api/v1/meetings/{meeting_id}/summary")
    assert [topic["title"] for topic in summary.json()["topics"]] == ["First", "Second"]
