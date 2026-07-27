from pathlib import Path

def create_directories():
    folders=[
        "uploads",
        "audio",
        "transcripts",
        "chunks",
        "output",
        "temp"
    ]
    
    for folder in folders:
        Path(folder).mkdir(exist_ok=True)
