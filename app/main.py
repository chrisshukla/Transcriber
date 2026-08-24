from contextlib import asynccontextmanager
from fastapi import FastAPI  # type: ignore # pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware  # type: ignore # pyrefly: ignore [missing-import]

from app.api.router import router
from app.utils.file_utils import create_directories
from app.database.database import initialize_database
from app.queue.job_store import job_manager

create_directories()
initialize_database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await job_manager.start_worker()
    yield


app = FastAPI(
    title="AI Transcription API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "AI Transcription API Running"
    }