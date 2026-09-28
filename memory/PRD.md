# UAO Conecta — PRD

## Problem statement (original)
Construir **UAO Conecta**, una SPA React + TypeScript funcional para estudiantes universitarios: encontrar información, coordinar trabajo grupal y saber a quién acudir. Módulos: Inicio, Dudas, Mi grupo, Rutas. Primera versión sin backend real (datos demo persistidos en localStorage).

## User personas
- **Estudiante universitario** (persona principal): busca respuestas, publica dudas, coordina grupo.
- **Monitor / Docente** (persona referenciada, no interactúa aún): perfila oferta de apoyo en Rutas.

## Core requirements (static)
1. 4 módulos principales con protagonismo: Inicio, Dudas, Mi grupo, Rutas.
2. Funciones secundarias: Perfil, Notificaciones, Guardados.
3. Búsqueda global agrupada (Dudas / Personas / Recursos / Grupos / Asignaturas) con filtros funcionales.
4. Publicación de dudas con opción anónima; respuestas; marcar solución.
5. Coordinación de grupo: tareas con cambios de estado, horarios comunes, archivos.
6. Rutas de apoyo: docentes, monitores, recursos.
7. Diseño mobile-first responsive; sidebar desktop + bottom-nav móvil.
8. Datos demo consistentes. NO afirmar validación oficial UAO.
9. Persistencia local (localStorage) para dudas, respuestas, guardados, tareas.
10. Autenticación con Google (Emergent-managed) + selección de nombre visible propio.

## Architecture
- **Frontend**: React 19 + TypeScript, CRA + CRACO, Tailwind disponible, CSS propio.
  - `src/App.tsx` — App monolítica: AuthProvider, Login, AuthCallback, Onboarding, Shell, Home (grouped search), Doubts, NewQuestion, QuestionDetail, Group, Schedules, Files, Routes, People, Resources, Profile, Notifications, Saved.
  - `src/auth.ts` — helpers fetch para `/api/auth/*` con `credentials: 'include'`.
  - `src/data.ts` — datos demo tipados: subjects, questions, answers, tasks, resources, notifications, people, groups.
  - `src/App.css` + `src/fixes.css` — estilos.
- **Backend**: FastAPI + MongoDB, endpoints bajo `/api`:
  - `POST /api/auth/session` — canjea `session_id` de Emergent OAuth, crea/actualiza user, guarda sesión en Mongo, setea cookie httpOnly `session_token`.
  - `GET /api/auth/me` — devuelve user desde cookie o `Authorization: Bearer`.
  - `POST /api/auth/username` — actualiza `custom_username` (2-24 chars, único).
  - `POST /api/auth/logout` — borra sesión Mongo y cookie.
- **MongoDB**: colecciones `users` (user_id, email, name, picture, custom_username, created_at), `user_sessions` (user_id, session_token, expires_at, created_at).

## What's been implemented (2026-02)
- 4 módulos principales + 3 secundarios, todas las rutas solicitadas.
- Dudas: publicación, anónimo, respuestas, marcar solución (cambia estado a Resuelta), guardar.
- Mi grupo: tareas con ciclo Pendiente→En proceso→Completada, horarios comunes con selección, archivos con acciones.
- Rutas: docentes, monitores, recursos con filtros por asignatura y tipo.
- Perfil: muestra user, editar nombre visible.
- Notificaciones, Guardados (persistidos), Búsqueda global agrupada con filtros (asignatura, tipo, estado, orden, limpiar).
- Persistencia `localStorage` para todas las mutaciones locales.
- **Google Auth Emergent-managed** con onboarding para elegir `custom_username`.
- Backend con Mongo y cookies httpOnly.
- Responsive validado 390px y 1920px sin overflow.

## Test status
- Iteración 4: backend 100%, frontend 100%, sin bugs abiertos.
- test_credentials.md actualizado con snippet para crear session en Mongo.

## Backlog (prioridades)
- **P1** Migración real a Vite (usuario lo prefirió). Cambiar scripts, adaptar `process.env.REACT_APP_BACKEND_URL` → `import.meta.env.VITE_BACKEND_URL`, eliminar CRACO/react-scripts.
- **P1** Modularizar `App.tsx` en `pages/`, `components/`, `hooks/useLocalStorage.ts`, `layouts/`.
- **P2** Reemplazar acciones de archivos por object storage real (Emergent Object Storage).
- **P2** Persistencia server-side de dudas/tareas/guardados por usuario (hoy es localStorage por navegador).
- **P2** Notificaciones en tiempo real desde backend.

## Next tasks
1. Confirmar con usuario si desea migrar a Vite o mantener CRA.
2. Si se aprueba, dividir `App.tsx` monolítico.
3. Ampliar backend para sincronizar dudas/guardados por user_id.
