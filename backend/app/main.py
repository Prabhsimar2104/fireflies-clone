from fastapi import FastAPI

app = FastAPI(title="Fireflies Clone API")


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Return the backend health status."""
    return {"status": "running"}
