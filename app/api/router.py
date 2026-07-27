from fastapi import APIRouter

from app.api.routes.upload import router as upload_router
from app.api.routes.transcription import router as transcription_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.download import router as download_router

router = APIRouter()

router.include_router(upload_router)
router.include_router(transcription_router)
router.include_router(jobs_router)
router.include_router(download_router)