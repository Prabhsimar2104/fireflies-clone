from fastapi.testclient import TestClient

from tests.helpers import create_meeting, meeting_payload


def test_meeting_crud_normalizes_values_reuses_participants_and_replaces_them(client: TestClient) -> None:
    created = create_meeting(
        client,
        title="  Planning session  ",
        participants=["  Ada Lovelace  ", "Grace Hopper"],
    )
    meeting_id = created["id"]
    assert created["title"] == "Planning session"
    assert [participant["name"] for participant in created["participants"]] == ["Ada Lovelace", "Grace Hopper"]

    second = create_meeting(client, title="Second session", participants=["ada lovelace"])
    assert second["participants"][0]["id"] == created["participants"][0]["id"]

    updated = client.patch(
        f"/api/v1/meetings/{meeting_id}",
        json={"title": "Updated session", "participants": [{"name": "Linus Torvalds"}]},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated session"
    assert [participant["name"] for participant in updated.json()["participants"]] == ["Linus Torvalds"]

    assert client.delete(f"/api/v1/meetings/{meeting_id}").json() == {"detail": "Meeting deleted successfully."}
    assert client.get(f"/api/v1/meetings/{meeting_id}").status_code == 404


def test_meeting_validation_and_missing_resources(client: TestClient) -> None:
    assert client.post("/api/v1/meetings", json=meeting_payload(title="   ")).status_code == 422
    assert client.post("/api/v1/meetings", json=meeting_payload(participants=[])).status_code == 422
    assert client.post("/api/v1/meetings", json=meeting_payload(duration_seconds=-1)).status_code == 422
    assert client.get("/api/v1/meetings/9999").status_code == 404
    assert client.get("/api/v1/meetings?date_from=2026-02-01&date_to=2026-01-01").status_code == 422


def test_meeting_filters_sorting_and_pagination(client: TestClient) -> None:
    first = create_meeting(
        client,
        title="Roadmap review",
        meeting_date="2026-01-10T09:00:00",
        participants=["Ada Lovelace"],
    )
    second = create_meeting(
        client,
        title="Roadmap retrospective",
        meeting_date="2026-01-20T09:00:00",
        participants=["Grace Hopper"],
    )
    create_meeting(
        client,
        title="Budget review",
        meeting_date="2026-01-30T09:00:00",
        participants=["Grace Hopper"],
    )

    filtered = client.get("/api/v1/meetings?search=ROADMAP&participant=grace&sort_order=oldest")
    assert filtered.status_code == 200
    assert [item["id"] for item in filtered.json()["items"]] == [second["id"]]

    paged = client.get("/api/v1/meetings?sort_order=oldest&limit=1&offset=1")
    assert paged.status_code == 200
    assert paged.json()["total"] == 3
    assert paged.json()["items"][0]["id"] == second["id"]
    assert first["id"] != second["id"]
