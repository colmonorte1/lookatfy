# Despliegue a Producción en DigitalOcean (Paso a paso)

## App Platform (recomendado)
- Prepara el repo en GitHub o usa doctl para desplegar desde local.
- Variables necesarias:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - DAILY_API_KEY
  - SUPABASE_SERVICE_ROLE_KEY
- Opciones:
  - Conectar GitHub en App Platform y configurar manualmente build/run/env.
  - Usar el spec en `.do/app.yaml` con doctl.

### Opción A: App Platform vía UI
- Crea una App en DigitalOcean App Platform y conecta el repositorio.
- Selecciona el componente Web con Node.js.
- Build command: `npm ci && npm run build`
- Run command: `npm run start -- -p $PORT`
- Añade variables:
  - NEXT_PUBLIC_SUPABASE_URL (Build+Run, tipo Secret)
  - NEXT_PUBLIC_SUPABASE_ANON_KEY (Build+Run, tipo Secret)
  - DAILY_API_KEY (Run, tipo Secret)
  - SUPABASE_SERVICE_ROLE_KEY (Run, tipo Secret)
- Escalado: 1 instancia, tamaño `basic-xxs` para empezar.
- Despliega y valida logs y rutas `/api/*` y páginas SSR.

### Opción B: doctl con app spec
- Instala doctl y autentícate: `doctl auth init`
- Crea la App desde el spec:

```bash
doctl apps create --spec .do/app.yaml
```

- Para updates: `doctl apps update <APP_ID> --spec .do/app.yaml`
- Configura los valores de las variables en App Platform si no los definiste al crear.

### Dominio y SSL
- Agrega tu dominio en la sección Domains de la App.
- Apunta DNS según indicaciones de DigitalOcean.
- SSL gestionado automáticamente con Let’s Encrypt.

### Verificaciones
- Comprueba que `NEXT_PUBLIC_*` llega al cliente y a build.
- Valida que `SUPABASE_SERVICE_ROLE_KEY` solo se usa en servidor.
- Prueba autenticación y almacenamiento de Supabase.
- Verifica endpoints Daily: `/api/recordings` y `/api/daily/room`.

### Nota sobre imágenes
- Si cambias de proyecto Supabase, ajusta `next.config.ts` para permitir el nuevo hostname en `images.remotePatterns`.

## Droplet con Docker (alternativa)
- Usa el `Dockerfile` incluido para construir y correr la app.

### Construir imagen
```bash
docker build -t lookatfy-app:prod .
```

### Ejecutar contenedor
```bash
docker run -d --name lookatfy \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e DAILY_API_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -p 80:3000 lookatfy-app:prod
```

### Producción sólida
- Opcional: Proxy inverso con Nginx para TLS y compresión.
- Configura firewall y backups.
- Monitorea logs y métricas.

## Buenas prácticas
- No expongas claves de Service Role en el cliente.
- Usa Secrets en App Platform para variables sensibles.
- Mantén Node >= 18.18 (definido en `package.json`).
