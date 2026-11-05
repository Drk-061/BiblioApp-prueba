# Contrato sugerido de API para registro (NO es un backend implementado)

Las rutas están implementadas solo como **cliente HTTP en React Native**. Para que creen usuarios reales debes programar las rutas y comprobaciones en Node.js + Express + MySQL.

## 1. Verificar disponibilidad del formulario de encargados

`GET /api/registro/encargados/disponibilidad`

Respuesta HTTP 200:

```json
{ "habilitado": false }
```

`habilitado` debe venir de configuración controlada por el servidor y editable **solo por ADMIN**.
Si la API no responde, la app muestra un error de conexión, en vez de dar por hecho que existe autorización.

## 2. Registrar usuario

`POST /api/auth/registro`

Petición JSON:

```json
{
  "tipoUsuario": "CLIENTE",
  "matricula": "ABC12345",
  "nombres": "Ana",
  "apellidoPaterno": "López",
  "apellidoMaterno": "Pérez",
  "contrasena": "contrasena-ejemplo-segura"
}
```

Respuesta HTTP 201 (cliente):

```json
{ "estado": "REGISTRADO" }
```

Respuesta HTTP 202 o 201 (encargado autorizado a **solicitar** registro):

```json
{ "estado": "PENDIENTE_APROBACION" }
```

Respuesta HTTP 403 si el administrador no ha abierto los registros de encargados. No debe bastar con que el cliente móvil envíe `tipoUsuario: "ENCARGADO"`: el backend debe comprobar nuevamente el estado del registro y crear la cuenta como pendiente, sin permisos operativos.

Para cliente, aplica igualmente validaciones del lado servidor, matrícula y correo únicos, hash seguro de contraseña, protección de datos y manejo de errores de duplicados (`409`).

## 3. Función futura del administrador

Ruta sugerida: `PATCH /api/admin/configuracion/registro-encargados` con `{ "habilitado": true }` y sesión validada con rol ADMIN. Registrar en auditoría quién habilitó el acceso y cuándo.

La apertura del formulario de encargados y la aprobación de una cuenta son **dos acciones diferentes**:

1. Abrir el formulario para que puedan enviar solicitudes.
2. Revisar y aprobar/rechazar cada solicitud individual; solo entonces asignar ENCARGADO.

Para el administrador se necesitaría después una pantalla de solicitudes y un endpoint dedicado de aprobación. **Nunca crear un ADMIN desde el registro público.**

## 4. Revisión pendiente del modelo

Tu PDF de MySQL anterior incluye `CatTipoUsuario`, `Usuario` y `estado BOOLEAN`, pero no tiene la configuración de disponibilidad ni un estado de solicitud de encargado. Estos son cambios sugeridos para cuando se diseñe el módulo ADMIN, no modificaciones realizadas automáticamente a la BD.
