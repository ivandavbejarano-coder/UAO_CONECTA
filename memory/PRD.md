# UAO Conecta — PRD

## Problema original
Aplicación web académica para que estudiantes puedan encontrar información, resolver dudas, coordinar trabajos y saber a quién acudir. Debe ser real, responsive, fácil de modificar y funcionar inicialmente con datos locales persistentes.

## Decisiones de arquitectura
- Frontend React 19 con TypeScript, ejecutado sobre el scaffold CRA/Craco existente para conservar la ejecución del entorno.
- React Router para todas las rutas del producto.
- Datos demostrativos centralizados en `src/data.ts`.
- Estado de producto persistido con `localStorage`: dudas, respuestas, tareas y guardados.
- Sin backend ni integraciones externas para esta primera versión. **MOCKED**: datos y acciones locales.
- CSS propio responsive con navegación lateral en escritorio y navegación inferior en móvil.

## Personas usuarias
- Estudiante que necesita encontrar una explicación o recurso rápidamente.
- Integrante de un grupo que necesita coordinar tareas, horarios y archivos.
- Estudiante que busca una ruta de apoyo apropiada: docente, monitor o recurso.

## Requisitos principales
- Inicio con buscador, asignaturas, actividad reciente y accesos rápidos.
- Dudas: búsqueda, filtros, detalle, creación, anonimato, respuestas, utilidad y solución.
- Mi grupo: integrantes, tareas con estados, horarios comunes y archivos/acuerdos.
- Rutas: docentes, monitores y recursos organizados.
- Perfil, notificaciones y guardados.
- Estados vacíos, confirmaciones, responsive y `data-testid` para flujos importantes.

## Implementado — 2026-09-28
- Reemplazado el starter por la experiencia completa de UAO Conecta.
- Añadidas rutas `/`, `/inicio`, `/dudas`, `/dudas/nueva`, `/dudas/:id`, `/grupo`, `/grupo/horarios`, `/grupo/tareas`, `/grupo/archivos`, `/rutas`, `/rutas/docente`, `/rutas/monitor`, `/rutas/recursos`, `/perfil`, `/notificaciones` y `/guardados`.
- Implementados filtros de dudas y recursos, creación de preguntas, publicación anónima, respuestas, soluciones, guardados, tareas, horarios y notificaciones.
- Añadida persistencia local y sincronización de nuevas dudas durante la navegación SPA.
- Verificado con build de producción y pruebas frontend E2E en escritorio y 375px.

## Backlog priorizado
- **P0:** Ninguno bloqueante para la demo local.
- **P1:** Extraer pantallas y componentes a carpetas separadas para facilitar el aprendizaje y mantenimiento.
- **P1:** Reemplazar acciones de archivos **MOCKED** por almacenamiento real cuando exista backend.
- **P2:** Añadir búsqueda agrupada por personas, recursos y grupos con ranking real.
- **P2:** Conectar autenticación institucional y permisos de roles.

## Próximos pasos
1. Probar los flujos con estudiantes y ajustar textos según sus comentarios.
2. Separar `App.tsx` en `components`, `pages`, `hooks` y `types` cuando el diseño de información esté validado.
3. Sustituir `localStorage` por API y base de datos cuando se necesite multiusuario.
4. Mantener los datos de demostración claramente identificados como no oficiales.