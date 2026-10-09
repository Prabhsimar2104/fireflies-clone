from fastapi.testclient import TestClient


def test_health_endpoints_report_running(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "running"}
    assert client.get("/api/v1/health").json() == {"status": "running", "api_version": "v1"}
