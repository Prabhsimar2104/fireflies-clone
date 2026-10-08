from fastapi import APIRouter


router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Report that version 1 of the API is available."""
    return {"status": "running", "api_version": "v1"}
