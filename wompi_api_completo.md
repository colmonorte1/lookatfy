# Transacciones WOMPI – Documento completo (PDF → Markdown)

Conversión **lo más completa posible**: incluye el texto extraído de **todas las 34 páginas**.

> Nota: el PDF original contiene secciones tipo Swagger con ejemplos JSON; aquí se preservan en texto plano dentro de bloques para que una IA pueda parsearlo con facilidad.

## Página 1

```text
Transacciones
Operaciones  para crear y obtener información de transacciones.
GET
/transactions /{transaction_id}
Obtener una transacción
Dado un ID de transacción, el API retorna su información
Parameters
Name  Description
transaction_i d *
string
(path) ID de la transacción

Responses
Code  Description  Links
200 Transacción encontrada
Media  type

Controls  Accept  header.
• Example Valu e
• Schem a
{
  "data": {
    "id": "1292-1602113476 -10985",
    "created_at ": "2018-07-01 23:49:45  UTC",
    "amount_in_cents ": 3000000,
    "status": "PENDING ",
    "reference ": "TUPtdnVugyU40XlkhixhhGE6uYV2gh89" ,
    "customer_email ": "juan@example.com ",
    "currency ": "COP",
    "payment_method_type ": "NEQUI", No
links
```

## Página 2

```text
Code  Description  Links
    "payment_method ": {
      "type": "NEQUI",
      "phone_number ": 57310999000 1
    },
    "shipping_address ": {
      "address_line_1 ": "Calle 45 23 - 10",
      "country ": "CO",
      "region": "Cundinamarca ",
      "city": "Bogotá",
      "phone_number ": 57330765432 1
    },
    "redirect_url ": "http://mitienda.com.co/pago/redirect" ,
    "payment_link_id ": null
  }
}
404 Transacción no encontrada
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "NOT_FOUND_ERROR ",
    "reason": "La entidad solicitada  no existe"
  }

GET
/transactions
Buscar transacciones
Permite obtener un listado de transacciones que coincidan con los criterios de busqueda.
Requiere LLAVE PRIVADA
```

## Página 3

```text
Parameters
Name  Description
reference
string
(query) Referencia de una transacción. Requerido si no se especifican from_date, until_dat

from_date
string
(query) Fecha de inicio de la consulta. Requerido si no se especifica reference
Example  : 2018-07-01
2018-07-01
until_date
string
(query) Fecha final de la consulta. Requerido si no se especifica referen ce
Example  : 2018-07-01
2018-07-01
page
integer
(query) Nùmero de página. Requerido si no se especifica reference
Example  : 1
1
page_size
integer
(query) Nùmero de transacciones por página. Requerido si no se especifica reference
Example  : 50
50
id
string
(query) ID de la transacción
Example  : 1292-1602113476-10985
1292-1602
payment_method_type  Available  values  : CARD, NEQUI, PSE, BANCOLOMBIA, BANCOLOMBIA_T
```

## Página 4

```text
Name  Description
string
(query)
status
string
(query) Available  values  : PENDING, APPROVED, DECLINED, ERROR, VOIDED

customer_email
string($email)
(query) Email al cual se envía el comprobante de pago.
Example  : example@wompi.co
example@w
order_by
string
(query) Nombre del campo para aplicar el ordenamiento
Example  : created_at
created_at
order
string
(query) Orden de entrega de las transacciones
Available  values  : DESC, ASC
Example  : DESC

Responses
Code  Description
200 Transacciones que coincidan con los criterios de búsqueda
Media  typeControls  Accept  header.
```

## Página 5

```text
POS T
/transactions
Crear una transacción
Dado un objeto JSON con información como monto en centavos, referencia, método de pago,
etc. se crea una transacción. Para más detalles sobre el campo payment_method, consulta la
guía completa en https://docs.wompi.co/docs/en/metodos -de-pago - En caso de usar Fuentes
de Pago, debes usar la llave privada, en vez de la pública.
Find more details
Info
https://docs.wompi.co/docs/en/metodos -de-pago
Parameters
No parameters
Request body

Transacción a agregar
• Example Valu e
• Schem a
{
  "acceptance_token ": "eyJhbGciOiJIUzI1NiJ9.eyJjb250cmFjdF9pZCI6MSwicGVybWFsaW5rIjoiaHR0c
HM6Ly93b21waS5jby93cC1jb250ZW50L3VwbG9hZHMvMjAxOS8wOS9URVJNSU5PUy1ZLUNPTkRJQ0lPTkVTLURFLV
VTTy1VU1VBUklPUy1XT01QSS5wZGYiLCJmaWxlX2hhc2giOiIzZGNkMGM5OGU3NGFhYjk3OTdjZmY3ODExNzMxZjc
3YiIsImppdCI6IjE1ODU4NDE2MTUtNDU2MTgiLCJleHAiOjE1ODU4NDUyMTV9.bwBa- RjN3euycqeXVroLWwUN1ZR
Y1X11I4zn1y5nMiY ",
  "amount_in_cents ": 3000000,
  "currency ": "COP",
  "signature ": "sk8-438k4-xmxm392-sn2m2490000COPprod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI
6SFli6",
  "custome r_email": "example@wompi.co ",
  "payment_method ": {
    "type": "CARD",
    "token": "tok_prod_280_32326B334c47Ec49a516bf1785247ba2 ",
    "installments ": 2
  },
  "payment_source_id ": 1234,
  "redirect_url ": "https://mitienda.com.co/pago/resultado" ,
  "reference ": "TUPtdnVugyU40XlkhixhhGE6uYV2gh89" ,
  "expiration_time ": "2023-06-09T20:28:50.000Z ",
  "customer_data ": {
    "phone_number ": "573307654321 ",
    "full_name ": "Juan Alfonso Pérez Rodríguez" ,
    "legal_id ": "1234567890 ",
    "legal_id_type ": "CC"
```

## Página 6

```text
},
  "shipping_address ": {
    "address_line_1 ": "Calle 34 # 56 - 78",
    "address_line_2 ": "Apartamento  502, Torre I",
    "country ": "CO",
    "region": "Cundinamarca ",
    "city": "Bogotá",
    "name": "Pepe Perez",
    "phone_n umber": "573109999999 ",
    "postal_code ": "111111"
  }
}
Responses
Code  Description
201 Transacción creada
Media  type

Controls  Accept  header.
• Example Valu e
• Schem a
{
  "data": {
    "id": "1292-1602113476 -10985",
    "created_at ": "2018-07-01 23:49:45  UTC",
    "amount_in_cents ": 3000000,
    "status": "PENDING ",
    "reference ": "TUPtdnVugyU40XlkhixhhGE6uYV2gh89" ,
    "customer_email ": "juan@example.com ",
    "currency ": "COP",
    "payment_method_type ": "NEQUI",
    "payment_method ": {
      "type": "NEQUI",
      "phone_number ": 57310999000 1
    },
    "shipping_address ": {
      "address_line_1 ": "Calle 45 23 - 10",
      "country ": "CO",
      "region": "Cundinamarca ",
      "city": "Bogotá",
      "phone_number ": 57330765432 1
    },
    "redirect_url ": "http://mitienda.com.co/pago/redirect" ,
    "payment_link_id ": null
  }
}
```

## Página 7

```text
Code  Description
422 Entidad no procesable. Ejp: referencia duplicada, monto inválido, etc.
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "INPUT_VALIDATION_ERROR ",
    "messages ": {
      "propiedad_invalida ": [
        "No está presente ",
        "No es un número entero",
        "Debe ser mayor a 0"
      ]
    }
  }
}

POS T
/transactions /{transaction_id} /void
Anular una transacción
Anula una transacción APROBADA. Aplica únicamente para transacciones con Tarjeta (tipo
CARD). Requiere LLAVE PRIVADA
Parameters
Name  Description
transaction_i d *
string
(path) ID de la transacción

Request body
```

## Página 8

```text
Valor de la anulación
• Example Valu e
• Schem a
{
  "amount_in_cents ": 3000000
}
Responses
Code  Description
201 Transacción anulada
Media  typeControls  Accept  header.

Token s
Tokenizar tarjetas  de crédito.
POS T
/tokens/cards
Tokenizar  una tarjeta  de crédito
Dado un número de tarjeta,  mes de expiración,  año de expiración y CVC,  se tokeniza una
tarjeta para usarla al crear una transacción o una fuente de pago.  Requiere  LLAVE  PÚBLICA
Parameters
No parameters
Request body

Tarjeta a tokenizar
• Example Valu e
• Schem a
{
  "number": "4242424242424242 ",
  "cvc": "789",
```

## Página 9

```text
"exp_month ": "12",
  "exp_year ": "29",
  "card_holder ": "Pedro Pérez"
}
Responses
Code  Description
201 Token creado
Media  typeControls  Accept  header.
422 Cuerpo inválido o datos de la tarjeta inválidos.
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "INPUT_VALIDATION_ERROR ",
    "messages ": {
      "propiedad_invalida ": [
        "No está presente ",
        "No es un número entero",
        "Debe ser mayor a 0"
      ]
    }
  }
}

POS T
/tokens/nequi
Tokenizar una cuenta de Nequi
Dado un número celular y un nombre completo, se tokeniza una cuenta de Nequi para usarla
al crear una transacción o una fuente de pago. Requiere LLAVE PÚBLICA
Parameters
No parameters
Request body
```

## Página 10

```text
Cuenta Nequi a tokenizar
• Example Valu e
• Schem a
{
  "phone_number ": "3107654321 "
}
Responses
Code  Description
201 Token creado
Media  typeControls  Accept  header.
422 Cuerpo inválido o datos de la tarjeta inválidos.
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "INPUT_VALIDATION_ERROR ",
    "messages ": {
      "propiedad_invalida ": [
        "No está presente ",
        "No es un número entero",
        "Debe ser mayor a 0"
      ]
    }
  }
}

GET
/tokens/nequi/{token_id}
Obtener información sobre una Cuenta de Nequi tokenizada
Dado un token de una Cuenta Nequi, se obtiene información sobre si el cuentahabiente Nequi
ya aceptó la Suscripción en su app móvil o no. Requiere LLAVE PÚBLICA
```

## Página 11

```text
Parameters
Name  Description
token_i d *
string
(path) Token de la Cuenta Nequi

Responses
Code  Description
200 Información del token
Media  type

Controls  Accept  header.
• Example Valu e
• Schem a
{
  "data": {
    "id": "nequi_prod_L90xPj1y8UJA2a0kZ03XGYx2aTkPfLP7 ",
    "status": "DECLINED ",
    "phone_number ": "3097654321 ",
    "name": "Mi Tienda"
  }
}
404 Token de Cuenta Nequi no encontrado
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "NOT_FOUND_ERROR ",
    "reason": "La entidad solicitada  no existe"
  }
}
```

## Página 12

```text
Fuentes  de pago
Operaciones  para crear y obtener fuentes  de pago
Info
GET
/payment_sources /{payment_source_id}
Obtener  una fuente de pago
Dato un ID de fuente de pago,  el API retorna su información.  Requiere LLAVE  PRIVADA
Parameters
Name  Description
payment_source_i d *
integer
(path) ID de la fuente de pago

Responses
Code  Description
200 Fuente de pago encontrada
Media  type

Controls  Accept  header.
• Example Valu e
• Schem a
{
  "data": {
    "id": 543,
    "type": "CARD",
    "token": "tok_prod_280_32326B334c47Ec49a516bf1785247ba2 ",
    "status": "AVAILABLE ",
    "customer_email ": "juan@example.com ",
```

## Página 13

```text
Code  Description
    "public_data ": {
      "type": "CARD"
    }
  }
}
404 Fuente de pago no encontrada
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "NOT_FOUND_ERROR ",
    "reason": "La entidad solicitada  no existe"
  }
}

POS T
/payment_sources
Crear una fuente de pago
Dado un tipo de medio de pago (CARD o NEQUI), un token y un token de aceptación crea una
fuente de pago
Parameters
No parameters
Request body

• Example Valu e
• Schem a
{
  "type": "CARD",
  "token": "tok_prod_280_32326B334c47Ec49a516bf1785247ba2 ",
  "acceptance_token ": "eyJhbGciOiJIUzI1NiJ9.eyJjb250cmFjdF9pZCI6MSwicGVybWFsaW5rIjoiaHR0c
HM6Ly93b21waS5jby93cC1jb250ZW50L3VwbG9hZHMvMjAxOS8wOS9URVJNSU5PUy1ZLUNPTkRJQ0lPTkVTLURFLV
VTTy1VU1VBUklPUy1XT01QSS5wZGYiLCJmaWxlX2hhc2giOiIzZGNkMGM5OGU3NGFhYjk3OTdjZmY3ODExNzMxZjc
```

## Página 14

```text
3YiIsImppdCI6IjE1ODU4NDE2MTUtNDU2MTgiLCJleHAiOjE1ODU4NDUyMTV9.bwBa- RjN3euycqeXVroLWwUN1ZR
Y1X11I4zn1y5nMiY ",
  "customer_email ": "user@example.com "
}
Responses
Code  Description
201 Fuente de pago creada
Media  type

Controls  Accept  header.
• Example Valu e
• Schem a
{
  "data": {
    "id": 543,
    "type": "CARD",
    "token": "tok_prod_280_32326B334c47Ec49a516bf1785247ba2 ",
    "status": "AVAILABLE ",
    "customer_email ": "juan@example.com ",
    "public_data ": {
      "type": "CARD"
    }
  }
}
422 Entidad no procesable
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "INPUT_VALIDATION_ERROR ",
    "messages ": {
      "propiedad_invalida ": [
        "No está presente ",
        "No es un número entero",
        "Debe ser mayor a 0"
      ]
    }
  }
```

## Página 15

```text
Code  Description
}

Links  de pago
Operaciones  para crear,  actualizar y obtener links de pago
Info
GET
/payment_links /{payment_link_id}
Obtener  un link de pago
Dato un ID de link de pago,  el API retorna su información
Parameters
Name  Description
payment_link_i d *
string
(path) ID del link de pago

Responses
Code  Description
200 Link de pago encontrado
Media  type

Controls  Accept  header.
• Example Valu e
```

## Página 16

```text
Code  Description
• Schem a
{
  "data": {
    "id": "stagint_5ok3ab ",
    "active": true,
    "name": "Subscripción ",
    "description ": "Subscipción  mensual",
    "single_use ": false,
    "collect_shipping ": false,
    "collect_customer_legal_id ": false,
    "amount_in_cents ": 1000000,
    "currency ": "COP",
    "signature ": "sk8-438k4-xmxm392-sn2m2490000COPprod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6 ",
    "reference ": "TUPtdnVugyU40XlkhixhhGE6uYV2gh89 ",
    "expiration_time ": "2023-06-09T20:28:50.000Z ",
    "sku": "CDX-812345-1ADD",
    "expires_at ": "2022-12-10T14:30:00" ,
    "redirect_url ": "https://micomercio.co/tienda ",
    "image_url ": "https://micomercio.co/tienda/logo ",
    "customer_data ": {
      "customer_references ": [
        {
          "label": "Documento  de identidad" ,
          "is_required ": true
        }
      ]
    },
    "taxes": [
      {
        "type": "VAT",
        "amount_in_cents ": 100000
      },
      {
        "type": "VAT",
        "percentage ": 19
      }
    ],
    "created_at ": "2018-07-01 23:49:45  UTC",
    "updated_at ": "2018-07-01 23:49:45  UTC"
  }
}
404 Link de pago no encontrado
Media  type

• Example Valu e
```

## Página 17

```text
Code  Description
• Schem a
{
  "error": {
    "type": "NOT_FOUND_ERROR ",
    "reason": "La entidad solicitada  no existe"
  }
}

PATCH
/payment_links /{payment_link_id}
Activa o desactiva un link de pago
Dado un objeto JSON con información como monto en centavos, descripción, multiples pagos,
etc. se crea un link de pago. Para más detalles consulta la guía completa en
https://docs.wompi.co/docs/en/links -de-pago
Parameters
Name  Description
payment_link_i d *
string
(path) ID del link de pago

Request body

Link de pago a crear
• Example Valu e
• Schem a
{
  "active": false
}
```

## Página 18

```text
Responses
Code  Description
200 Link de pago actualizado
Media  type

Controls  Accept  header.
• Example Valu e
• Schem a
{
  "data": {
    "id": "stagint_5ok3ab ",
    "active": true,
    "name": "Subscripción ",
    "description ": "Subscipción  mensual",
    "single_use ": false,
    "collect_shipping ": false,
    "collect_customer_legal_id ": false,
    "amount_in_cents ": 1000000,
    "currency ": "COP",
    "signature ": "sk8-438k4-xmxm392-sn2m2490000COPprod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6 ",
    "reference ": "TUPtdnVugyU40XlkhixhhGE6uYV2gh89 ",
    "expiration_time ": "2023-06-09T20:28:50.000Z ",
    "sku": "CDX-812345-1ADD",
    "expires_at ": "2022-12-10T14:30:00" ,
    "redirect_url ": "https://micomercio.co/tienda ",
    "image_url ": "https://micomercio.co/tienda/logo ",
    "customer_data ": {
      "customer_references ": [
        {
          "label": "Documento  de identidad" ,
          "is_required ": true
        }
      ]
    },
    "taxes": [
      {
        "type": "VAT",
        "amount_in_cents ": 100000
      },
      {
        "type": "VAT",
        "percentage ": 19
      }
    ],
    "created_at ": "2018-07-01 23:49:45  UTC",
    "updated_at ": "2018-07-01 23:49:45  UTC"
  }
```

## Página 19

```text
Code  Description
}
404 Link de pago no encontrado
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "NOT_FOUND_ERROR ",
    "reason": "La entidad solicitada  no existe"
  }
}
422 Entidad no procesable
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "INPUT_VALIDATION_ERROR ",
    "messages ": {
      "propiedad_invalida ": [
        "No está presente ",
        "No es un número entero",
        "Debe ser mayor a 0"
      ]
    }
  }
}

POS T
/payment_links
Crear un link de pago
```

## Página 20

```text
Dado un objeto JSON con información como monto en centavos, descripción, multiples pagos,
etc. se crea un link de pago. Para más detalles consulta la guía completa en
https://docs.wompi.co/docs/en/links -de-pago
Parameters
No parameters
Request body

Link de pago a crear
• Example Valu e
• Schem a
{
  "name": "Subscripción ",
  "description ": "Subscipción  mensual",
  "single_use ": false,
  "collect_shipping ": false,
  "collect_customer_legal_id ": false,
  "amount_in_cents ": 1000000,
  "currency ": "COP",
  "signature ": "sk8-438k4-xmxm392-sn2m2490000COPprod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI
6SFli6",
  "reference ": "TUPtdnVugyU40XlkhixhhGE6uYV2gh89 ",
  "expiration_time ": "2023-06-09T20:28:50.000Z ",
  "sku": "CDX-812345-1ADD",
  "expires_at ": "2022-12-10T14:30:00" ,
  "redirect_url ": "https://micomercio.co/tienda ",
  "image_url ": "https://micomercio.co/tienda/logo ",
  "customer_data ": {
    "customer_references ": [
      {
        "label": "Documento  de identidad" ,
        "is_required ": true
      }
    ]
  },
  "taxes": [
    {
      "type": "VAT",
      "amount_in_cents ": 100000
    },
    {
      "type": "VAT",
      "percentage ": 19
    }
  ]
}
```

## Página 21

```text
Responses
Code  Description
201 Link de pago creado
Media  type

Controls  Accept  header.
• Example Valu e
• Schem a
{
  "data": {
    "id": "stagint_5ok3ab ",
    "active": true,
    "name": "Subscripción ",
    "description ": "Subscipción  mensual",
    "single_use ": false,
    "collect_shipping ": false,
    "collect_customer_legal_id ": false,
    "amount_in_cents ": 1000000,
    "currency ": "COP",
    "signature ": "sk8-438k4-xmxm392-sn2m2490000COPprod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6 ",
    "reference ": "TUPtdnVugyU40XlkhixhhGE6uYV2gh89 ",
    "expiration_time ": "2023-06-09T20:28:50.000Z ",
    "sku": "CDX-812345-1ADD",
    "expires_at ": "2022-12-10T14:30:00" ,
    "redirect_url ": "https://micomercio.co/tienda ",
    "image_url ": "https://micomercio.co/tienda/logo ",
    "customer_data ": {
      "customer_references ": [
        {
          "label": "Documento  de identidad" ,
          "is_required ": true
        }
      ]
    },
    "taxes": [
      {
        "type": "VAT",
        "amount_in_cents": 100000
      },
      {
        "type": "VAT",
        "percentage ": 19
      }
    ],
    "created_at ": "2018-07-01 23:49:45  UTC",
    "updated_at ": "2018-07-01 23:49:45  UTC"
  }
```

## Página 22

```text
Code  Description
}
422 Entidad no procesable. Ejp: referencia duplicada, monto inválido, etc.
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "INPUT_VALIDATION_ERROR ",
    "messages ": {
      "propiedad_invalida ": [
        "No está presente ",
        "No es un número entero",
        "Debe ser mayor a 0"
      ]
    }
  }
}

Comercio s
Operaciones  para comercios
GET
/merchants /{merchantPublicKey}
Obtener  un comercio  y token de aceptación
Dado un token público de un comercio,  se obtiene información del mismo.
```

## Página 23

```text
Parameters
Name  Description
merchantPublicKe y *
string
(path) Token público del comercio

Responses
Code  Description
200 Comercio encontrado.
Media  type

Controls  Accept  header.
• Example Valu e
• Schem a
{
  "data": {
    "id": 11000,
    "name": "Tienda del ahorro",
    "legal_name ": "Mi Tienda S.A.S.",
    "legal_id ": "9001723102 -4",
    "legal_id_type ": "NIT",
    "phone_number ": "5712134489 ",
    "active": true,
    "logo_url ": "https://placehold.it/500x200 ",
    "email": "admin@mitienda.com.co ",
    "contact_name ": "Pedro Pérez",
    "public_key ": "pub_prod_KadoutufreGpazE1rePQngfywlNdFJW ",
    "accepted_payment_methods ": [
      "CARD",
      "NEQUI",
      "PSE",
      "BANCOLOMBIA_TRANSFER ",
      "BANCOLOMBIA_COLLECT "
    ],
    "accepted_currencies ": [
      "COP"
    ],
    "presigned_acceptance ": {
      "acceptance_token ": "eyJhbGciOiJIUzI1NiJ9.eyJjb250cmFjdF9pZCI6MSwicGVybWFsaW5rIjoiaHR0cHM6Ly9
TTy1VU1VBUklPUy1XT01QSS5wZGYiLCJmaWxlX2hhc2giOi IzZGNkMGM5OGU3NGFhYjk3OTdjZmY3ODExNzMxZjc3YiIsImppdC
MfGOTpTaj4 ",
      "permalink ": "https://wompi.co/wp -content/uploads/2019/09/TERMINOS -Y-CONDICIONES -DE-USO-USUAR
```

## Página 24

```text
Code  Description
      "type": "END_USER_POLICY "
    }
  }
}
404 Comercio no encontrado
Media  type

• Example Valu e
• Schem a
{
  "error": {
    "type": "NOT_FOUND_ERROR ",
    "reason": "La entidad solicitada  no existe"
  }
}

PSE
Operaciones  relativas  a operaciones  de pago usando PSE.
GET
/pse/financial_institutions
Listado de instituciones  financieras  de PSE.
Obtener la lista de instituciones  financieras  con las cuales  se puede hacer un pago a través  de
PSE.  Requiere LLAVE  PÚBLICA
Parameters
No parameters
```

## Página 25

```text
Responses
Code  Description
200 Lista instituciones financieras de PSE.
Media  type

Controls  Accept  header.
• Example Valu e
• Schem a
[
  {
    "financial_institution_code ": "1051",
    "financial_institution_name ": "Bancolombia "
  }
]

Schemas
TransactionNew {
acceptance_toke
n* string($JWT)
example: eyJhbGciOiJIUzI1NiJ9.eyJjb250cmFjdF9pZCI6MSwicGVybWFsaW5rIjoiaHR0c
ODU4NDE2MTUtNDU2MTgiLCJleHAiOjE1ODU4NDUyMTV9.bwBa- RjN3euycqeXVroLWwUN1ZRY1X
Token JWT de aceptación (ver https://docs.wompi.co/docs/en/tokens-de- acepta
amount_in_cent s
* integer
maximum: 1000000000000
minimum: 1
example: 3000000
Monto total en centavos de la transacción. Por ejemplo, para $1.000 se escr
currency* string
example: COP
Moneda en la que se va a realizar la transacción. Únicamente COP actualment
Enum:
[ COP ]
signatur e* string
example: sk8-438k4-xmxm392- sn2m2490000COPprod_integrity_Z5mMke9x0k8gpErbDqw
```

## Página 26

```text
Hash criptográfico  asimétrico  para validar la integridad  de la información
customer_emai l* string($email)
example: example@wompi.co
Email al cual se envía el comprobante de pago.
payment_method  {
description:  Detalles del método de pago. OBLIGATORIO si no se
}
example: { "type": "CARD", "token": "tok_prod_280_32326B334c47Ec49a516bf178
payment_source_
id integer
example: 1234
ID de fuente de pago. OBLIGATORIA si no se usa un payment_method
redirect_url  string
example: https://mitienda.com.co/pago/resultado
URL a la que se lleva al usuario después de hacer el pago.
referenc e* string
example: TUPtdnVugyU40XlkhixhhGE6uYV2gh89
Referencia única en la base de datos de cada comercio.
expiration_time  string
example: 2023-06-09T20:28:50.000Z
Fecha y hora en formato ISO8601 (UTC+0000), activa un contador regresivo in
customer_data  {
phone_number  [...]
full_nam e* [...]
legal_id  [...]
legal_id_type  LegalIdType s[...]
}
shipping_addres
s {
address_line_ 1* [...]
address_line_2  [...]
country* [...]
region* [...]
city* [...]
name [...]
```

## Página 27

```text
phone_numbe r* [...]
postal_code  [...]
}
}
LegalIdTypes string
example: CC
Tipo de documento del pagador
Enum:
[ CC, NIT, PP, CE, TI, DNI, RG, OTHER ]

PaymentMethodTypes strin g
example: NEQUIEnum:
[ CARD, NEQUI, PSE, BANCOLOMBIA, BANCOLOMBIA_TRANSFER, BANCOLOMBIA_COLLECT,
BANCOLOMBIA_QR ]

TransactionStatuses strin g
example: PENDINGEnum:
[ PENDING, APPROVED, DECLINED, ERROR, VOIDED ]

Transaction {
id string
example:  1292-1602113476 -10985
created_at  string
example:  2018-07-01 23:49:45  UTC
amount_in_cents  integer
example:  3000000
status TransactionStatuses [...]
reference  string
example: TUPtdnVugyU40XlkhixhhGE6uYV2gh89
Referencia única enviada por el comercio
customer_email  {
}
example:  juan@example.com
currency  string
example: COP
Moneda en la que se realizó la transacción.
Enum:
[ COP ]
payment_method_type  PaymentMethodTypes [...]
payment_method  {
}
example:  { "type": "NEQUI",  "phone_number":  573109990001  }
shipping_address  {
```

## Página 28

```text
}
example: { "address_line_1": "Calle 45 23 - 10", "country": "CO", "regio
573307654321  }
redirect_url  string
example:  http://mitienda.com.co/pago/redirect
payment_link_id  string
example:
}
NequiTokenNew {
phone_number * string
example: 3107654321
Número celular asociado a la cuenta
Nequi
}

NequiToken {
id string
example: nequi_prod_L90xPj1y8UJA2a0kZ03XGYx2aTkPfLP7
Token de la cuenta Nequi
status string
example: DECLINEDEnum:
[ PENDING,  APPROVED,  DECLINED  ]
phone_number  string
example: 3097654321
Número de Cuenta Nequi (teléfono celular)
name string
example: Mi Tienda
Nombre del comercio solicitante
}

CardNew {
number* string
example: 4242424242424242
Número completo de la tarjeta de crédito. Sin espacios, únicamente
números.
cvc* string
example: 789
Código de seguridad de la tarjeta de crédito. También llamado CVV o
CSC.
exp_month * string
example: 12
Mes de vencimiento de la tarjeta en dos dígitos (02, 04, 11, etc.).
exp_year * string
example: 29
Año de vencimiento de la tarjeta en dos dígitos (18, 20, 23, etc.).
```

## Página 29

```text
card_holder * string
example: Pedro Pérez
Nombre del tarjeta habiente.
}

PaymentSourceTypes string
Medio de pago de la fuente. Puede ser CARD o NEQUI
Enum:
[ CARD, NEQUI ]

PaymentSourceStatuse sstrin gEnum:
[ AVAILABLE, PENDING ]
PaymentSource {
id integer
example: 543
Identificador usado para hacer pagos automáticos posteriores, en conjunt
del comercio
type PaymentSourceTypes [...]
token string
example: tok_prod_280_32326B334c47Ec49a516bf1785247ba2
Token de la Tarjeta o Cuenta Nequi tokenizada
status PaymentSourceStatuses [...]
customer_email  string
example: juan@example.com
Email del cuentahabiente o tarjetahabiente
public_data  {
type* PaymentSourceTypes [...]
phone_number  [...]
}
example:  { "type": "CARD" }
}

PaymentSourceNew {
type* PaymentSourceTypes [...]
token* string
example: tok_prod_280_32326B334c47Ec49a516bf1785247ba2
Token representando la tarjeta o número Nequi
acceptance_toke
n* string($JWT)
example: eyJhbGciOiJIUzI1NiJ9.eyJjb250cmFjdF9pZCI6MSwicGVybWFsaW5rIjoiaHR0c
ODU4NDE2MTUtNDU2MTgiLCJleHAiOjE1ODU4NDUyMTV9.bwBa- RjN3euycqeXVroLWwUN1ZRY1X
Token JWT de aceptación (ver https://docs.wompi.co/docs/en/tokens-de- acepta
customer_email * string($email)
```

## Página 30

```text
Correo del pagador
}

PaymentLink {
name* string
example: Subscripción
Nombre del link de pago
description * string
example: Subscipción mensual
Descripción del link de pago
single_use * boolean
example: false
false en caso de que el link de pago pueda recibir múltiples tr
pago APROBADO
collect_shipping * boolean
example: false
Si deseas que el cliente inserte su información de envío en el che
collect_customer_legal_id  boolean
example: false
Si deseas o no que el cliente inserte su tipo y numero documento d
amount_in_cents  integer
maximum: 1000000000000
minimum: 1
example: 1000000
Monto total en centavos de la transacción. Por ejemplo, para $1.00
pagador podrá elegir el valor a pagar
currency  string
example: COP
Moneda en la que se va a realizar la transacción. Únicamente COP a
Enum:
[ COP ]
signature  [...]
reference  string
example: TUPtdnVugyU40XlkhixhhGE6uYV2gh89
Referencia única en la base de datos de cada comercio.
expiration_time  string
example: 2023-06-09T20:28:50.000Z
Fecha y hora en formato ISO8601 (UTC+0000), activa un contador reg
sku string
maximum: 36
example: CDX-812345-1ADD
Identificador interno del producto en tu comercio. Máximo 36 carac
expires_at  string
example:  2022-12-10T14:30:00
```

## Página 31

```text
Fecha en formato ISO 8601 con huso horario UTC (+5 horas que el ho
redirect_url  string($url)
example: https://micomercio.co/tienda
URL donde será redirigido el cliente una vez termine el proceso de
image_url  string($url)
example: https://micomercio.co/tienda/logo
Dirección de la imagen que quieras presentar en el link de pago
customer_data  {
customer_references  [
maxItems: 2
{
label  [...]
is_required  [...]
}]
}
taxes [{
oneOf -> {
type [...]
amount_in_cents  [...]
}
{
type [...]
percentage  [...]
}
}]
}

PaymentLinkAll {
id string
example: stagint_5ok3ab
ID del link de pago
active boolean
example:  true
name* string
example: Subscripción
Nombre del link de pago
description * string
example: Subscipción mensual
Descripción del link de pago
single_use * boolean
example: false
false en caso de que el link de pago pueda recibir múltiples tr
pago APROBADO
collect_shipping * boolean
example: false
Si deseas que el cliente inserte su información de envío en el che
```

## Página 32

```text
collect_customer_legal_id  boolean
example: false
Si deseas o no que el cliente inserte su tipo y numero documento d
amount_in_cents  integer
maximum: 1000000000000
minimum: 1
example: 1000000
Monto total en centavos de la transacción. Por ejemplo, para $1.00
pagador podrá elegir el valor a pagar
currency  string
example: COP
Moneda en la que se va a realizar la transacción. Únicamente COP a
Enum:
[ COP ]
signature  string
example: sk8-438k4-xmxm392- sn2m2490000COPprod_integrity_Z5mMke9x0k
Hash criptográfico asimétrico para validar la integridad de la inf
reference  string
example: TUPtdnVugyU40XlkhixhhGE6uYV2gh89
Referencia única en la base de datos de cada comercio.
expiration_time  string
example: 2023-06-09T20:28:50.000Z
Fecha y hora en formato ISO8601 (UTC+0000), activa un contador reg
sku string
maximum: 36
example: CDX-812345-1ADD
Identificador interno del producto en tu comercio. Máximo 36 cara c
expires_at  string
example: 2022-12-10T14:30:00
Fecha en formato ISO 8601 con huso horario UTC (+5 horas que el ho
redirect_url  string($url)
example: https://micomercio.co/tienda
URL donde será redirigido el cliente una vez termine el proceso de
image_url  string($url)
example: https://micomercio.co/tienda/logo
Dirección de la imagen que quieras presentar en el link de pago
customer_data  {
customer_references  [
maxItems: 2
{
label  [...]
is_required  [...]
}]
}
taxes [{
oneOf -> {
type [...]
amount_in_cents  [...]
```

## Página 33

```text
}
{
type [...]
percentage  [...]
}
}]
created_at  string
example:  2018-07-01 23:49:45  UTC
updated_at  string
example:  2018-07-01 23:49:45  UTC
}

PaymentLinkPatch {
active* boolean
example: false
false para desactivar el link de pago, de lo
contrario true
}

Merchant {
id integer
example:  11000
name string
example:  Tienda del ahorro
legal_name  string
example:  Mi Tienda S.A.S.
legal_id  string
example:  9001723102 -4
legal_id_type  string
example: NITEnum:
[ NIT, CC ]
phone_number  string
example:  5712134489
active boolean
example:  true
logo_url  string($url)
example:  https://placehold.it/500x200
email string($email)
example:  admin@mitienda.com.co
contact_name  string
example:  Pedro Pérez
public_key  string
example:  pub_prod_KadoutufreGpazE1rePQngfywlNdFJW
accepted_payment_meth
ods [
example: [ "CARD", "NEQUI", "PSE", "BANCOLOMBIA_TRANSFER", "BANCOLOMB
stringEnum:
[ CARD, NEQUI, PSE, BANCOLOMBIA_TRANSFER,  BANCOLOMBIA_COLLECT  ]]
accepted_currencies  [
example: [ "COP" ]
stringEnum:
[ COP ]]
presigned_acceptance  {
```

## Página 34

```text
acceptance_to
ken string
example: eyJhbGciOiJIUzI1NiJ9.eyJjb250cmFjdF9pZC
DExNzMxZjc3YiIsImppdCI6IjE2MDAzNzQ2MDEtMzA5MzIiL
permalink  string
example:  https://wompi.co/wp -content/uploads/201
type stringEnum:
[ END_USER_POLICY  ]
}
}

FinancialInstitution {
financial_institution_code  string
example:  1051
financial_institution_name  string
example:  Bancolombia
}
InputValidationError {
error  {
type string
example: INPUT_VALIDATION_ERROR
Tipo de error
messages  {
propiedad_invalida  [...]
}
}
}

NotFoundError {
error  {
type string
example: NOT_FOUND_ERROR
Tipo de error
reason string
example: La entidad solicitada no
existe
Razón del error
}
}
```
