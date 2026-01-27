## Lookatfy App v1

Aplicación Next.js con App Router, SSR/CSR, TypeScript, Supabase y Daily.co.

### Requisitos
- Node.js 20+ y npm
- Cuenta y proyecto en Supabase
- Cuenta y API key en Daily.co

### Configuración de entorno
1. Copia el archivo `.env.example` a `.env.local` y completa valores:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DAILY_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

2. Verifica dominios de imágenes en `next.config.ts` si usas storage propio.

### Desarrollo local

```bash
npm install
npm run dev
```

Aplicación en http://localhost:3000

### Scripts útiles
- `npm run dev`: servidor de desarrollo
- `npm run build`: compilación de producción
- `npm run start`: servidor de producción local
- `npm run lint`: análisis ESLint

### Supabase
- Esquema y políticas en `supabase/schema.sql`
- Cliente SSR: `utils/supabase/server.ts`
- Cliente browser: `utils/supabase/client.ts`

### Videollamadas
- Endpoint para crear sala Daily: `app/api/daily/room/route.ts`
- UI y provider Daily: `components/video/VideoCall.tsx` y `components/video/CallUI.tsx`

### Despliegue en Vercel + Supabase
1. Importa el repo en Vercel
2. Configura variables de entorno en Vercel
3. Conecta Supabase y aplica `supabase/schema.sql` si corresponde
4. Ajusta dominios de imágenes en `next.config.ts`
5. Ejecuta build automático

### Calidad y A11y
- App Router con páginas de estados `loading` y `error` por sección
- ESLint configurado en `eslint.config.mjs`
- TypeScript estricto en `tsconfig.json`

### Estructura relevante
- Páginas y layouts: `app/*`
- Componentes UI: `components/*`
- Acciones de servidor: `app/**/actions.ts`
- Middleware de sesión: `middleware.ts`

### Notas
- No exponer claves del Service Role en cliente
- Usar Server Actions o API Routes para operaciones sensibles
