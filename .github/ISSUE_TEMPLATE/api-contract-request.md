---
name: "API contract request"
about: "Solicitud al Backend para crear/ajustar un endpoint o campo"
title: "API Contract: [feature]"
labels: [api, backend, contract]
assignees: []
---

## Contexto
Descripción breve del caso de uso y pantalla afectada.

## Endpoint propuesto
- Método y ruta
- Autenticación requerida

## Request ejemplo
```json
{
  "example": true
}
```

## Response esperado
```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

## Reglas y validaciones
- Campos obligatorios y formatos
- Posibles códigos de error

## Consideraciones de seguridad
- PII
- RLS/roles
- Rate limit

## Notas
- Dependencias en UI o DB
