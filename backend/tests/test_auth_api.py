"""Backend tests for UAO Conecta auth endpoints."""
import os
import time
import uuid
import requests
import pytest
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or "https://uao-conecta.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

mongo = MongoClient(MONGO_URL)
db = mongo[DB_NAME]


def _seed_user(custom_username=None):
    uid = f"TEST_user_{uuid.uuid4().hex[:8]}"
    token = f"TEST_tok_{uuid.uuid4().hex}"
    db.users.insert_one({
        "user_id": uid,
        "email": f"TEST_{uid}@example.com",
        "name": "QA Tester",
        "picture": None,
        "custom_username": custom_username,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    db.user_sessions.insert_one({
        "user_id": uid,
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return uid, token


@pytest.fixture(scope="module")
def seeded():
    created = []
    def _make(custom_username=None):
        u, t = _seed_user(custom_username)
        created.append(u)
        return u, t
    yield _make
    for uid in created:
        db.users.delete_many({"user_id": uid})
        db.user_sessions.delete_many({"user_id": uid})


# ---------- /api/auth/me ----------
def test_me_requires_auth():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_with_bearer(seeded):
    uid, token = seeded()
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user_id"] == uid
    assert data["email"].startswith("TEST_")
    assert data["custom_username"] is None


def test_me_with_cookie(seeded):
    uid, token = seeded()
    r = requests.get(f"{API}/auth/me", cookies={"session_token": token})
    assert r.status_code == 200
    assert r.json()["user_id"] == uid


def test_me_invalid_token():
    r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer nope-nope"})
    assert r.status_code == 401


# ---------- /api/auth/username ----------
def test_username_too_short(seeded):
    _, token = seeded()
    r = requests.post(f"{API}/auth/username",
                      json={"custom_username": "a"},
                      headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 400


def test_username_too_long(seeded):
    _, token = seeded()
    r = requests.post(f"{API}/auth/username",
                      json={"custom_username": "x" * 25},
                      headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 400


def test_username_set_valid(seeded):
    uid, token = seeded()
    uname = f"TEST_qa_{uuid.uuid4().hex[:6]}"
    r = requests.post(f"{API}/auth/username",
                      json={"custom_username": uname},
                      headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    assert r.json()["custom_username"] == uname
    # verify persisted via /me
    me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["custom_username"] == uname


def test_username_uniqueness(seeded):
    _, t1 = seeded()
    _, t2 = seeded()
    uname = f"TEST_dup_{uuid.uuid4().hex[:6]}"
    r1 = requests.post(f"{API}/auth/username",
                       json={"custom_username": uname},
                       headers={"Authorization": f"Bearer {t1}"})
    assert r1.status_code == 200
    r2 = requests.post(f"{API}/auth/username",
                       json={"custom_username": uname},
                       headers={"Authorization": f"Bearer {t2}"})
    assert r2.status_code == 409


def test_username_requires_auth():
    r = requests.post(f"{API}/auth/username", json={"custom_username": "someone"})
    assert r.status_code == 401


# ---------- /api/auth/logout ----------
def test_logout_invalidates_session(seeded):
    _, token = seeded()
    # confirm session works
    assert requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    r = requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    # now /me should 401
    r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 401


# ---------- API root ----------
def test_api_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert "UAO" in r.json().get("message", "")
