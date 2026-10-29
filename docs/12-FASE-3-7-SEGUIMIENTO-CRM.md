# Cazana Store · Fase 3.7 — Seguimiento del CRM

**Compatible con:** `AlexLrmp/CazanaStore`, rama `main`, commit de referencia `726818b4bc75701f159a40beec895d77f66d5b0e` (27/10/2026).  
**No reemplaza el backend**, no toca `backend/.env`, no importa catálogos ni borra registros de MongoDB.

## Incluye
- Búsqueda de conversaciones y contactos por nombre o correo (máximo 60 caracteres).
- Filtros: todas las conversaciones visibles, sin asignar, asignadas a mí.
- **Tomar** una conversación libre, **liberar** una propia y **reasignar** (solo propietario/administrador).
- Respuestas, cierre y anotaciones restringidos **desde el backend** al agente asignado o responsables (`owner`/`admin`).
- Prioridad alta/normal, notas internas no visibles al cliente, insignia de conversaciones pendientes.
- Pruebas automatizadas de política de autorización y filtros.

## Instalación
1. Guarde los archivos locales y haga un commit de respaldo. Mantenga su `.env` fuera de Git.
2. Extraiga `instalar-fase-3-7.cjs` junto al `index.html` de la raíz de CazanaStore.
3. En PowerShell abierto en esa carpeta:

```powershell
node .\instalar-fase-3-7.cjs --check
node .\instalar-fase-3-7.cjs
npm.cmd --prefix backend test
npm.cmd --prefix backend run dev
```

El script **solo actúa** si reconoce los archivos de la Fase 3.6.1, realiza un respaldo en la carpeta temporal de Windows y revierte los cambios si la validación de sintaxis falla. Si hay diferencias en el código fuente local, se detiene sin modificar ningún archivo. No copie ninguna subcarpeta `backend` adicional.

## Prueba recomendada
- Abra `/staff/atencion` como `CZ-SUP-0001`.
- Cree una conversación desde una ventana de cliente distinta.
- Pruebe la búsqueda y seleccione **Sin asignar**.
- Pulse **Tomar conversación**; ahora podrá responder y guardar una nota interna o marcarla como prioridad alta.
- En otra cuenta `support`, compruebe que la conversación asignada al primer empleado **no aparece ni se puede abrir por API**.
- Desde una cuenta `owner`/`admin`, abra `/staff/atencion` para reasignar a otro empleado de atención.
- Abra la burbuja del cliente: **no deberá mostrar notas internas ni nombres de empleados**.

## Límites y siguientes pasos
Esta versión aún usa actualización periódica; no son alertas push en el escritorio. La bandeja lista hasta 40 conversaciones por filtro; para un entorno de alto volumen habrá que incorporar paginación y un sistema de asignación por turnos. El historial de chat sigue teniendo la política de expiración de 90 días heredada de la Fase 3.6; para producción hay que acordar las reglas de retención y privacidad con Percy. La versión en GitHub Pages no ejecuta este backend.

## Seguridad
El panel de atención **no debe acceder al catálogo, inventario, finanzas ni configuración**. Los roles se verifican en el servidor. No suba `backend/.env`, `node_modules` ni secretos al repositorio. Solo cree cuentas de personal con autorización del responsable.
