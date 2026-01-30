## Objetivo
- Integrar cobros reales con Wompi en el flujo de checkout, reemplazando el mock actual en [checkout/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/checkout/page.tsx#L155-L175).
- Soportar métodos principales: Tarjeta, PSE, Nequi y Daviplata; dejar PCOL como opcional.

## Requisitos
- Crear cuenta Wompi y obtener llaves: Public Key (frontend) y Private Key (backend). Ambiente Sandbox primero, Producción después.
- No almacenar datos sensibles de métodos de pago. Usar tokenización vía Wompi.
- Preparar variables de entorno: NEXT_PUBLIC_WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY, WOMPI_WEBHOOK_SECRET.

## Arquitectura
- Frontend (Next.js App Router):
  - Mostrar selector de método de pago y capturar datos usando la librería Wompi JS (versión vigente) o el widget/redirección según el método.
  - Obtener y enviar al backend el token seguro del método de pago (tokenización).
- Backend (API Routes Next.js):
  - Endpoint POST /api/payments/wompi/create: recibe booking y token del método; crea Source/Transaction con Wompi usando fetch.
  - Endpoint POST /api/payments/wompi/webhook: recibe eventos de Wompi; valida firma y actualiza estado en Supabase.
- Persistencia: actualizar tablas de pagos/booking usando Supabase (seguir patrones de [notifications](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/notifications/route.ts) y [recordings/resolve](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/recordings/resolve/route.ts)).

## Flujo de Pago (alto nivel)
1) Frontend obtiene acceptance token del comercio y tokeniza el método de pago (Wompi Docs: Fuentes de pago & Tokenización).  
2) Backend crea la "fuente de pago" (si aplica) y una transacción con monto, moneda, referencia y cliente.  
3) Wompi procesa y emite eventos de estado (Eventos de Wompi).  
4) Webhook valida evento y actualiza estado: APPROVED/DECLINED/VOIDED, etc.; el frontend refleja el resultado.

## Implementación en el código
- Frontend:
  - Refactor en [checkout/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/checkout/page.tsx): reemplazar confirmación mock por flujo Wompi (selector método, formulario seguro para Daviplata según docs).  
  - Crear helper de cliente Wompi para iniciar tokenización y enviar al backend.
- Backend:
  - Nuevo archivo [app/api/payments/wompi/create/route.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/payments/wompi/create/route.ts): POST que llama al API de Wompi con fetch (sin axios).  
  - Nuevo archivo [app/api/payments/wompi/webhook/route.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/payments/wompi/webhook/route.ts): POST que valida firma y actualiza Supabase.  
  - Utilidades: módulo lib/wompi.ts con funciones para headers, endpoints y validación de firma.

## Métodos de Pago y Consideraciones
- Tarjetas: tokenización y pagos on-site; ideal para UX fluida.  
- PSE/Transferencia: suele redirigir; manejar estados pendientes en UI.  
- Nequi: tokenización similar.  
- Daviplata: solicitar tipo y número de documento y enviar OTP según docs; campos adicionales en el formulario.  
- PCOL (opcional): permitir pagos con Puntos Colombia como método adicional.

## Seguridad
- Variables en `.env.local` siguiendo patrón existente ([.env.example](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/.env.example)).  
- Nunca almacenar PANs, CVV ni credenciales del cliente.  
- Validar firma de eventos del webhook y registrar sólo estados.

## Webhooks y Estados
- Registrar eventos relevantes de Wompi y mapearlos a estados internos (pending, approved, declined).  
- Reintentos idempotentes: usar referencias únicas por transacción.  
- Auditoría: guardar payloads mínimos necesarios.

## UX
- Spinner y estados claros durante redirecciones/OTP.  
- Mensajes amigables en éxito y error en [checkout/success](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/checkout/success/page.tsx) y una página de error análoga.  
- Accesibilidad y validaciones de campos.

## Pruebas
- Sandbox primero: usar datos de prueba y validar flujos de cada método.  
- Pruebas de integración para webhook y creación de transacción (API Routes).  
- Logs mínimos y trazas de referencia de transacción.

## Entregables
- Endpoints y helpers implementados.  
- Checkout funcional con Wompi.  
- Documentación rápida de variables y procesos.

Si te parece, Jota, confirmo este plan y arrancamos con la implementación paso a paso con cariño y cero estrés.