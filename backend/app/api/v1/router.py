from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.meetings import router as meetings_router
from app.api.v1.transcripts import router as transcripts_router


router = APIRouter()
router.include_router(health_router, tags=["health"])
router.include_router(meetings_router, tags=["meetings"])
router.include_router(transcripts_router, tags=["transcript"])
