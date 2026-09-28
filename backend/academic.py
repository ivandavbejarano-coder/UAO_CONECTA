"""Shared academic spaces. Every operation checks current membership server-side."""
import secrets
import uuid
from urllib.parse import urlsplit, parse_qs
from datetime import datetime, timezone
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator


def now():
    return datetime.now(timezone.utc).isoformat()


def uid():
    return uuid.uuid4().hex


class TextInput(BaseModel):
    text: str = Field(min_length=1, max_length=4000)

    @field_validator('text')
    @classmethod
    def not_blank(cls, value):
        if not value.strip():
            raise ValueError('Escribe un mensaje')
        return value.strip()


class CourseInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    code: str = Field(min_length=2, max_length=30)
    description: str = Field(default='', max_length=1000)

    @field_validator('name', 'code')
    @classmethod
    def clean(cls, value):
        if len(value.strip()) < 2:
            raise ValueError('Escribe al menos 2 caracteres')
        return value.strip()


class Course(CourseInput):
    id: str
    owner_id: str
    member_ids: list[str]
    invite_code: str
    created_at: str


class JoinInput(BaseModel):
    code: str = Field(min_length=1, max_length=500)


class Member(BaseModel):
    user_id: str
    name: str
    custom_username: Optional[str] = None
    role: Optional[str] = None
    program: Optional[str] = None


class TaskInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    responsible: str = Field(default='', max_length=80)
    due: Optional[datetime] = None

    @field_validator('name')
    @classmethod
    def clean(cls, value):
        if not value.strip():
            raise ValueError('Escribe el título de la tarea')
        return value.strip()


class Task(TaskInput):
    id: str
    course_id: str
    creator_id: str
    created_at: str
    status: Literal['Pendiente', 'En progreso', 'Completada']


class TaskStatus(BaseModel):
    status: Literal['Pendiente', 'En progreso', 'Completada']


class Room(BaseModel):
    id: str
    kind: Literal['course', 'direct']
    name: str
    course_id: Optional[str] = None
    participants: list[str] = Field(default_factory=list)
    created_at: str


class DirectInput(BaseModel):
    user_id: str


class Message(TextInput):
    id: str
    room_id: str
    sender_id: str
    sender_name: str
    role: str
    created_at: str


class Event(BaseModel):
    id: str
    user_id: str
    text: str
    path: str
    created_at: str
    read: bool = False


class Agreement(TextInput):
    id: str
    course_id: str
    author: str
    created_at: str


class SlotInput(BaseModel):
    starts_at: datetime

    @field_validator('starts_at')
    @classmethod
    def future(cls, value):
        if value.tzinfo is None or value <= datetime.now(timezone.utc):
            raise ValueError('Elige una fecha futura con zona horaria')
        return value


class Slot(BaseModel):
    id: str
    course_id: str
    starts_at: str
    available_ids: list[str]
    created_at: str


def build_academic_router(db, auth):
    router = APIRouter(prefix='/api')

    async def course_for(course_id, user):
        course = await db.courses.find_one({'id': course_id, 'member_ids': user['user_id']}, {'_id': 0})
        if not course:
            raise HTTPException(403, 'No perteneces a esta asignatura')
        return course

    def owner_only(course, user):
        if user.get('role') != 'Profesor' or course['owner_id'] != user['user_id']:
            raise HTTPException(403, 'Solo el profesor responsable puede gestionar esta asignatura')

    async def notify(user_ids, text, path, actor=None):
        docs = [Event(id=uid(), user_id=u, text=text, path=path, created_at=now()).model_dump()
                for u in set(user_ids) if u != actor]
        if docs:
            await db.academic_events.insert_many(docs)

    @router.get('/courses', response_model=list[Course])
    async def courses(user=Depends(auth)):
        return await db.courses.find({'member_ids': user['user_id']}, {'_id': 0}).sort('created_at', -1).to_list(500)

    @router.post('/courses', response_model=Course)
    async def create_course(payload: CourseInput, user=Depends(auth)):
        if user.get('role') != 'Profesor':
            raise HTTPException(403, 'Solo los profesores pueden crear asignaturas; únete con un código')
        course = Course(**payload.model_dump(), id=uid(), owner_id=user['user_id'], member_ids=[user['user_id']],
                        invite_code=secrets.token_hex(5).upper(), created_at=now())
        await db.courses.insert_one(course.model_dump())
        await db.chat_rooms.insert_one(Room(id=course.id, kind='course', name=course.name, course_id=course.id, created_at=now()).model_dump())
        await notify([user['user_id']], f'Creaste {course.name}', f'/asignaturas/{course.id}')
        return course

    @router.post('/courses/join', response_model=Course)
    async def join_course(payload: JoinInput, user=Depends(auth)):
        if not user.get('role'):
            raise HTTPException(403, 'Completa tu perfil académico primero')
        code = payload.code.strip()
        if '://' in code:
            try:
                parsed = urlsplit(code)
                if parsed.scheme not in ['http', 'https'] or not parsed.netloc:
                    raise ValueError('Invalid invite URL')
                code = parse_qs(parsed.query).get('join', [''])[0]
            except ValueError:
                raise HTTPException(400, 'Enlace de invitación no válido')
        code = code.strip().upper()
        course = await db.courses.find_one({'invite_code': code}, {'_id': 0})
        if not course:
            raise HTTPException(404, 'Código de asignatura no válido')
        result = await db.courses.update_one({'id': course['id']}, {'$addToSet': {'member_ids': user['user_id']}})
        if result.modified_count:
            await notify([course['owner_id']], f"{user.get('custom_username') or user['name']} se unió a {course['name']}", f"/asignaturas/{course['id']}")
            await notify([user['user_id']], f"Te uniste a {course['name']}", f"/asignaturas/{course['id']}")
        return await db.courses.find_one({'id': course['id']}, {'_id': 0})

    @router.get('/courses/{course_id}', response_model=Course)
    async def get_course(course_id: str, user=Depends(auth)):
        return await course_for(course_id, user)

    @router.patch('/courses/{course_id}', response_model=Course)
    async def edit_course(course_id: str, payload: CourseInput, user=Depends(auth)):
        course = await course_for(course_id, user)
        owner_only(course, user)
        await db.courses.update_one({'id': course_id}, {'$set': payload.model_dump()})
        await db.chat_rooms.update_one({'id': course_id}, {'$set': {'name': payload.name}})
        return await db.courses.find_one({'id': course_id}, {'_id': 0})

    @router.post('/courses/{course_id}/invite', response_model=Course)
    async def rotate_invite(course_id: str, user=Depends(auth)):
        course = await course_for(course_id, user)
        owner_only(course, user)
        await db.courses.update_one({'id': course_id}, {'$set': {'invite_code': secrets.token_hex(5).upper()}})
        return await db.courses.find_one({'id': course_id}, {'_id': 0})

    @router.get('/courses/{course_id}/members', response_model=list[Member])
    async def members(course_id: str, user=Depends(auth)):
        course = await course_for(course_id, user)
        return await db.users.find({'user_id': {'$in': course['member_ids']}}, {'_id': 0, 'email': 0}).to_list(1000)

    @router.delete('/courses/{course_id}/members/{member_id}')
    async def remove_member(course_id: str, member_id: str, user=Depends(auth)):
        course = await course_for(course_id, user)
        if member_id == course['owner_id']:
            raise HTTPException(400, 'El profesor responsable debe permanecer en la asignatura')
        if member_id != user['user_id']:
            owner_only(course, user)
        await db.courses.update_one({'id': course_id}, {'$pull': {'member_ids': member_id}})
        return {'ok': True}

    @router.get('/courses/{course_id}/tasks', response_model=list[Task])
    async def tasks(course_id: str, user=Depends(auth)):
        await course_for(course_id, user)
        return await db.course_tasks.find({'course_id': course_id}, {'_id': 0}).sort('created_at', -1).to_list(1000)

    @router.post('/courses/{course_id}/tasks', response_model=Task)
    async def create_task(course_id: str, payload: TaskInput, user=Depends(auth)):
        course = await course_for(course_id, user)
        task = Task(**payload.model_dump(), id=uid(), course_id=course_id, creator_id=user['user_id'], created_at=now(), status='Pendiente')
        await db.course_tasks.insert_one(task.model_dump(mode='json'))
        await notify(course['member_ids'], f"Nueva tarea: {task.name}", f'/grupo?course={course_id}')
        return task

    @router.patch('/courses/{course_id}/tasks/{task_id}', response_model=Task)
    async def task_status(course_id: str, task_id: str, payload: TaskStatus, user=Depends(auth)):
        course = await course_for(course_id, user)
        result = await db.course_tasks.update_one({'id': task_id, 'course_id': course_id}, {'$set': {'status': payload.status}})
        if not result.matched_count:
            raise HTTPException(404, 'Tarea no encontrada')
        task = await db.course_tasks.find_one({'id': task_id, 'course_id': course_id}, {'_id': 0})
        await notify(course['member_ids'], f"{task['name']}: {payload.status}", f'/grupo?course={course_id}')
        return task

    @router.delete('/courses/{course_id}/tasks/{task_id}')
    async def delete_task(course_id: str, task_id: str, user=Depends(auth)):
        course = await course_for(course_id, user)
        owner_only(course, user)
        await db.course_tasks.delete_one({'id': task_id, 'course_id': course_id})
        return {'ok': True}

    @router.get('/courses/{course_id}/agreements', response_model=list[Agreement])
    async def agreements(course_id: str, user=Depends(auth)):
        await course_for(course_id, user)
        return await db.course_agreements.find({'course_id': course_id}, {'_id': 0}).sort('created_at', -1).to_list(500)

    @router.post('/courses/{course_id}/agreements', response_model=Agreement)
    async def add_agreement(course_id: str, payload: TextInput, user=Depends(auth)):
        course = await course_for(course_id, user)
        if user.get('role') not in ['Profesor', 'Monitor']:
            raise HTTPException(403, 'Solo profesores y monitores pueden publicar acuerdos de apoyo')
        item = Agreement(**payload.model_dump(), id=uid(), course_id=course_id, author=user.get('custom_username') or user['name'], created_at=now())
        await db.course_agreements.insert_one(item.model_dump())
        await notify(course['member_ids'], f"Nuevo acuerdo en {course['name']}", f'/grupo?course={course_id}')
        return item

    async def room_for(room_id, user):
        room = await db.chat_rooms.find_one({'id': room_id}, {'_id': 0})
        if not room:
            raise HTTPException(404, 'Conversación no encontrada')
        if room['kind'] == 'course':
            await course_for(room['course_id'], user)
        else:
            if user['user_id'] not in room['participants']:
                raise HTTPException(403, 'Conversación privada')
            shared = await db.courses.find_one({'member_ids': {'$all': room['participants']}}, {'_id': 0, 'id': 1})
            if not shared:
                raise HTTPException(403, 'Ya no comparten una asignatura')
        return room

    @router.get('/chats', response_model=list[Room])
    async def rooms(user=Depends(auth)):
        courses = await db.courses.find({'member_ids': user['user_id']}, {'_id': 0, 'id': 1}).to_list(500)
        rows = await db.chat_rooms.find({'$or': [{'course_id': {'$in': [c['id'] for c in courses]}}, {'participants': user['user_id']}]}, {'_id': 0}).sort('created_at', -1).to_list(1000)
        allowed = []
        for room in rows:
            try:
                await room_for(room['id'], user)
                if room['kind'] == 'direct':
                    other = next(p for p in room['participants'] if p != user['user_id'])
                    person = await db.users.find_one({'user_id': other}, {'_id': 0, 'name': 1, 'custom_username': 1})
                    room['name'] = (person.get('custom_username') or person['name']) if person else 'Usuario'
                allowed.append(room)
            except HTTPException:
                continue
        return allowed

    @router.post('/chats/direct', response_model=Room)
    async def direct(payload: DirectInput, user=Depends(auth)):
        ids = sorted([user['user_id'], payload.user_id])
        if len(set(ids)) != 2:
            raise HTTPException(400, 'Selecciona a otra persona')
        shared = await db.courses.find_one({'member_ids': {'$all': ids}}, {'_id': 0, 'id': 1})
        person = await db.users.find_one({'user_id': payload.user_id}, {'_id': 0})
        if not shared or not person:
            raise HTTPException(403, 'Solo puedes contactar a personas de tus asignaturas')
        room = Room(id=uuid.uuid5(uuid.NAMESPACE_OID, '|'.join(ids)).hex, kind='direct', name=person.get('custom_username') or person['name'], participants=ids, created_at=now())
        await db.chat_rooms.update_one({'id': room.id}, {'$setOnInsert': room.model_dump()}, upsert=True)
        return room

    @router.get('/chats/{room_id}/messages', response_model=list[Message])
    async def messages(room_id: str, before: Optional[str] = Query(default=None, max_length=60), user=Depends(auth)):
        await room_for(room_id, user)
        query = {'room_id': room_id}
        if before:
            query['created_at'] = {'$lt': before}
        rows = await db.chat_messages.find(query, {'_id': 0}).sort('created_at', -1).to_list(50)
        return list(reversed(rows))

    @router.post('/chats/{room_id}/messages', response_model=Message)
    async def send_message(room_id: str, payload: TextInput, user=Depends(auth)):
        room = await room_for(room_id, user)
        message = Message(**payload.model_dump(), id=uid(), room_id=room_id, sender_id=user['user_id'], sender_name=user.get('custom_username') or user['name'], role=user.get('role') or 'Estudiante', created_at=now())
        await db.chat_messages.insert_one(message.model_dump())
        recipients = room['participants']
        if room['kind'] == 'course':
            recipients = (await course_for(room['course_id'], user))['member_ids']
        await notify(recipients, f"{message.sender_name}: {message.text[:100]}", f'/chats?room={room_id}', user['user_id'])
        return message

    @router.get('/events', response_model=list[Event])
    async def events(user=Depends(auth)):
        return await db.academic_events.find({'user_id': user['user_id']}, {'_id': 0}).sort('created_at', -1).to_list(300)

    @router.post('/events/read')
    async def read_events(user=Depends(auth)):
        await db.academic_events.update_many({'user_id': user['user_id']}, {'$set': {'read': True}})
        return {'ok': True}

    @router.post('/events/{event_id}/read')
    async def read_event(event_id: str, user=Depends(auth)):
        await db.academic_events.update_one({'id': event_id, 'user_id': user['user_id']}, {'$set': {'read': True}})
        return {'ok': True}

    @router.get('/courses/{course_id}/schedule', response_model=list[Slot])
    async def schedule(course_id: str, user=Depends(auth)):
        course = await course_for(course_id, user)
        rows = await db.course_slots.find({'course_id': course_id}, {'_id': 0}).sort('starts_at', 1).to_list(500)
        for row in rows:
            row['available_ids'] = [i for i in row['available_ids'] if i in course['member_ids']]
        return rows

    @router.post('/courses/{course_id}/schedule', response_model=Slot)
    async def add_slot(course_id: str, payload: SlotInput, user=Depends(auth)):
        course = await course_for(course_id, user)
        item = Slot(id=uid(), course_id=course_id, starts_at=payload.starts_at.astimezone(timezone.utc).isoformat(), available_ids=[user['user_id']], created_at=now())
        await db.course_slots.insert_one(item.model_dump())
        await notify(course['member_ids'], f"Nuevo horario propuesto en {course['name']}", f'/grupo/horarios?course={course_id}')
        return item

    @router.post('/courses/{course_id}/schedule/{slot_id}', response_model=Slot)
    async def toggle_slot(course_id: str, slot_id: str, user=Depends(auth)):
        await course_for(course_id, user)
        item = await db.course_slots.find_one({'course_id': course_id, 'id': slot_id}, {'_id': 0})
        if not item:
            raise HTTPException(404, 'Horario no encontrado')
        op = '$pull' if user['user_id'] in item['available_ids'] else '$addToSet'
        await db.course_slots.update_one({'id': slot_id}, {op: {'available_ids': user['user_id']}})
        return await db.course_slots.find_one({'id': slot_id}, {'_id': 0})

    return router