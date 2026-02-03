# Refactorización del flujo de Checkout

## Problema actual

**ANTES (Incorrecto):**
```
1. Crear sala Daily.co → 💰 Cuesta dinero
2. Crear booking "pending"
3. Enviar emails
4. Enviar notificaciones
5. Intentar cobrar
6. Si falla → Todo lo anterior ya pasó ❌
```

**Problemas:**
- Salas de Daily.co creadas sin pago
- Emails enviados sin pago confirmado
- Slots bloqueados innecesariamente
- Base de datos llena de bookings "pending"

---

## Solución propuesta

**DESPUÉS (Correcto):**
```
1. Crear booking "pending" (SIN sala, SIN emails)
2. Procesar pago
3. Si webhook recibe APPROVED:
   a. Crear sala Daily.co
   b. Actualizar booking a "confirmed" con URL de sala
   c. Enviar emails
   d. Enviar notificaciones
4. Si webhook recibe DECLINED:
   - Booking queda como "cancelled"
   - No se crea nada más
```

---

## Cambios necesarios

### 1. Checkout (app/checkout/page.tsx)

**Eliminar:**
- Creación de sala Daily.co
- Envío de emails
- Envío de notificaciones

**Dejar solo:**
- Crear booking con `status: 'pending'` y `meeting_url: null`
- Procesar pago
- Redirigir a página de retorno

### 2. Webhook (app/api/payments/wompi/webhook/route.ts)

**Agregar lógica:**
- Si `status === 'APPROVED'`:
  - Crear sala Daily.co
  - Actualizar booking con URL de sala
  - Cambiar status a 'confirmed'
  - Enviar emails
  - Enviar notificaciones

### 3. Limpieza de bookings pendientes

**Crear job cron o trigger:**
- Eliminar bookings "pending" después de 1 hora sin pago
- O cambiarlos a "expired"

---

## Beneficios

✅ No se crean salas innecesarias (ahorro de dinero)
✅ No se envían emails basura
✅ Slots se liberan si no hay pago
✅ Base de datos limpia
✅ Mejor experiencia para el experto
✅ Flujo más profesional

---

## Alternativa: Reserva temporal

Si quieres bloquear el slot mientras el usuario paga (15 min):

1. Crear booking con `status: 'pending'` y campo `expires_at`
2. Procesar pago
3. Si pago exitoso → Confirmar booking
4. Si expira sin pago → Job automático elimina el booking
5. Calendario muestra slots "reservados temporalmente" con indicador visual

Esto requiere:
- Campo `expires_at` en la tabla bookings
- Job cron que limpie bookings expirados
- Lógica en el calendario para mostrar slots temporales
