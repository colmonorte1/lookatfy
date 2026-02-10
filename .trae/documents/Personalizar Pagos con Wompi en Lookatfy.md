## Hallazgos Rápidos
- Tu código ya integra Wompi: creación de transacciones, fuentes de pago, bancos PSE y webhook de estado. Referencias: [wompi.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/lib/wompi.ts), [create/route.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/payments/wompi/create/route.ts), [pse/route.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/payments/wompi/pse/route.ts), [webhook/route.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/payments/wompi/webhook/route.ts).
- Alineado con buenas prácticas: firma de integridad SHA-256, validación de firma del webhook (HMAC), auditoría en payment_transactions.
- Gaps con docs actuales de Wompi:
  - Se exige enviar “acceptance tokens” dobles: acceptance_token y accept_personal_auth en /transactions y /payment_sources (Wompi Docs: Acceptance tokens).
  - PSE requiere user_legal_id_type y user_legal_id dentro de payment_method; tu tipo PSE no los incluye aún.
  - createPaymentSource no envía acceptance_token; las docs lo marcan como obligatorio.
  - Tarjetas deben permitir “installments” en payment_method; UI/flujo para cuotas no está definido aún en checkout.

## Qué Podemos Personalizar
- Métodos de pago: CARD, PSE, NEQUI, DAVIPLATA, PCOL; exponer selector y flujos específicos por método.
- Campos del pago: cuotas (CARD), datos del titular/documento (PSE, Daviplata), redirect_url (PSE), customer_data y metadata.
- Comportamiento sandbox: usar datos de prueba por método (Nequi, PSE bancos, Daviplata) y mostrar estados claros.
- Idempotencia: garantizar referencias únicas y opcionalmente key idempotente para evitar duplicados.

## Plan de Implementación
### 1) Acceptance Tokens Duales
- Ampliar getAcceptanceToken para obtener también presigned_personal_data_auth.
- Incluir acceptance_token y accept_personal_auth en:
  - Cuerpo de POST /transactions (createTransaction en [wompi.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/lib/wompi.ts)).
  - Cuerpo de POST /payment_sources (createPaymentSource en [wompi.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/lib/wompi.ts)).

### 2) PSE: Datos Requeridos en payment_method
- Extender tipo PSE para incluir user_legal_id_type (CC/NIT) y user_legal_id.
- Ajustar payload enviado desde [create/route.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/payments/wompi/create/route.ts) para ubicar estos campos dentro de payment_method.

### 3) Tarjetas: Cuotas e Interfaz
- Agregar selección de “installments” en checkout y enviarlo en payment_method cuando payment_method_type === 'CARD'.
- Tokenizar tarjeta vía /v1/tokens/cards (frontend) y usar payment_sources para cobros recurrentes si aplica.

### 4) Daviplata y Nequi
- Nequi: confirmar que soporte de payment_sources funcione para cobros repetidos.
- Daviplata: soportar campos adicionales (tipo/número de documento) y flujo OTP según docs; actualizar formulario y payload.

### 5) Idempotencia y Robustez
- Mantener referencias únicas por transacción.
- (Opcional) Añadir encabezado de idempotencia si tu caso lo requiere.
- Mejorar manejo de errores y mensajes en checkout/success y /error.

### 6) Persistencia y Auditoría
- Guardar campos adicionales (installments, legal_id_type/id) en payment_transactions.payment_method_details.
- Mantener trazabilidad conforme a [20260129_payment_transactions.sql](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/supabase/migrations/20260129_payment_transactions.sql).

### 7) Pruebas y Webhook
- Validar sandbox por método (Nequi/PSE/Daviplata/PCOL) con datos de prueba.
- Confirmar mapping de estados en webhook y side-effects (Daily, emails, notificaciones) según [REFACTOR_CHECKOUT_FLOW.md](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/REFACTOR_CHECKOUT_FLOW.md) y [WEBHOOK_TESTING.md](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/WEBHOOK_TESTING.md).

## Entregables
- Helpers actualizados para tokens y transacciones.
- Checkout con selector de método, cuotas y formularios adecuados.
- Webhook y DB ajustados para nuevos campos.
- Guía rápida de configuración y pruebas sandbox.

¿Le damos luz verde, Jota? Con esto dejamos los pagos súper pulidos y listos para producción, con cariño y sin estrés.