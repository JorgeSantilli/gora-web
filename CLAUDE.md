# GORA-WEB — Sistema de Gestión de Agencia de Viajes

## Contexto del proyecto
Migración del sistema SYS-TUR (Visual FoxPro, ~30 años) a una aplicación web moderna.
Sistema original operativo en Mendoza, Argentina. Empresa: GORA Turismo.

## Stack técnico
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Base de datos:** PostgreSQL via Supabase
- **ORM:** Prisma
- **UI:** shadcn/ui + Tailwind CSS
- **Auth:** Supabase Auth
- **Deploy:** Vercel + Supabase

## Arquitectura multi-tenant
- Cada `Agency` es un tenant independiente
- Todas las tablas tienen `agencyId` (FK a `Agency`)
- Supabase Row Level Security (RLS) garantiza aislamiento
- El primer tenant es "GORA Turismo"

## Roles de usuario (3 niveles)
- `ADMIN` — acceso irrestricto, gestión de la agencia
- `OPERATOR_ADMIN` — cajas, créditos, IVA, límites de cuenta, tarifas
- `OPERATOR` — reservas, vouchers, listados operativos

## Módulos del sistema (orden de desarrollo)
1. Foundation — auth, multi-tenant, RBAC, layout
2. Parámetros — tablas de configuración base
3. Clientes — agencias y pasajeros directos
4. Prestadores — hoteles, restaurants, transportes, proveedores
5. Programas/Itinerarios — paquetes turísticos
6. Reservas — módulo core (más complejo)
7. Tarifas y Costos
8. Facturación — facturas A/B, ND, NC con IVA ARCA
9. Ingreso de Valores — recibos, cheques, billetes
10. Órdenes de Pago
11. Cajas Diarias
12. IVA — libro ventas y compras (normativa ARCA)
13. Cuentas Corrientes — clientes y prestadores
14. Receptivo — traslados, excursiones, vehículos, guías, choferes
15. Reportes

## Estructura de carpetas
```
src/
  app/
    (auth)/           # login, register — sin layout principal
    (dashboard)/      # app protegida con layout
      [agencySlug]/   # rutas por tenant
        reservas/
        clientes/
        prestadores/
        programas/
        tarifas/
        facturacion/
        caja/
        iva/
        cuentas/
        receptivo/
        parametros/
  components/
    ui/               # shadcn/ui components
    forms/            # formularios reutilizables
    tables/           # tablas/grillas (TanStack Table)
  lib/
    prisma.ts         # singleton Prisma client
    supabase/
      server.ts       # Supabase server client
      client.ts       # Supabase browser client
    auth.ts           # auth helpers y middleware
    utils.ts          # cn(), formatCurrency(), formatDate()
  types/              # TypeScript types globales
  actions/            # Server Actions (mutaciones)
    [module].actions.ts
```

## Convenciones

### Server Actions
- Toda mutación usa Server Actions — no API routes salvo excepciones
- Validación con Zod en cada action
- Siempre incluir `agencyId` en queries — NUNCA queries sin tenant filter
- Pattern de action:
```ts
"use server"
export async function createReservation(agencyId: string, data: z.infer<typeof schema>) {
  const validated = schema.parse(data)
  return prisma.reservation.create({ data: { ...validated, agencyId } })
}
```

### Componentes
- Server Components por defecto
- `"use client"` solo cuando necesario (forms, interactividad)
- Grillas: TanStack Table via shadcn DataTable

## Dominio de negocio — conceptos clave

### Reserva
- Identificada por `origin` (letra) + `number` (ej: M67905)
- Estados: TENTATIVE → CONFIRMED → CANCELLED / INVOICED / VOUCHERS_ISSUED
- Compuesta de: Alojamiento, Comidas, Excursiones, Traslados, Tickets, Rentas, Varios

### Prestador vs Proveedor
- **Prestador**: servicio turístico (hotel, excursión, traslado)
- **Proveedor**: vende bienes (librería, combustible) — flag `isSupplier: true`
- Ambos en tabla `Provider`

### Facturación Argentina
- Factura **A**: cliente RI con CUIT — discrimina IVA
- Factura **B**: Consumidor Final, Monotributista, Exento
- Comprobantes: FA, ND (Nota Débito), NC (Nota Crédito), RC (Recibo)
- Conceptos IVA:
  - `GRAVADO`: servicios locales (21%)
  - `GRAVADO_TRANSPORTE`: transporte terrestre (10.5%)
  - `NO_COMPUTABLE`: servicios en el exterior
  - `EXENTO`: servicios exentos
  - `IMPUESTOS`: tasas de pasajes aéreos

### Vouchers
- **Emisivo**: pasajero presenta al prestador
- **Receptivo**: cuponera por servicio (comidas, excursiones)
- **Texto Libre**: voucher con texto predefinido

### Caja Diaria
- Cada movimiento genera asiento en caja
- Debe cerrarse diariamente
- Múltiples monedas: Pesos ($) y Dólares (u$s) — cajas separadas

## Comandos útiles
```bash
npm run dev
npx prisma migrate dev --name [nombre]
npx prisma studio
npx prisma db seed
npm run build
```
