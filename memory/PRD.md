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
11. Selección de programa de ingeniería (8 programas UAO) en onboarding y editable en Perfil; se muestra en sidebar.

## Architecture
- **Frontend**: React 19 + TypeScript, CRA + CRACO, Tailwind disponible, CSS propio.
  - `src/App.tsx` — AuthProvider, Login, AuthCallback, Onboarding, Shell, Home (grouped search), Rutas y Perfil; conserva funciones antiguas sin enrutar (limpieza pendiente).
  - `src/academic/` — nuevas páginas modulares: CoursesPage/CourseDetail, ChatsPage, AssistantPage, GroupPage/SchedulesPage, DoubtsPages, FilesPage/ResourcesPage/SavedPage, SupportPeoplePage y ActivityPage. Contexto compartido de cursos/eventos, hook local por usuario y utilidades de Colombia.
  - `src/auth.ts` — helpers fetch para `/api/auth/*` con `credentials: 'include'`.
  - `src/data.ts` — datos demo tipados: subjects, questions, answers, tasks, resources, notifications, people, groups.
  - `src/App.css` + `src/fixes.css` — estilos.
- **Backend**: FastAPI + MongoDB, endpoints bajo `/api`:
  - `POST /api/auth/session` — canjea `session_id` de Emergent OAuth, crea/actualiza user, guarda sesión en Mongo, setea cookie httpOnly `session_token`.
  - `GET /api/auth/me` — devuelve user desde cookie o `Authorization: Bearer`.
  - `POST /api/auth/username` — actualiza `custom_username` (2-24 chars, único) y opcionalmente `program` (validado contra lista `PROGRAMS`).
  - `GET /api/programs` — lista de los 8 programas de ingeniería.
  - `POST /api/auth/logout` — borra sesión Mongo y cookie.
- **MongoDB**: colecciones `users` (user_id, email, name, picture, custom_username, program, created_at), `user_sessions` (user_id, session_token, expires_at, created_at).
  - Ampliadas: `users.role`, `courses`, `course_tasks`, `course_slots`, `course_agreements`, `chat_rooms`, `chat_messages`, `academic_events`, `ai_sessions`, `ai_messages`.
  - `backend/academic.py`: rutas `/api/courses/*`, `/api/chats/*`, `/api/events/*` con autorización por pertenencia/propiedad y modelos de respuesta sin ObjectId.
  - `backend/assistant_api.py`: `/api/assistant/sessions` y mensajes privados con SSE, historial Mongo, lease contra turnos concurrentes y recuperación de errores.
  - OpenAI `gpt-5.4` mediante `emergentintegrations`; claves/modelo exclusivamente en backend/.env. Sin respuestas simuladas.

## What's been implemented (2026-06) — Programa de ingeniería
- Campo `program` en usuario; onboarding exige nombre + programa (se muestra si falta cualquiera de los dos).
- Perfil: "Editar perfil" permite cambiar nombre y programa; sidebar muestra el programa real (antes texto fijo).
- Lista `PROGRAMS` en `frontend/src/auth.ts` y `backend/server.py`.
- Verificado con curl + screenshots (desktop 1920 y móvil 390, sin overflow).
- Subida a GitHub: el usuario debe usar el botón "Save to GitHub" de Emergent hacia `ivandavbejarano-coder/UAO_CONECTA`.

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

## Actualización puntual (2026-09-28) — Título de página
- Solicitud: cambiar `<title>` en `frontend/public/index.html` a `UAO CONECTA` y eliminar el enlace “Made with Emergent”, sin modificar otras funciones.
- Título actualizado. El enlace ya estaba ausente del archivo; no se necesitó eliminar ningún `<a>` ni cambiar scripts.
- Verificación en preview con navegador: `document.title` igual a `UAO CONECTA`, cero enlaces “Made with Emergent”, aplicación visible en escritorio 1920×800 y móvil 390×844; sin desbordamiento horizontal móvil.
- El servidor ignoraba cambios en `public`; se solicitó recompilación para reflejar el título sin modificar configuración ni funciones.
- P0 de esta solicitud: ninguno pendiente. Backlog previo sin cambios; mejora opcional futura: favicon propio para identificar UAO Conecta en pestañas.

## Backlog (prioridades)
- **P0** Ningún fallo abierto del alcance implementado tras pruebas y seguimiento.
- **P1** Confirmación del usuario con sus cuentas Google reales, selección de rol y colaboración compartida. Las pruebas autenticadas usaron fixtures de sesión, no una nueva autorización Google interactiva.
- **P1** Persistencia compartida de dudas/respuestas/guardados/recursos (siguen locales por usuario/navegador; conservar migración de datos existentes).
- **P2** Retirar código de páginas antiguas no enrutadas de App.tsx y extraer Auth/Shell/Home/Profile a módulos propios; nuevas páginas ya modulares.
- **P2** Archivos binarios compartidos mediante object storage; actualmente se agregan enlaces locales, no se alojan archivos.
- **P2** Validación institucional de roles (hoy son autodeclarados) y sincronización push de mensajes/eventos; chat actual usa consultas cada 3 segundos.
- **P2** Vite solo si se solicita de nuevo. Decisión vigente: mantener CRA/CRACO.

## Next tasks
1. Validar flujos con dos cuentas reales (profesor crea/invita; estudiante se une/conversa).
2. Ampliar backend para sincronizar dudas/guardados/recursos por usuario si se aprueba.
3. Mejora sugerida: mostrar dudas pendientes en cada asignatura para facilitar apoyo de monitores.

## Ampliación académica (2026-09-28)
### Solicitud del usuario y decisiones
Actualizar la aplicación existente, sin reconstruir ni eliminar funciones. Mantener concepto “Encontrar. Coordinar. Saber a quién acudir.”, navegación, estilo académico claro/navy/gris/blanco/acento rojo, sidebar escritorio y navegación inferior móvil. No parecer Moodle, Teams, WhatsApp ni red social.
- Inicio: buscar Dudas, Personas, Recursos, Grupos, Asignaturas y filtros funcionales.
- Asignaturas: crear/agregar, unirse por código/enlace, mostrar propias.
- Dudas: creación/consulta/respuesta, solución, guardado, anonimato y fechas reales.
- Mi grupo: integrantes, horarios, tareas y archivos/acuerdos; título de tarea visible inmediatamente al escribir; estados pendiente/en progreso/completada.
- Chat interno por asignatura/usuario, entre estudiantes/monitores/profesores según permisos.
- Asistente IA navegable: chat diferenciado con pensando/cargando, historial, incertidumbre explícita y sin información UAO inventada. La solicitud inicial permitía simulación; luego el usuario eligió IA real.
- Rol de registro Estudiante/Monitor/Profesor; guardar, etiquetar y aplicar permisos. Perfil académico con usuario, rol, asignaturas y datos reales.
- Fechas de Colombia UTC-5 para nuevas publicaciones/mensajes/tareas/notificaciones, sin fechas demo fijas; conservar notificaciones, guardados, historial y estados de interacción.
- Responsive solicitado 320/375/768/1024/1440.
- Elecciones explícitas: **Mantener CRA/CRACO por ahora**; **conectar asignaturas y chats al backend para compartir entre usuarios reales**; **IA real OpenAI con clave universal Emergent**. No migrar a Vite.

### Implementado
- Google existente preservado. Onboarding ahora requiere username/programa/rol; los usuarios existentes sin rol lo completan. Rol autodeclarado y no modificable por perfil; programa/nombre siguen editables. Enlaces de invitación se conservan durante Google.
- Profesores crean/editan sus asignaturas; invitaciones por código y enlace completo tanto en frontend como backend; renovación invalida código anterior. Miembros pueden salir; profesor responsable retira integrantes. Perfil e Inicio muestran cursos reales y conteos.
- Chat compartido por asignatura y privado entre miembros de asignaturas comunes, mensajes persistidos con autor/rol/timestamp; permisos revisados también tras retirar miembros; paginación de mensajes antiguos y actualización cada 3 segundos.
- Tareas compartidas con título en vivo, responsable, entrega opcional Colombia, estados y eliminación por profesor responsable. Grupo local previo preservado.
- Propuestas de disponibilidad compartida, confirmación por integrante y conteo de horario común; agenda local separada. Monitores/profesores publican acuerdos de apoyo.
- Asistente OpenAI real con SSE, estado pensando, sesiones/historial privados, contexto de asignaturas/tareas autorizadas y manejo visible de errores. No inventa fuentes oficiales ni afirma ejecutar acciones.
- Dudas locales mejoradas: autor/rol/anonimato, respuesta actualiza estado/conteo, útil y solución, fechas ISO, guardados eliminables. Recursos propios por enlace con protocolos seguros; guardados integran recursos nuevos; fichas demo sin archivos reales explícitas.
- Búsqueda amplía a asignaturas/grupos/miembros reales y recursos propios; filtros accesibles sin texto y orden reciente corregido. Rutas mantienen docentes/monitores/recursos, ahora incluyen contactos reales de cursos y fichas demo claramente identificadas.
- Eventos backend y locales con notificaciones leídas persistentes, historial y actividad de Inicio. Menú móvil/Más permite entrar a todos los nuevos módulos.
- Compilación CRA/TypeScript conservada; nuevo código modular y estilos compatibles. README documenta estructura, dependencias, yarn install/start/build y Save to GitHub (sin afirmar subida).

### Verificación y límites
- `yarn tsc --noEmit` y `yarn build`: PASS sin advertencias. Backend compila.
- Pruebas principales en `test_reports/iteration_5.json`: backend 14/14; frontend flujos críticos, dos contextos de chat, IA real de varios turnos/persistencia, tareas/horarios/dudas/recursos/notificaciones/mobile.
- Seguimiento: corregido enlace completo en API y fallback de URL del test antiguo. Suite combinada: **25/25 PASS**.
- Selección de chat sin parámetros verificada por clics exactos en lista: seis selecciones escritorio y tres móvil PASS; el selector ambiguo del test incluía contenedores, no solo botones.
- Capturas 1920×800 y 390×844 sin overflow, con título de tarea largo; reporte de QA responsive. Detalles: `test_reports/iteration_5_followup.md`.
- No APIs nuevas simuladas. **LOCALES/SIMULADOS:** dudas/respuestas/guardados/enlaces/grupo local y personas/materiales demo. No sincronizados entre dispositivos. Cursos/chats/tareas/horarios/acuerdos/eventos/IA sí usan backend real.
- Roles no verificados por la UAO; no son certificaciones institucionales. Google externo se conserva pero necesita confirmación del usuario con su cuenta real.
