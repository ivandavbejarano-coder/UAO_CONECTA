# Auth Testing Playbook (Emergent Google Auth)

Save this file for the testing agent to reference when validating auth-gated flows.

## Step 1: Create Test User & Session in Mongo
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  custom_username: 'testuser',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Verify backend endpoints
```bash
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s -X GET "$API/api/auth/me" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser test
Set a cookie named `session_token` for the app domain (path=/, httpOnly, secure, sameSite=None), then navigate to the app root - it should load the authenticated shell without redirecting to /login.

## Checklist
- Users have `user_id` (custom UUID); MongoDB `_id` is excluded via projection {"_id": 0}
- Sessions link `user_id` to `session_token` with a timezone-aware `expires_at`
- `/api/auth/me` returns user data (cookie OR Authorization: Bearer)
- Callback detection uses `useLocation().hash`, NOT `window.location.hash`
- After first login, user is prompted to choose a `custom_username`
- Logout clears the cookie and Mongo session

## Success indicators
- ✅ GET /api/auth/me returns user JSON
- ✅ App shell loads without redirect to /login
- ✅ Setting custom_username persists across reload
