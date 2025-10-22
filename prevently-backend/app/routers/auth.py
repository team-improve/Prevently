from fastapi import APIRouter, HTTPException
import requests
from pydantic import BaseModel
from app.config import Config

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ResetPasswordRequest(BaseModel):
    email: str

@router.post("/register")
async def register_user(request: RegisterRequest):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={Config.FIREBASE_API_KEY}"
    payload = {
        "email": request.email,
        "password": request.password,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()

@router.post("/login")
async def login_user(request: LoginRequest):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={Config.FIREBASE_API_KEY}"
    payload = {
        "email": request.email,
        "password": request.password,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()

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

