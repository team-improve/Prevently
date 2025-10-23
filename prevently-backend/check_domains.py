import firebase_admin
from firebase_admin import credentials, firestore
import os

cred = credentials.Certificate('service-account.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

domains_ref = db.collection('domains')
docs = domains_ref.stream()

for doc in docs:
    domain_data = doc.to_dict()