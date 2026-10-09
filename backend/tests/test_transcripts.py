from fastapi.testclient import TestClient

from tests.helpers import create_meeting


def test_transcript_creation_ordering_and_meeting_validation(client: TestClient) -> None:
    meeting = create_meeting(client, duration_seconds=120, participants=["Ada Lovelace"])
    meeting_id = meeting["id"]

    later = client.post(
        f"/api/v1/meetings/{meeting_id}/transcript",
        json={"speaker": "ada lovelace", "start_time": 50, "end_time": 60, "text": "Later update"},
    )
    earlier = client.post(
        f"/api/v1/meetings/{meeting_id}/transcript",
        json={"speaker": "Ada Lovelace", "start_time": 10, "end_time": 20, "text": "Earlier update"},
    )
    assert later.status_code == 201
    assert later.json()["speaker"] == "Ada Lovelace"
    assert earlier.status_code == 201

    transcript = client.get(f"/api/v1/meetings/{meeting_id}/transcript")
    assert [segment["id"] for segment in transcript.json()] == [earlier.json()["id"], later.json()["id"]]

    assert client.post(
        f"/api/v1/meetings/{meeting_id}/transcript",
        json={"speaker": "Unknown", "start_time": 1, "end_time": 2, "text": "Invalid speaker"},
    ).status_code == 422
    assert client.post(
        f"/api/v1/meetings/{meeting_id}/transcript",
        json={"speaker": "Ada Lovelace", "start_time": 110, "end_time": 121, "text": "Too late"},
    ).status_code == 422

    other_meeting = create_meeting(client, title="Other meeting")
    assert client.patch(
        f"/api/v1/meetings/{other_meeting['id']}/transcript/{later.json()['id']}",
        json={"text": "Not owned"},
    ).status_code == 404
