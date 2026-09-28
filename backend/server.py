from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Header, Cookie
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


PROGRAMS = [
    "Ingeniería Ambiental",
    "Ingeniería Biomédica",
    "Ingeniería de Datos e Inteligencia Artificial",
    "Ingeniería Eléctrica",
    "Ingeniería Industrial",
    "Ingeniería Informática",
    "Ingeniería Mecánica",
    "Ingeniería Mecatrónica",
]

USER_FIELDS = ["user_id", "email", "name", "picture", "custom_username", "program"]


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    custom_username: Optional[str] = None
    program: Optional[str] = None


class UsernameUpdate(BaseModel):
    custom_username: str
    program: Optional[str] = None


# ---------- Auth helpers ----------
async def _get_session_user(session_token: Optional[str]) -> Optional[dict]:
    if not session_token:
        return None
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


async def get_current_user(
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> dict:
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    user = await _get_session_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


# ---------- Status routes ----------
@api_router.get("/")
async def root():
    return {"message": "UAO Conecta API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    rows = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for r in rows:
        if isinstance(r.get('timestamp'), str):
            r['timestamp'] = datetime.fromisoformat(r['timestamp'])
    return rows


# ---------- Auth routes (Emergent-managed Google Auth) ----------
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()

    email = data.get("email")
    name = data.get("name", "")
    picture = data.get("picture")
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=502, detail="Malformed session response")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name or existing.get("name"), "picture": picture or existing.get("picture")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "custom_username": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60,
    )

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user}


@api_router.get("/programs")
async def list_programs():
    return {"programs": PROGRAMS}


@api_router.get("/auth/me", response_model=User)
async def auth_me(current: dict = None, session_token: Optional[str] = Cookie(default=None),
                  authorization: Optional[str] = Header(default=None)):
    user = await get_current_user(session_token=session_token, authorization=authorization)
    return User(**{k: user.get(k) for k in USER_FIELDS})


@api_router.post("/auth/username", response_model=User)
async def update_username(payload: UsernameUpdate,
                          session_token: Optional[str] = Cookie(default=None),
                          authorization: Optional[str] = Header(default=None)):
    user = await get_current_user(session_token=session_token, authorization=authorization)
    username = payload.custom_username.strip()
    if len(username) < 2 or len(username) > 24:
        raise HTTPException(status_code=400, detail="El nombre debe tener entre 2 y 24 caracteres")
    # simple uniqueness check
    existing = await db.users.find_one({"custom_username": username, "user_id": {"$ne": user["user_id"]}}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Ese nombre ya está en uso")
    updates = {"custom_username": username}
    if payload.program is not None:
        if payload.program not in PROGRAMS:
            raise HTTPException(status_code=400, detail="Programa de ingeniería no válido")
        updates["program"] = payload.program
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return User(**{k: updated.get(k) for k in USER_FIELDS})


@api_router.post("/auth/logout")
async def logout(response: Response,
                 session_token: Optional[str] = Cookie(default=None),
                 authorization: Optional[str] = Header(default=None)):
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
