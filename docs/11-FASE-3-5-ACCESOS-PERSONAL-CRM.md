# Cazana Store · Fase 3.5 — Acceso de atención y CRM por roles

Esta actualización **no crea conversaciones falsas**, ni modifica los datos de MongoDB ni las credenciales actuales. Prepara el acceso independiente del rol `support` y conserva el panel original del administrador.

## Qué hace
- `owner`, `admin` e `inventory`: conservan su panel operativo `/staff`.
- `support`: inicia sesión con su código y contraseña en `/staff/login` y entra exclusivamente a `/staff/atencion`.
- `accounting`: muestra una página privada indicando que su módulo todavía está en desarrollo.
- Los empleados de inventario dejan de ver pestañas ajenas a sus responsabilidades.
- Bloquea la carga directa de las plantillas HTML desde `/staff-assets/*.html`.
- Las API de inventario y pedidos siguen exigiendo sus roles en el backend; el perfil de soporte **no** adquiere sus permisos.
- Permite registrar **una cuenta de prueba** con rol `support` desde la terminal autorizada, sin contraseña predefinida.

## Instalación Windows (desde la carpeta raíz junto a `index.html`)

1. Guarda los archivos abiertos de VS Code. Conviene tener un commit de respaldo antes de aplicar cambios.
2. Copia `instalar-fase-3-5.cjs` a la raíz de Cazana Store.
3. Ejecuta `node .\instalar-fase-3-5.cjs --check` (no escribe ningún archivo).
4. Si pasa: `node .\instalar-fase-3-5.cjs` (crea backup en `%TEMP%`).
5. Comprueba: `npm.cmd --prefix backend test`.
6. Reinicia el servidor si no se reinicia solo (`cd backend`, `npm.cmd run dev`).
7. Abre `http://localhost:3000/staff/login`.

### Crear un empleado de atención **con autorización de Percy**

Desde la raíz, en una terminal nueva y sin detener el servidor:

```powershell
cd backend
npm.cmd run create-support
```

Introduce un código nuevo `CZ-SUP-0001` (o siguiente libre), nombre, correo de trabajo y contraseña de **12 o más caracteres**. El sistema solicita la contraseña de forma oculta y guarda su hash bcrypt.

**Importante:** este comando crea una cuenta real en la base de datos configurada en `.env`. Para pruebas, utilice una identidad y contraseña de prueba autorizadas. No crees cuentas reales de empleados sin su aprobación, y no compartas contraseñas en el chat. El futuro panel de personal permitirá la invitación segura sin depender de este comando.

En una ventana privada, ingresa a `/staff/login` con el empleado de prueba. Debes terminar en `/staff/atencion`. Comprueba después que no puedas abrir el panel administrativo ni acceder a las API:

- Visitar `/staff` debe redirigirte a `/staff/atencion`.
- `GET /api/admin/products` autenticado como `support` responde **403**.
- `GET /api/admin/orders` autenticado como `support` responde **403**.
- `GET /api/staff/me` responde tu propio rol `support`.
- El panel CRM indica **En preparación**: todavía no hay conversaciones reales ni datos personales de clientes disponibles.

### Limpieza / Git

Con tests aprobados, revisa `git status --short`, confirma `.env` y `node_modules` ignorados. Usa `git add -u` seguido de `git add` de los nuevos archivos `backend/src/staff-access.js`, `backend/staff/support.*`, `backend/staff/unavailable.*`, `backend/scripts/create-support.js`, `backend/test/staff-permissions.test.js` y este documento. Verifica `git diff --cached --name-only` antes del commit. No incluyas `instalar-fase-3-5.cjs`.

## Notas de seguridad y límites

La separación de datos se realiza en las rutas de Express y las API. Ocultar pestañas mejora la experiencia, pero no sustituye los controles del backend. Esta fase no crea un chat real, no almacena conversaciones, y no concede al equipo de soporte acceso a pedidos, inventario ni finanzas. Eso se implementará de forma selectiva en una fase posterior, con permisos por conversación.

La instalación crea un respaldo temporal de los archivos modificados; no se cambian `backend/.env`, `backend/src/models.js` ni la base de datos. Si el código cambió y no coinciden las referencias, el instalador se detiene sin alterar archivos.
