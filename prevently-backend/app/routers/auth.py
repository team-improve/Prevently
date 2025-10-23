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
        print(f"Error getting email from username: {e}")
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
        print(f"Error saving username mapping: {e}")
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
    print(f"Login - emailVerified in response: {user_data.get('emailVerified', 'NOT_PRESENT')}")  # Debug log
    
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
                print(f"Lookup - emailVerified: {user_info.get('emailVerified', 'NOT_PRESENT')}")  # Debug log
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
