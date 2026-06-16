import os
from pathlib import Path
import json
from dotenv import load_dotenv

# Path mapping
PIPELINE_DIR = Path(__file__).resolve().parent
ROOT_DIR = PIPELINE_DIR.parent

# Load environment configurations
load_dotenv(ROOT_DIR / ".env")

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "brew-idea-hub/1.0 by antigravity-agent")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def get_categories():
    categories_path = ROOT_DIR / "src" / "data" / "categories.json"
    if not categories_path.exists():
        raise FileNotFoundError(f"Categories config not found at: {categories_path}")
    
    with open(categories_path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_output_dir() -> Path:
    output_dir = ROOT_DIR / "src" / "data"
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir
