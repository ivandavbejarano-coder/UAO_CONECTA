# UAO Conecta

**Encontrar. Coordinar. Saber a quién acudir.**

Aplicación académica incremental: React 19 + TypeScript + CRA/CRACO, Tailwind CSS, Lucide React, FastAPI y MongoDB. Se mantiene CRA/CRACO por decisión explícita del usuario; no se migró a Vite.

## Estructura
```text
frontend/
  public/index.html          # Título UAO CONECTA
  src/App.tsx                # Acceso Google, navegación, Inicio, Perfil y Rutas
  src/academic/              # Asignaturas, chats, IA, tareas, agenda, dudas, recursos e historial
  src/auth.ts                # Cliente HTTP y perfiles
  src/data.ts                # Ejemplos locales tipados
backend/
  server.py                  # FastAPI, Google/sesiones y registro de rutas
  academic.py                # Asignaturas, miembros, chat, tareas, horarios, acuerdos y eventos
  assistant_api.py           # OpenAI con streaming e historial privado
  tests/                     # Regresiones de autenticación y módulos académicos
memory/                      # Requisitos, decisiones y guía de identidades QA
test_reports/                # Resultados de pruebas
```

## Dependencias y ejecución
Se necesitan Node.js con Yarn, Python y MongoDB. Las dependencias exactas están registradas en `frontend/package.json`, `frontend/yarn.lock` y `backend/requirements.txt`.

Frontend:
```bash
cd frontend
yarn install
yarn start
```

Compilar frontend:
```bash
cd frontend
yarn build
```

Backend (instalar dependencias):
```bash
cd backend
pip install -r requirements.txt
```

En el entorno gestionado, frontend y backend ya están iniciados con supervisor y recarga automática; no iniciar servidores duplicados.

Configuración requerida, sin incluir secretos en el código:
- `frontend/.env`: `REACT_APP_BACKEND_URL` y las variables ya existentes del entorno.
- `backend/.env`: `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, `EMERGENT_LLM_KEY`, `OPENAI_MODEL` (actualmente `gpt-5.4`).
- Google Auth es gestionado. No existen contraseñas propias de la app ni se requieren claves de Google del usuario.

## Funciones y persistencia
- **MongoDB real:** usuarios/sesiones, roles, asignaturas/invitaciones, integrantes, tareas compartidas, horarios, acuerdos, chats por asignatura y privados, eventos y conversaciones del asistente IA.
- **OpenAI real:** respuesta progresiva, estado pensando, conversaciones privadas persistentes y contexto autorizado de asignaturas/tareas. No sustituye fuentes oficiales de la universidad.
- **LocalStorage por usuario/navegador:** dudas, respuestas, guardados, enlaces a recursos y grupo/agenda local. Se conservan datos previos mediante migración local no destructiva. No se sincronizan entre dispositivos.
- **Ejemplos SIMULADOS:** personas y materiales iniciales. No tienen contacto ni archivos oficiales reales; la interfaz lo indica. No hay chats simulados ni respuestas IA simuladas.
- **Roles autodeclarados:** no certifican vínculo institucional. Profesor crea y administra sus asignaturas; estudiantes se unen y colaboran; monitores añaden acuerdos de apoyo. El backend verifica pertenencia y permisos, incluidos chats privados entre miembros de asignaturas comunes.
- Fechas reales ISO guardadas y visualizadas en `America/Bogota` (UTC-5). Fechas históricas locales sin timestamp verificable se muestran como no registradas, sin inventarlas.

## Pruebas
```bash
cd frontend
yarn tsc --noEmit
yarn build

cd ../backend
pytest -q tests/test_academic_api.py tests/test_auth_api.py
```
Las pruebas académicas requieren identidades QA configuradas en el entorno. Consultar `memory/test_credentials.md` y `auth_testing.md`; no se ejecutan semillas QA al iniciar la aplicación.

## Guardar el proyecto en GitHub
Usar exclusivamente el botón **Save to GitHub** de Emergent y seleccionar/conectar `ivandavbejarano-coder/UAO_CONECTA`. La operación debe confirmarse en la interfaz. No se ha verificado una subida del proyecto en esta sesión.
