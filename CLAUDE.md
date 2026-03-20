# GORA-WEB — Sistema de Gestión de Agencia de Viajes

## Contexto del proyecto
Migración del sistema SYS-TUR (Visual FoxPro, ~30 años) a una aplicación web moderna.
Sistema original operativo en Mendoza, Argentina. Empresa: GORA Turismo.

## Stack técnico
- **Framework:** Next.js 16 (App Router, TypeScript)
- **Base de datos:** PostgreSQL via Supabase (proyecto: `wfmjdyveqblvtxprhilq`)
- **ORM:** Prisma 7 con `@prisma/adapter-pg` (driver adapter requerido en Prisma 7)
- **UI:** shadcn/ui + Tailwind CSS (Base UI internamente — usa `render` prop, no `asChild`)
- **Auth:** Supabase Auth
- **Deploy:** Vercel + Supabase

## Detalles de infraestructura
- **Pooler host:** `aws-1-us-east-1.pooler.supabase.com` (¡aws-1 no aws-0!)
- **Transaction pooler (app):** puerto 6543, user `postgres.PROJECT_REF`
- **Session pooler (CLI/migrations):** puerto 5432, mismo user
- **Auth proxy:** `src/proxy.ts` — export debe llamarse `proxy` (Next.js 16, no `middleware`)
- **Prisma config:** `prisma.config.ts` maneja la URL (no schema.prisma)
- **Prisma client:** usar `PrismaPg` adapter en cada instancia

## Arquitectura multi-tenant
- Cada `Agency` es un tenant independiente
- Todas las tablas tienen `agencyId` (FK a `Agency`)
- El primer tenant: slug `gora`, id `agency_gora_001`
- User model: `id` (cuid propio) + `supabaseId` (UUID de Supabase Auth) — buscar siempre por `supabaseId`

## Roles de usuario (3 niveles)
- `ADMIN` — acceso irrestricto, gestión de la agencia
- `OPERATOR_ADMIN` — cajas, créditos, IVA, límites de cuenta, tarifas
- `OPERATOR` — reservas, vouchers, listados operativos

## Estado de desarrollo — Módulos
1. ✅ **Foundation** — auth, multi-tenant, RBAC, layout, sidebar, login
2. ✅ **Parámetros** — CRUD 8 tablas de configuración base
3. ✅ **Prestadores** — hoteles, restaurants, transportes, proveedores
4. ✅ **Clientes** — agencias y pasajeros directos
5. ✅ **Programas/Itinerarios** — paquetes turísticos con 7 tipos de servicio
6. ✅ **Reservas** — módulo core completo (encabezado + 8 tipos de servicio + importes fiscales + estados)
7. 🚧 **Tarifas y Costos** — próximo módulo a desarrollar
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
    (auth)/           # login — sin layout principal
    (dashboard)/      # app protegida con layout
      layout.tsx      # carga dbUser por supabaseId, renderiza AppSidebar
      [agencySlug]/
        page.tsx      # dashboard home
        parametros/   # ← en construcción
        clientes/
        prestadores/
        programas/
        reservas/
        tarifas/
        facturacion/
        ingresos/
        ordenes-pago/
        caja/
        iva/
        cuentas/
        receptivo/
  components/
    ui/               # shadcn/ui components (Base UI — render prop pattern)
    forms/            # formularios reutilizables
    app-sidebar.tsx   # sidebar con navegación
  lib/
    prisma.ts         # singleton con PrismaPg adapter
    supabase/
      server.ts       # Supabase server client (cookies)
      client.ts       # Supabase browser client
    utils.ts          # cn(), formatCurrency(), formatDate()
  actions/            # Server Actions (mutaciones)
    [module].actions.ts
  proxy.ts            # auth proxy (Next.js 16) — export function proxy
prisma/
  schema.prisma       # fuente de verdad del modelo de datos
  seed.sql            # datos base — ejecutar con supabase db query --file --linked
  create-admin.ts     # crea usuario admin en Supabase Auth + tabla users
  seed.ts             # verifica estado de la DB
```

## Convenciones

### Prisma Client (IMPORTANTE — Prisma 7)
```ts
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// Siempre pasar el adapter:
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

### Server Actions
- Toda mutación usa Server Actions — no API routes salvo excepciones
- Validación con Zod en cada action
- Siempre incluir `agencyId` en queries — NUNCA queries sin tenant filter
```ts
"use server"
export async function createItem(agencyId: string, data: z.infer<typeof schema>) {
  const validated = schema.parse(data)
  return prisma.model.create({ data: { ...validated, agencyId } })
}
```

### Componentes
- Server Components por defecto
- `"use client"` solo cuando necesario (forms, interactividad)
- shadcn usa Base UI internamente: `render={<Link href={href} />}` en lugar de `asChild`
- Grillas: TanStack Table via shadcn DataTable

### Patrón CRUD de módulo (Parámetros como template)
```
app/(dashboard)/[agencySlug]/[modulo]/
  page.tsx           # Server Component — lista + layout
  [id]/
    page.tsx         # detalle/edición
  new/
    page.tsx         # creación
components/
  [modulo]-table.tsx # DataTable con columnas
  [modulo]-form.tsx  # formulario create/edit
actions/
  [modulo].actions.ts
```

## Modelos de Parámetros (schema actual)
- `ServiceProviderType`: code (Int), name, description, active — unique(agencyId, code)
- `ProviderOrigin`: code (String), name, includeExcursion, includeTransfer, isForeign, active — unique(agencyId, code)
- `ClientType`: code (Int), name, active — unique(agencyId, code)
- `PensionRegime`: code (String), name, abbreviation — unique(agencyId, code)
- `RoomType`: code (String), name, abbreviation, capacity, isVoucherComplement, active — unique(agencyId, code)
- `FoodType`: code (String), name, active — unique(agencyId, code)
- `GuideType`: code (String), name, isBilingual — unique(agencyId, code)
- `ReservationOrigin`: letter (String), label, autoNumber, lastNumber — unique(agencyId, letter)
- `ExcursionCode`, `TransferSegment`, `TicketSegment`, `VoucherText`

## Dominio de negocio — conceptos clave

### Reserva
- Identificada por `letter` (letra de ReservationOrigin) + `number` (ej: M67905)
- Estados: TENTATIVE → CONFIRMED → CANCELLED / INVOICED / VOUCHERS_ISSUED
- Compuesta de: Alojamiento, Comidas, Excursiones, Traslados, Tickets, Rentas, Varios

### Prestador vs Proveedor
- **Prestador**: servicio turístico (hotel, excursión, traslado)
- **Proveedor**: vende bienes (librería, combustible) — flag `isSupplier: true`
- Ambos en tabla `Provider` — campos: `fantasyName`, `legalName`, `typeId`, `code` (Int)

### Facturación Argentina
- Factura **A**: cliente RI con CUIT — discrimina IVA
- Factura **B**: Consumidor Final, Monotributista, Exento
- Comprobantes: FA, ND (Nota Débito), NC (Nota Crédito), RC (Recibo)
- Conceptos IVA: GRAVADO (21%), GRAVADO_TRANSPORTE (10.5%), NO_COMPUTABLE, EXENTO, IMPUESTOS

### Vouchers
- **Emisivo**: pasajero presenta al prestador
- **Receptivo**: cuponera por servicio (comidas, excursiones)
- **Texto Libre**: voucher con texto predefinido (tabla VoucherText)

### Caja Diaria
- Cada movimiento genera asiento en caja
- Debe cerrarse diariamente
- Múltiples monedas: Pesos ($) y Dólares (u$s) — cajas separadas

## Comandos útiles
```bash
npm run dev
npm run seed                                              # verificar DB
npx dotenv -e .env.local -- tsx prisma/create-admin.ts   # crear admin
npx supabase db query --file prisma/seed.sql --linked     # insertar datos base
npm run build
```

## Credenciales desarrollo
- Admin: `admin@goraturismo.com.ar` / `Gora2024Admin!`
- URL local: `http://localhost:3000/gora`
