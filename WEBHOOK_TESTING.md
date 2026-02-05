# Testing de Webhook de Wompi en Local

## 1. Instalar ngrok

```bash
# Descargar de https://ngrok.com/download
# O con npm:
npm install -g ngrok

# O con chocolatey (Windows):
choco install ngrok
```

## 2. Exponer tu servidor local

```bash
# Asegúrate de que tu app esté corriendo en el puerto 3000
npm run dev

# En otra terminal, ejecuta ngrok:
ngrok http 3000
```

Verás algo como:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

## 3. Configurar Wompi con la URL de ngrok

1. Ve a Wompi Dashboard > Webhooks
2. Cambia la URL a: `https://TU-SUBDOMINIO.ngrok.io/api/payments/wompi/webhook`
3. Guarda los cambios

## 4. Probar el webhook

Ahora puedes hacer una transacción de prueba y el webhook llegará a tu máquina local.

## 5. Ver logs en tiempo real

```bash
# ngrok muestra todas las requests que llegan
# También puedes ver el dashboard en: http://localhost:4040
```

---

## Alternativa: Usar RequestBin para testing

Si solo quieres ver qué está enviando Wompi:

1. Ve a https://requestbin.com/
2. Crea un nuevo bin
3. Usa esa URL temporalmente en Wompi
4. Haz una transacción de prueba
5. Revisa el payload completo en RequestBin

---

## Para Producción

Una vez que estés listo para producción:

1. Despliega tu app a Vercel/Railway/etc
2. Usa la URL real: `https://lookatfy.com/api/payments/wompi/webhook`
3. Asegúrate de que las variables de entorno estén configuradas en producción
