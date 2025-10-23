from fastapi import APIRouter, HTTPException, Request
import requests
from pydantic import BaseModel
from app.config import Config
import json
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import firebase_admin
from firebase_admin import credentials, firestore
import os

router = APIRouter()

if not firebase_admin._apps:
    if Config.FIREBASE_SERVICE_ACCOUNT_KEY_PATH and os.path.exists(Config.FIREBASE_SERVICE_ACCOUNT_KEY_PATH):
        cred = credentials.Certificate(Config.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
    else:
        cred = credentials.ApplicationDefault()
    
    firebase_admin.initialize_app(cred, {
        'projectId': Config.FIREBASE_PROJECT_ID
    })

db = firestore.client()

async def get_email_from_username(username: str) -> Optional[str]:
    try:
        doc_ref = db.collection('usernames').document(username.lower())
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict().get('email')
        return None
    except Exception as e:
        return None

async def save_username_mapping(username: str, email: str):
    try:
        doc_ref = db.collection('usernames').document(username.lower())
        doc_ref.set({
            'email': email,
            'username': username.lower(),
            'created_at': firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save user data")

class RegisterRequest(BaseModel):
    email: str
    password: str
    username: str

class LoginRequest(BaseModel):
    email_or_username: str
    password: str

class ResetPasswordRequest(BaseModel):
    email: str

class GoogleAuthRequest(BaseModel):
    id_token: str

class VerifyEmailRequest(BaseModel):
    oob_code: str

class LogoutRequest(BaseModel):
    refresh_token: str

@router.post("/register")
async def register_user(request: RegisterRequest):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={Config.FIREBASE_API_KEY}"
    payload = {
        "email": request.email,
        "password": request.password,
        "displayName": request.username,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
    
    user_data = response.json()
    id_token = user_data.get("idToken")
    
    await save_username_mapping(request.username, request.email)
    
    verify_url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={Config.FIREBASE_API_KEY}"
    verify_payload = {
        "requestType": "VERIFY_EMAIL",
        "idToken": id_token
    }
    verify_response = requests.post(verify_url, json=verify_payload)
    
    if verify_response.status_code != 200:
        pass
    
    return {"message": "Registration successful. Please check your email to verify your account."}

@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest):    
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:update?key={Config.FIREBASE_API_KEY}"
    payload = {
        "oobCode": request.oob_code
    }
    response = requests.post(url, json=payload)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
    
    result = response.json()
    if result.get("emailVerified") == True:
        return {"message": "Email verified successfully. You can now log in."}
    else:
        return {"message": "Email verification processed. You can now log in."}

@router.post("/resend-verification")
async def resend_verification(request: LoginRequest):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={Config.FIREBASE_API_KEY}"
    payload = {
        "email": request.email_or_username,
        "password": request.password,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload)
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
    
    user_data = response.json()
    id_token = user_data.get("idToken")
    
    verify_url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={Config.FIREBASE_API_KEY}"
    verify_payload = {
        "requestType": "VERIFY_EMAIL",
        "idToken": id_token
    }
    verify_response = requests.post(verify_url, json=verify_payload)
    
    if verify_response.status_code != 200:
        raise HTTPException(status_code=verify_response.status_code, detail=verify_response.json())
    
    return {"message": "Verification email sent. Please check your email."}

@router.post("/login")
async def login_user(request: LoginRequest):
    email_to_use = request.email_or_username
    
    if '@' not in request.email_or_username:
        email_from_username = await get_email_from_username(request.email_or_username)
        if email_from_username:
            email_to_use = email_from_username
        else:
            raise HTTPException(status_code=400, detail="Username not found")
    
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={Config.FIREBASE_API_KEY}"
    payload = {
        "email": email_to_use,
        "password": request.password,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
    
    user_data = response.json()
    
    if not user_data.get("emailVerified", False):
        info_url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={Config.FIREBASE_API_KEY}"
        info_payload = {
            "idToken": user_data.get("idToken")
        }
        info_response = requests.post(info_url, json=info_payload)
        if info_response.status_code == 200:
            info_data = info_response.json()
            users = info_data.get("users", [])
            if users:
                user_info = users[0]
                if user_info.get("emailVerified", False):
                    user_data["emailVerified"] = True
                else:
                    raise HTTPException(status_code=403, detail="Email not verified. Please check your email and verify your account before logging in.")
        else:
            raise HTTPException(status_code=403, detail="Email not verified. Please check your email and verify your account before logging in.")
    
    return user_data

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={Config.FIREBASE_API_KEY}"
    payload = {
        "requestType": "PASSWORD_RESET",
        "email": request.email
    }
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
    return {"message": "Password reset email sent"}

@router.post("/logout")
async def logout_user(request: LogoutRequest):
    url = f"https://securetoken.googleapis.com/v1/token?key={Config.FIREBASE_API_KEY}"
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": request.refresh_token
    }
    response = requests.post(url, json=payload)
    
    return {"message": "Logged out successfully"}

@router.post("/google")
async def google_auth(request: GoogleAuthRequest):
    try:
        idinfo = id_token.verify_oauth2_token(request.id_token, google_requests.Request())

        email = idinfo.get('email')
        name = idinfo.get('name', '')
        google_id = idinfo.get('sub')

        if not email:
            raise HTTPException(status_code=400, detail="Email not found in Google token")

        firebase_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={Config.FIREBASE_API_KEY}"
        payload = {
            "email": email,
            "password": f"google_oauth_{google_id}",
            "returnSecureToken": True
        }

        firebase_response = requests.post(firebase_url, json=payload)

        if firebase_response.status_code == 200:
            return firebase_response.json()
        elif firebase_response.status_code == 400 and "EMAIL_NOT_FOUND" in firebase_response.json().get("error", {}).get("message", ""):
            create_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={Config.FIREBASE_API_KEY}"
            create_payload = {
                "email": email,
                "password": f"google_oauth_{google_id}",
                "displayName": name,
                "returnSecureToken": True
            }
            create_response = requests.post(create_url, json=create_payload)

            if create_response.status_code != 200:
                raise HTTPException(status_code=create_response.status_code, detail=create_response.json())

            return create_response.json()
        else:
            raise HTTPException(status_code=firebase_response.status_code, detail=firebase_response.json())

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google ID token: {str(e)}")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Authentication service error: {str(e)}")

@router.get("/domains")
async def get_domains():
    try:
        domains_ref = db.collection('domains')
        docs = domains_ref.stream()

        domains = []
        for doc in docs:
            domain_data = doc.to_dict()
            domains.append({
                'id': doc.id,
                'name': domain_data.get('name', ''),
                'description': domain_data.get('description', '')
            })

        domains.sort(key=lambda x: x['name'])

        return {"domains": domains}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve domains")

@router.get("/news/{domain}")
async def get_news_by_domain(
    domain: str,
    page: int = 1,
    limit: int = 20,
    sentiment_filter: str = "all",
    date_from: int = None,
    date_to: int = None
):
    try:
        page = max(page, 1)
        limit = min(max(limit, 1), 50)
        offset = (page - 1) * limit

        query = db.collection('news_datastore').where('domain', '==', domain)

        if date_from is not None and date_to is not None:
            query = query.where('timestamp', '>=', date_from).where('timestamp', '<=', date_to)
        elif date_from is not None:
            query = query.where('timestamp', '>=', date_from)
        elif date_to is not None:
            query = query.where('timestamp', '<=', date_to)

        docs = query.order_by('timestamp', direction=firestore.Query.DESCENDING).stream()

        all_articles = []
        for doc in docs:
            article_data = doc.to_dict()
            sentiment = article_data.get('sentiment_numeric', 0)

            if sentiment_filter == "positive" and sentiment < 0.1:
                continue
            elif sentiment_filter == "neutral" and (sentiment <= -0.1 or sentiment >= 0.1):
                continue
            elif sentiment_filter == "negative" and sentiment > -0.1:
                continue

            all_articles.append({
                'id': article_data.get('id', ''),
                'title': article_data.get('title', ''),
                'description': article_data.get('description', ''),
                'domain': article_data.get('domain', ''),
                'companies': article_data.get('companies', []),
                'source': article_data.get('source', ''),
                'source_url': article_data.get('source_url', ''),
                'sentiment_numeric': sentiment,
                'sentiment_result': article_data.get('sentiment_result', {}),
                'sentiment_sublabel': article_data.get('sentiment_sublabel', ''),
                'timestamp': article_data.get('timestamp', 0)
            })

        total_count = len(all_articles)
        start_index = offset
        end_index = start_index + limit
        paginated_articles = all_articles[start_index:end_index]

        total_pages = (total_count + limit - 1) // limit

        return {
            "articles": paginated_articles,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve news articles")

@router.get("/news/latest/{limit}")
async def get_latest_news(limit: int = 20):
    try:
        limit = min(max(limit, 1), 50)

        news_ref = db.collection('news_datastore').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
        docs = news_ref.stream()

        articles = []
        for doc in docs:
            article_data = doc.to_dict()
            articles.append({
                'id': article_data.get('id', ''),
                'title': article_data.get('title', ''),
                'description': article_data.get('description', ''),
                'domain': article_data.get('domain', ''),
                'companies': article_data.get('companies', []),
                'source': article_data.get('source', ''),
                'source_url': article_data.get('source_url', ''),
                'sentiment_numeric': article_data.get('sentiment_numeric', 0),
                'sentiment_result': article_data.get('sentiment_result', {}),
                'sentiment_sublabel': article_data.get('sentiment_sublabel', ''),
                'timestamp': article_data.get('timestamp', 0)
            })

        return {"articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve latest news articles")

@router.get("/analytics/sentiment")
async def get_sentiment_analytics(days: int = 30, domain: str = None):
    try:
        import time
        current_time = int(time.time() * 1000)
        days_ago = current_time - (days * 24 * 60 * 60 * 1000)

        query = db.collection('news_datastore').where('timestamp', '>=', days_ago)

        if domain and domain != 'all':
            query = query.where('domain', '==', domain)

        docs = query.order_by('timestamp', direction=firestore.Query.DESCENDING).stream()

        from collections import defaultdict
        daily_sentiment = defaultdict(list)

        for doc in docs:
            article_data = doc.to_dict()
            timestamp = article_data.get('timestamp', 0)
            sentiment = article_data.get('sentiment_numeric', 0)

            import datetime
            date = datetime.datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d')
            daily_sentiment[date].append(sentiment)

        analytics_data = []
        for date, sentiments in sorted(daily_sentiment.items()):
            avg_sentiment = sum(sentiments) / len(sentiments)
            analytics_data.append({
                'date': date,
                'sentiment': round(avg_sentiment, 3),
                'article_count': len(sentiments)
            })

        return {"analytics": analytics_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve sentiment analytics")
