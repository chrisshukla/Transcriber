import os
import sys
import site

# Register pip-installed NVIDIA CUDA/cuDNN DLL paths on Windows so CTranslate2 can load cublas64_12.dll
if sys.platform == "win32":
    for p in site.getsitepackages() + [site.getusersitepackages()]:
        if os.path.exists(p):
            for pkg in ["cublas", "cudnn", "cuda_nvrtc"]:
                bin_path = os.path.join(p, "nvidia", pkg, "bin")
                if os.path.exists(bin_path):
                    if bin_path not in os.environ["PATH"]:
                        os.environ["PATH"] = bin_path + os.pathsep + os.environ["PATH"]
                    try:
                        os.add_dll_directory(bin_path)
                    except Exception:
                        pass
            # Also check direct nvidia bin
            nvidia_bin = os.path.join(p, "nvidia", "bin")
            if os.path.exists(nvidia_bin):
                if nvidia_bin not in os.environ["PATH"]:
                    os.environ["PATH"] = nvidia_bin + os.pathsep + os.environ["PATH"]
                try:
                    os.add_dll_directory(nvidia_bin)
                except Exception:
                    pass

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