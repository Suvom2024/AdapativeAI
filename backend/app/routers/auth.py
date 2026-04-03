from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Session as SessionModel
from app.auth import get_authorization_url, get_user_info_from_callback, get_user_role
from pydantic import BaseModel
from typing import Optional
import secrets
import os
from datetime import datetime, timedelta

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str

    class Config:
        from_attributes = True

def get_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """Get current user from Bearer token header or session cookie"""
    session_id = None

    # Prefer Authorization: Bearer <token> header (works cross-origin)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        session_id = auth_header[len("Bearer "):]
    else:
        session_id = request.cookies.get("session_id")

    if not session_id:
        return None

    session = db.query(SessionModel).filter(
        SessionModel.session_id == session_id,
        SessionModel.expires_at > datetime.utcnow()
    ).first()

    if not session:
        return None

    return db.query(User).filter(User.id == session.user_id).first()

# Temporary storage for OAuth state (cleared after use)
_oauth_states = {}

@router.get("/auth/google")
async def google_login(role: Optional[str] = None):
    """Initiate Google OAuth login"""
    print(f"DEBUG: google_login called with role={role}")
    try:
        # Store role in state for later retrieval
        authorization_url, state = get_authorization_url(role=role)
        print(f"DEBUG: authorization_url generated: {authorization_url}")
        # Store state and role mapping temporarily
        if role:
            _oauth_states[f"role_{state}"] = role
        return RedirectResponse(url=authorization_url)
    except Exception as e:
        print(f"ERROR in google_login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/callback")
async def google_callback(code: str, state: Optional[str] = None, request: Request = None, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    print(f"DEBUG: google_callback called with code={code[:10]}... and state={state}")
    try:
        user_info = get_user_info_from_callback(code)
        print(f"DEBUG: user_info retrieved: {user_info}")
        email = user_info["email"]
        name = user_info["name"]
        
        # Get role from state if available, otherwise use default logic
        requested_role = None
        if state and f"role_{state}" in _oauth_states:
            requested_role = _oauth_states[f"role_{state}"]
            # Clean up the temporary role storage
            del _oauth_states[f"role_{state}"]
        
        # Role comes from whichever login page the user chose (teacher or student)
        role = requested_role if requested_role else "student"

        # Get or create user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, name=name, role=role)
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Always update name and role to match the login page they used
            user.name = name
            user.role = role
            db.commit()
        
        # Create session in database
        session_id = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)  # 7 days expiration
        
        # Delete old sessions for this user (optional - keep only one active session)
        db.query(SessionModel).filter(SessionModel.user_id == user.id).delete()
        
        # Create new session
        db_session = SessionModel(
            session_id=session_id,
            user_id=user.id,
            expires_at=expires_at
        )
        db.add(db_session)
        db.commit()
        
        # Redirect to frontend auth callback with token in URL (avoids cross-origin cookie issues)
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip('/')
        redirect_url = f"{frontend_url}/auth/callback?token={session_id}"
        print(f"DEBUG: Redirecting user to: {redirect_url}")
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

@router.get("/auth/me")
async def get_current_user_info(user: User = Depends(get_current_user)):
    """Get current user information"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserResponse(id=user.id, email=user.email, name=user.name, role=user.role)

@router.post("/auth/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    """Logout user"""
    session_id = request.cookies.get("session_id")
    if session_id:
        # Delete session from database
        db.query(SessionModel).filter(SessionModel.session_id == session_id).delete()
        db.commit()
    
    response = {"message": "Logged out successfully"}
    return response

