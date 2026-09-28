"""Backend API regression for academic expansion: auth roles, courses, chats, schedules, agreements."""
import os
import subprocess
from datetime import datetime, timedelta, timezone

import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path


load_dotenv(Path("/app/frontend/.env"))
load_dotenv(Path("/app/backend/.env"))

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is required")
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

QA_PROF = os.environ.get("QA_PROFESSOR_TOKEN")
QA_STUDENT = os.environ.get("QA_STUDENT_TOKEN")
QA_MONITOR = os.environ.get("QA_MONITOR_TOKEN")
QA_NEW = os.environ.get("QA_NEW_TOKEN")


def _hdr(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def qa_tokens():
    required = [QA_PROF, QA_STUDENT, QA_MONITOR, QA_NEW]
    if not all(required):
        pytest.skip("Missing one or more QA_*_TOKEN values in backend/.env")
    return {
        "prof": QA_PROF,
        "student": QA_STUDENT,
        "monitor": QA_MONITOR,
        "new": QA_NEW,
    }


@pytest.fixture(scope="module", autouse=True)
def reseed_qa_fixtures_once(qa_tokens):
    """Reset QA identities to baseline so onboarding/role tests remain deterministic."""
    subprocess.run(["python", "/app/backend/seed_academic_qa.py"], check=True)


@pytest.fixture(scope="module")
def course_state():
    return {
        "id": None,
        "old_code": None,
        "new_code": None,
        "room_id": None,
        "student_user_id": None,
        "monitor_user_id": None,
        "created_message_id": None,
        "slot_id": None,
    }


# --- Auth roles and onboarding module ---
def test_auth_me_roles_and_onboarding_state(qa_tokens):
    prof = requests.get(f"{API}/auth/me", headers=_hdr(qa_tokens["prof"]))
    student = requests.get(f"{API}/auth/me", headers=_hdr(qa_tokens["student"]))
    monitor = requests.get(f"{API}/auth/me", headers=_hdr(qa_tokens["monitor"]))
    new = requests.get(f"{API}/auth/me", headers=_hdr(qa_tokens["new"]))

    assert prof.status_code == 200
    assert student.status_code == 200
    assert monitor.status_code == 200
    assert new.status_code == 200

    assert prof.json()["role"] == "Profesor"
    assert student.json()["role"] == "Estudiante"
    assert monitor.json()["role"] == "Monitor"
    assert new.json().get("role") is None


def test_invalid_role_rejected(qa_tokens):
    r = requests.post(
        f"{API}/auth/username",
        headers=_hdr(qa_tokens["new"]),
        json={
            "custom_username": "qa_new_role",
            "program": "Ingeniería Informática",
            "role": "Admin",
        },
    )
    assert r.status_code == 422


def test_role_set_then_immutable(qa_tokens):
    first = requests.post(
        f"{API}/auth/username",
        headers=_hdr(qa_tokens["new"]),
        json={
            "custom_username": "qa_new_role",
            "program": "Ingeniería Informática",
            "role": "Estudiante",
        },
    )
    assert first.status_code == 200, first.text
    assert first.json()["role"] == "Estudiante"

    second = requests.post(
        f"{API}/auth/username",
        headers=_hdr(qa_tokens["new"]),
        json={
            "custom_username": "qa_new_role",
            "program": "Ingeniería Informática",
            "role": "Profesor",
        },
    )
    assert second.status_code == 403


# --- Courses and membership permissions module ---
def test_professor_creates_course(qa_tokens, course_state):
    payload = {
        "name": f"QA Curso API {datetime.now(timezone.utc).strftime('%H%M%S')}",
        "code": f"QA-{datetime.now(timezone.utc).strftime('%H%M%S')}",
        "description": "Curso QA para regression backend",
    }
    r = requests.post(f"{API}/courses", headers=_hdr(qa_tokens["prof"]), json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    course_state["id"] = data["id"]
    course_state["old_code"] = data["invite_code"]
    assert data["owner_id"]
    assert data["invite_code"]
    assert data["name"] == payload["name"]


def test_student_cannot_create_course(qa_tokens):
    r = requests.post(
        f"{API}/courses",
        headers=_hdr(qa_tokens["student"]),
        json={"name": "Nope", "code": "NO", "description": ""},
    )
    assert r.status_code == 403


def test_professor_edits_own_course(qa_tokens, course_state):
    cid = course_state["id"]
    r = requests.patch(
        f"{API}/courses/{cid}",
        headers=_hdr(qa_tokens["prof"]),
        json={"name": "QA Curso API Editado", "code": "QA-EDIT", "description": "editado"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "QA Curso API Editado"


def test_student_joins_by_code_and_idempotent(qa_tokens, course_state):
    first = requests.post(
        f"{API}/courses/join",
        headers=_hdr(qa_tokens["student"]),
        json={"code": course_state["old_code"]},
    )
    second = requests.post(
        f"{API}/courses/join",
        headers=_hdr(qa_tokens["student"]),
        json={"code": course_state["old_code"]},
    )
    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    members = second.json()["member_ids"]
    assert len(members) == len(set(members))


def test_join_by_full_url_at_api_level(qa_tokens, course_state):
    full_url_code = f"{BASE_URL}/asignaturas?join={course_state['old_code']}"
    r = requests.post(
        f"{API}/courses/join",
        headers=_hdr(qa_tokens["monitor"]),
        json={"code": full_url_code},
    )
    assert r.status_code == 200, r.text
    assert r.json()['id'] == course_state['id']


def test_professor_rotate_code_invalidates_old(qa_tokens, course_state):
    cid = course_state["id"]
    rotated = requests.post(f"{API}/courses/{cid}/invite", headers=_hdr(qa_tokens["prof"]))
    assert rotated.status_code == 200, rotated.text
    course_state["new_code"] = rotated.json()["invite_code"]
    assert course_state["new_code"] != course_state["old_code"]

    old_try = requests.post(
        f"{API}/courses/join",
        headers=_hdr(qa_tokens["monitor"]),
        json={"code": course_state["old_code"]},
    )
    new_try = requests.post(
        f"{API}/courses/join",
        headers=_hdr(qa_tokens["monitor"]),
        json={"code": course_state["new_code"]},
    )
    assert old_try.status_code == 404
    assert new_try.status_code == 200


def test_member_directory_and_remove_permissions(qa_tokens, course_state):
    cid = course_state["id"]
    prof = requests.get(f"{API}/auth/me", headers=_hdr(qa_tokens["prof"])).json()
    student = requests.get(f"{API}/auth/me", headers=_hdr(qa_tokens["student"])).json()
    monitor = requests.get(f"{API}/auth/me", headers=_hdr(qa_tokens["monitor"])).json()
    course_state["student_user_id"] = student["user_id"]
    course_state["monitor_user_id"] = monitor["user_id"]

    members = requests.get(f"{API}/courses/{cid}/members", headers=_hdr(qa_tokens["prof"]))
    assert members.status_code == 200
    ids = {m["user_id"] for m in members.json()}
    assert prof["user_id"] in ids
    assert student["user_id"] in ids
    assert monitor["user_id"] in ids

    # student cannot remove another member
    cannot_remove = requests.delete(
        f"{API}/courses/{cid}/members/{monitor['user_id']}",
        headers=_hdr(qa_tokens["student"]),
    )
    assert cannot_remove.status_code == 403

    removed = requests.delete(
        f"{API}/courses/{cid}/members/{student['user_id']}",
        headers=_hdr(qa_tokens["prof"]),
    )
    assert removed.status_code == 200

    removed_access = requests.get(
        f"{API}/chats/{cid}/messages",
        headers=_hdr(qa_tokens["student"]),
    )
    assert removed_access.status_code == 403


# --- Chats and room access module ---
def test_chat_access_and_message_persistence(qa_tokens, course_state):
    cid = course_state["id"]
    # Rejoin removed student to validate shared chat.
    rejoin = requests.post(
        f"{API}/courses/join",
        headers=_hdr(qa_tokens["student"]),
        json={"code": course_state["new_code"]},
    )
    assert rejoin.status_code == 200

    room_list = requests.get(f"{API}/chats", headers=_hdr(qa_tokens["student"]))
    assert room_list.status_code == 200
    room_ids = {r["id"] for r in room_list.json()}
    assert cid in room_ids

    msg = requests.post(
        f"{API}/chats/{cid}/messages",
        headers=_hdr(qa_tokens["student"]),
        json={"text": "Mensaje QA integración"},
    )
    assert msg.status_code == 200, msg.text
    body = msg.json()
    course_state["created_message_id"] = body["id"]
    assert body["role"] == "Estudiante"
    assert isinstance(body["created_at"], str)

    got = requests.get(f"{API}/chats/{cid}/messages", headers=_hdr(qa_tokens["prof"]))
    assert got.status_code == 200
    ids = {m["id"] for m in got.json()}
    assert course_state["created_message_id"] in ids


def test_direct_chat_requires_shared_course(qa_tokens):
    outsider = requests.post(
        f"{API}/chats/direct",
        headers=_hdr(qa_tokens["student"]),
        json={"user_id": "non_existing_user"},
    )
    assert outsider.status_code == 403


# --- Group scheduling and agreements module ---
def test_schedule_and_agreements_role_rules(qa_tokens, course_state):
    cid = course_state["id"]
    future = (datetime.now(timezone.utc) + timedelta(days=2)).replace(microsecond=0).isoformat()
    slot = requests.post(
        f"{API}/courses/{cid}/schedule",
        headers=_hdr(qa_tokens["prof"]),
        json={"starts_at": future},
    )
    assert slot.status_code == 200, slot.text
    course_state["slot_id"] = slot.json()["id"]

    toggle = requests.post(
        f"{API}/courses/{cid}/schedule/{course_state['slot_id']}",
        headers=_hdr(qa_tokens["student"]),
    )
    assert toggle.status_code == 200
    assert isinstance(toggle.json().get("available_ids"), list)

    student_agreement = requests.post(
        f"{API}/courses/{cid}/agreements",
        headers=_hdr(qa_tokens["student"]),
        json={"text": "Soy estudiante y pruebo publicar"},
    )
    assert student_agreement.status_code == 403

    monitor_agreement = requests.post(
        f"{API}/courses/{cid}/agreements",
        headers=_hdr(qa_tokens["monitor"]),
        json={"text": "Acuerdo de monitor QA"},
    )
    assert monitor_agreement.status_code == 200


# --- Assistant privacy module ---
def test_assistant_session_is_private(qa_tokens):
    created = requests.post(
        f"{API}/assistant/sessions",
        headers=_hdr(qa_tokens["prof"]),
    )
    assert created.status_code == 200, created.text
    session_id = created.json()["id"]

    own_read = requests.get(
        f"{API}/assistant/sessions/{session_id}/messages",
        headers=_hdr(qa_tokens["prof"]),
    )
    assert own_read.status_code == 200
    assert isinstance(own_read.json(), list)

    other_read = requests.get(
        f"{API}/assistant/sessions/{session_id}/messages",
        headers=_hdr(qa_tokens["student"]),
    )
    assert other_read.status_code == 404
