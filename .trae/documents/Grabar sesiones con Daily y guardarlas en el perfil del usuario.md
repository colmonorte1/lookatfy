## Opciones de grabación con Daily
- Tipos: cloud, local y raw-tracks. "local" requiere `enable_recording: "local"` en la sala o token. "cloud" y "raw-tracks" se inician con la API o daily-js.
- Inicio: cliente con `startRecording()` o servidor con `POST /rooms/:name/recordings/start`. Soporta multi-instancia mediante `instanceId`/`stream_id`.
- Estado: usar eventos de grabación para saber cuándo comienza/termina y manejar errores.
- Almacenamiento: por defecto en Daily; para "raw-tracks" se necesita bucket S3 propio.
- Gestión: listar y borrar grabaciones vía API de Daily.

## Flujo Propuesto End‑to‑End
- Habilitar grabación a nivel de sala/token según el tipo elegido.
- Iniciar y detener la grabación desde la UI de la llamada.
- Escuchar eventos de grabación para actualizar UI y persistir estado.
- Al finalizar, obtener metadatos/URL del archivo y registrarlos en BD.
- Asociar la grabación con `user_id` y, si aplica, `booking_id`.
- Mostrar las grabaciones en el perfil del usuario y permitir reproducción/descarga.

## Cambios en Frontend
- Integrar controles de grabación en la llamada: [Controls.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/components/video/Controls.tsx) y [VideoCall.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/components/video/VideoCall.tsx).
- Acciones:

```ts
const daily = useDaily();
const instanceId = crypto.randomUUID();
await daily.startRecording({ type: 'cloud', layout: { preset: 'default' }, instanceId });
await daily.stopRecording();
```

- Eventos:

```ts
daily.on('recording-started', () => setRecording(true));
daily.on('recording-stopped', async () => {
  setRecording(false);
  await fetch('/api/recordings', { method: 'POST', body: JSON.stringify({ instanceId }) });
});
daily.on('recording-error', () => setRecording(false));
```

- Si se prefiere "local": asegurar `enable_recording: 'local'` y usar `startRecording()`/`stopRecording()` desde el cliente.
- Si se requiere multi‑instancia: generar `instanceId` único por sesión.

## Cambios en Backend y Base de Datos
- Crear tabla `recordings` en Supabase:
  - `id` (uuid), `user_id` (uuid), `booking_id` (uuid opcional), `room_name`, `type` ('cloud'|'local'|'raw-tracks'), `status`, `started_at`, `ended_at`, `duration_ms`, `storage_url`/`s3_key`, `instance_id`.
- Políticas RLS: el propietario (`user_id`) puede leer; admin puede listar/borrar.
- Endpoints:
  - `POST /api/recordings`: persiste la grabación al detenerse; si tipo cloud/raw‑tracks, llamar Daily API para obtener metadatos/URL.
  - Opcional: `POST /api/daily/recordings/start`: iniciar desde servidor con `POST /rooms/:name/recordings/start`.
- Reutilizar contexto actual: [app/call/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/call/page.tsx) ya conoce `roomUrl` y usuario; usarlo para `room_name` y `user_id`.

## Almacenamiento del Archivo
- Cloud por defecto: guardar `storage_url` de Daily y reproducir `.webm` en el perfil.
- S3 propio ("raw-tracks"): configurar bucket en Daily; almacenar `s3_key` y reproducir/descargar desde su CDN/firma temporal.

## UI en Perfil del Usuario
- Añadir sección "Mis grabaciones" en [user/profile/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/user/profile/page.tsx): lista, filtros por estado/fecha, reproducción con `<video src={url} controls />`, y acciones de borrar/descargar.
- En Admin: completar el placeholder en [admin/users/[id]/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/admin/users/%5Bid%5D/page.tsx#L48) para revisar grabaciones por usuario.

## Seguridad y Costos
- Limitar quién puede iniciar grabación; mostrar aviso en UI.
- Firmar URLs de descarga y definir retención.
- Manejar `503` de la API con reintentos exponenciales.

## Pruebas y Verificación
- Pruebas de integración: iniciar/parar grabación y verificar fila en `recordings`.
- Pruebas de UI: estado grabando, errores.
- Sesiones reales de 1–2 min para validar reproducción y permisos.

## Siguientes Pasos
- Elegir tipo de grabación inicial (recomiendo "cloud" por simplicidad).
- Crear tabla `recordings` y endpoints.
- Conectar controles de grabación y eventos en la llamada.
- Añadir la sección de perfil para listar y reproducir.
