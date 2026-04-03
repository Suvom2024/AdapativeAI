import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from dotenv import load_dotenv
from urllib.parse import urlencode

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

SCOPES = ['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']

def get_google_flow():
    """Create and return Google OAuth flow"""
    print(f"DEBUG: get_google_flow using REDIRECT_URI={REDIRECT_URI}")
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI]
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    return flow

def get_authorization_url(role: str = None):
    """Get Google OAuth authorization URL"""
    print("DEBUG: get_authorization_url starting")
    flow = get_google_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    print(f"DEBUG: get_authorization_url returning state={state}")
    # Note: role is stored in sessions by the router, not in the URL
    return authorization_url, state

def get_user_info_from_callback(code: str):
    """Exchange authorization code for user info"""
    flow = get_google_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials
    
    # Get user info
    from google.oauth2 import id_token
    from google.auth.transport.requests import Request
    
    request = Request()
    id_info = id_token.verify_oauth2_token(
        credentials.id_token, request, GOOGLE_CLIENT_ID
    )
    
    return {
        "email": id_info.get("email"),
        "name": id_info.get("name"),
        "picture": id_info.get("picture")
    }

def get_user_role(email: str) -> str:
    """Default role when no role is specified at login"""
    return "student"

