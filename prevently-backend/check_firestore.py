import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

if not firebase_admin._apps:
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
    if service_account_path and os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
    else:
        exit(1)

    firebase_admin.initialize_app(cred, {
        'projectId': os.getenv("FIREBASE_PROJECT_ID")
    })

db = firestore.client()

def check_collections():
    collections = db.collections()
    collection_names = [col.id for col in collections]

    if 'news_datastore' in collection_names:
        news_ref = db.collection('news_datastore')
        docs = news_ref.limit(5).stream()
        count = 0
        for doc in docs:
            count += 1

    if 'domains' in collection_names:
        domains_ref = db.collection('domains')
        docs = domains_ref.stream()
        count = 0
        for doc in docs:
            count += 1

if __name__ == "__main__":
    check_collections()