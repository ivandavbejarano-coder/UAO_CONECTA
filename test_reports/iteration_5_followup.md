# Seguimiento de iteración 5 — 2026-09-28

Se conserva el reporte original del testing agent; este archivo registra las comprobaciones posteriores del agente principal.

## Correcciones
- `/api/courses/join` ahora admite enlace completo http/https con `?join=`, además del código. Se analiza localmente, sin descargar URLs.
- Regresión `test_join_by_full_url_at_api_level` cambiada para exigir 200 y asignatura correcta (antes documentaba el 404).
- `tests/test_auth_api.py` eliminado fallback de URL; usa únicamente `frontend/.env`.

## Verificación
- `pytest -q tests/test_academic_api.py tests/test_auth_api.py`: **25 passed**.
- Selección real de chat desde `/chats` sin parámetros: 6 clics/cambios de conversación escritorio y 3 móvil. Todos actualizan URL, botón activo y muestran compositor. Sin fallo de interacción; seleccionar `button[data-testid^="chat-room-"]` evita el contenedor que comparte prefijo.
- Sin overflow horizontal en comprobación móvil 390px.
- Pruebas anteriores de IA real, aislamiento de sesiones y chat bidireccional permanecen válidas; no se modificaron esos flujos tras el reporte.

No quedan incidencias abiertas de la iteración 5. No afirmar una prueba nueva de consentimiento Google: acceso autenticado probado con fixtures QA.