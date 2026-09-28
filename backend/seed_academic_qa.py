"""Manual QA identities only. Never imported or executed during app startup."""
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(Path(__file__).parent / '.env')
db = MongoClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
for key, role in [('PROFESSOR', 'Profesor'), ('STUDENT', 'Estudiante'), ('MONITOR', 'Monitor'), ('NEW', None)]:
    user_id = 'TEST_academic_' + key.lower()
    user = {'user_id': user_id, 'email': f'{user_id}@example.com', 'name': f'QA {role or "Nuevo"}',
            'custom_username': f'qa_{key.lower()}' if role else None,
            'program': 'Ingeniería Informática' if role else None, 'role': role,
            'picture': None, 'created_at': datetime.now(timezone.utc).isoformat()}
    db.users.update_one({'user_id': user_id}, {'$set': user}, upsert=True)
    db.user_sessions.update_one({'session_token': os.environ[f'QA_{key}_TOKEN']}, {'$set': {
        'user_id': user_id, 'session_token': os.environ[f'QA_{key}_TOKEN'],
        'expires_at': (datetime.now(timezone.utc)+timedelta(days=7)).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat()}}, upsert=True)
    print(user_id, user['email'], role or 'Onboarding pendiente')