from fastapi.testclient import TestClient

from tests.helpers import create_meeting


def test_action_items_support_crud_and_completed_false_updates(client: TestClient) -> None:
    meeting = create_meeting(client)
    meeting_id = meeting["id"]

    created = client.post(
        f"/api/v1/meetings/{meeting_id}/action-items",
        json={"task": "Follow up", "assignee": "Ada Lovelace", "completed": True},
    )
    assert created.status_code == 201
    action_item_id = created.json()["id"]

    updated = client.patch(
        f"/api/v1/meetings/{meeting_id}/action-items/{action_item_id}",
        json={"completed": False, "assignee": None},
    )
    assert updated.status_code == 200
    assert updated.json()["completed"] is False
    assert updated.json()["assignee"] is None

    listed = client.get(f"/api/v1/meetings/{meeting_id}/action-items")
    assert [item["id"] for item in listed.json()] == [action_item_id]
    assert client.delete(f"/api/v1/meetings/{meeting_id}/action-items/{action_item_id}").status_code == 200
    assert client.get(f"/api/v1/meetings/{meeting_id}/action-items").json() == []
