from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app.db.models import ActionItem, Summary, SummaryTopic, TranscriptSegment
from tests.helpers import create_meeting


def test_deleting_meeting_cascades_to_owned_records(
    client: TestClient, test_session_factory: sessionmaker[Session]
) -> None:
    meeting = create_meeting(client, participants=["Ada Lovelace"])
    meeting_id = meeting["id"]

    transcript = client.post(
        f"/api/v1/meetings/{meeting_id}/transcript",
        json={"speaker": "Ada Lovelace", "start_time": 0, "end_time": 10, "text": "A note"},
    )
    action_item = client.post(
        f"/api/v1/meetings/{meeting_id}/action-items",
        json={"task": "Follow up"},
    )
    assert transcript.status_code == 201
    assert action_item.status_code == 201

    with test_session_factory.begin() as session:
        session.add(Summary(meeting_id=meeting_id, summary_text="Summary"))
        session.add(SummaryTopic(meeting_id=meeting_id, title="Topic", position=0))

    assert client.delete(f"/api/v1/meetings/{meeting_id}").status_code == 200
    assert client.get(f"/api/v1/meetings/{meeting_id}").status_code == 404
    assert client.get(f"/api/v1/meetings/{meeting_id}/transcript").status_code == 404
    assert client.get(f"/api/v1/meetings/{meeting_id}/summary").status_code == 404
    assert client.get(f"/api/v1/meetings/{meeting_id}/action-items").status_code == 404

    with test_session_factory() as session:
        for model in (TranscriptSegment, Summary, SummaryTopic, ActionItem):
            assert session.scalar(select(func.count()).select_from(model).where(model.meeting_id == meeting_id)) == 0
