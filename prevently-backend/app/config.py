import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")
    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")