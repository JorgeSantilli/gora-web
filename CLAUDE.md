# GORA-WEB — Sistema de Gestión de Agencia de Viajes

## Contexto del proyecto
Migración del sistema SYS-TUR (Visual FoxPro, ~30 años) a una aplicación web moderna.
Sistema original operativo en Mendoza, Argentina. Empresa: GORA Turismo.
**Multi-tenant**: GORA es el primer tenant (slug `gora`). El sistema escala a múltiples agencias.

## Stack técnico
- **Framework:** Next.js 16 (App Router, TypeScript)
- **Base de datos:** PostgreSQL via Supabase (proyecto: `wfmjdyveqblvtxprhilq`)
- **ORM:** Prisma 7 con `@prisma/adapter-pg` (driver adapter requerido en Prisma 7)
- **UI:** shadcn/ui + Tailwind CSS (Base UI internamente — usa `render` prop, no `asChild`)
- **Auth:** Supabase Auth
- **Deploy:** Vercel + Supabase (pendiente configurar)

## Detalles de infraestructura
- **Pooler host:** `aws-1-us-east-1.pooler.supabase.com` (¡aws-1 no aws-0!)
- **Transaction pooler (app):** puerto 6543, user `postgres.PROJECT_REF`
- **Session pooler (CLI/migrations):** puerto 5432, mismo user
- **Auth proxy:** `src/proxy.ts` — export debe llamarse `proxy` (Next.js 16, no `middleware`)
- **Prisma config:** `prisma.config.ts` maneja la URL (no schema.prisma)
- **Migraciones:** SQL manual en Supabase SQL Editor. Guardar en `prisma/migrations/FECHA_nombre/migration.sql` → `npx prisma generate`. NUNCA usar `migrate dev`/`db push` (cuelga con pooler Supabase).

## Arquitectura multi-tenant
- Cada `Agency` es un tenant independiente
- Todas las tablas tienen `agencyId` (FK a `Agency`)
- Campos configurables por agencia: `taxId` (CUIT), `taxPosition` (RI por defecto), puntos de venta (`SalePoint`), monedas
- El primer tenant: slug `gora`, id `agency_gora_001`
- User model: `id` (cuid propio) + `supabaseId` (UUID de Supabase Auth) — buscar siempre por `supabaseId`

---

## Estado de desarrollo — Módulos

### ✅ Completados (12/15)

| # | Módulo | Rutas | Commit |
|---|--------|-------|--------|
| 1 | **Foundation** | `/login`, layout, sidebar | inicial |
| 2 | **Parámetros** | `/parametros` | - |
| 3 | **Prestadores** | `/prestadores` nuevo/[id] | 0d0956a |
| 4 | **Clientes** | `/clientes` nuevo/[id] | cb5ff0f |
| 5 | **Programas** | `/programas` nuevo/[id] | f090a03 |
| 6 | **Reservas** | `/reservas` nueva/[id] | 1213f77 |
| 7 | **Tarifas y Costos** | `/tarifas` (3 tabs) | 6532f45 |
| 8 | **Facturación** | `/facturacion` nueva/[id]/nc | 2a9bbf6 |
| 9 | **Cajas Diarias** | `/caja` [id] | d8e2532 |
| 10 | **Ingreso de Valores** | `/ingresos` nuevo/[id] | d8e2532 |
| 11 | **Órdenes de Pago** | `/ordenes-pago` nueva/[id] facturas/nueva | df14d89 |
| 12 | **Cuentas Corrientes** | `/cuentas` clientes/[id] prestadores/[id] | 4da5a41 |

### 🚧 Pendientes (3/15)

| # | Módulo | Ruta | Modelos | Complejidad |
|---|--------|------|---------|-------------|
| 13 | **IVA** | `/iva` | Invoice, PurchaseInvoice | Baja (solo reportes) |
| 14 | **Receptivo** | `/receptivo` | Vehicle, Driver, Guide, TransportCompany, DailyTransfer, DailyExcursion | Alta |
| 15 | **Reportes** | `/reportes` | Todos (consultas) | Media |

---

## Módulos pendientes — detalle para implementar

### Módulo 13 — IVA (`/iva`)
**Solo lectura — sin modelos nuevos.**
- Tab "IVA Ventas": listado de `Invoice` filtrado por período (fecha desde/hasta) y punto de venta. Columnas: fecha, número completo (`A-0001-00000001`), cliente, CUIT cliente, posición fiscal, cbteTipo, gravado 21%, gravado 10.5%, no computable, exento, IVA 21%, IVA 10.5%, otros tributos, total. Subtotales por mes.
- Tab "IVA Compras": listado de `PurchaseInvoice` filtrado por período. Columnas: fecha, número, prestador, CUIT, posición fiscal, gravado, no computable, exento, IVA, tributos, total.
- Filtros: período (mes/año o rango libre), tipo (FA/ND/NC), punto de venta (ventas).
- Sin acciones — solo visualización y eventual exportación CSV.
- Modelos: `Invoice` (con `InvoiceItem`), `PurchaseInvoice`. Ningún modelo nuevo.

### Módulo 14 — Receptivo (`/receptivo`)
**Gestión de flota, choferes y guías. Con modelos existentes en schema.**

Modelos disponibles (ya en schema, tablas ya existentes):
- `Vehicle`: id, agencyId, code, description, providerId?, isOwn, plate?, internalCode?, seats?, active, notes. Relaciones: `VehicleExpiry[]`, `DailyExcursionVehicle[]`
- `VehicleExpiry`: vehicleId, type (STRING — VTV, SEGURO, HABILITACIÓN, REVISION), expiresAt, notified
- `Driver`: id, agencyId, code, name, licenseNumber?, licenseExpiry?, active, notes. Relaciones: `DriverExpiry[]`, `DailyTransfer[]`, `DailyExcursionVehicle[]`
- `DriverExpiry`: driverId, type (STRING — LICENCIA, PSICOFISICO, LINTI, SEGURO), expiresAt, notified
- `Guide`: id, agencyId, code, name, languages (String[]), active, notes
- `TransportCompany`: id, agencyId, code, name, contactName?, phone?, email?, active
- `DailyTransfer`: id, agencyId, date, type (IN/OUT/INTERNAL), origin?, destination?, driverId?, vehicleId?, notes, reservationIds (String[])
- `DailyExcursion`: id, agencyId, date, programId?, name, departureTime?, returnTime?, guideId?, notes, reservationIds (String[])
- `DailyExcursionVehicle`: dailyExcursionId, vehicleId, driverId?

Páginas sugeridas:
- `/receptivo` → tabs: Traslados | Excursiones | Vehículos | Choferes | Guías
- `/receptivo/traslados/nuevo` + `/receptivo/traslados/[id]`
- `/receptivo/excursiones/nuevo` + `/receptivo/excursiones/[id]`
- `/receptivo/vehiculos/nuevo` + `/receptivo/vehiculos/[id]` (con vencimientos)
- `/receptivo/choferes/nuevo` + `/receptivo/choferes/[id]` (con vencimientos)
- Alertas de vencimientos próximos en el listado principal

### Módulo 15 — Reportes (`/reportes`)
**Solo lectura — consultas agregadas sobre datos existentes. Sin modelos nuevos.**

Reportes sugeridos (basados en SYS-TUR legacy):
1. **Ocupación hotelera**: reservas por hotel/habitación/período — agrupar `ReservationAccommodation`
2. **Pasajeros por programa**: cantidad de pax por `Program` en un período
3. **Comisiones por cliente**: total facturado por `Client` en un período (sum de `Invoice.total`)
4. **Movimientos de caja**: `CashTransaction` por período/dirección — resumen diario
5. **Facturas pendientes de cobro**: `Invoice` con `balance > 0` — equivalente al legacy "Facturas Pendientes"
6. **Estado de reservas**: cantidad por estado (TENTATIVE/CONFIRMED/etc.) en el período

Estructura sugerida:
- `/reportes` → lista de reportes disponibles con tarjetas
- `/reportes/[slug]` → cada reporte con sus filtros y tabla de resultados
- Sin paginación compleja — take: 500 máximo, exportación CSV simple

---

## Estructura de carpetas actual
```
src/
  app/
    (auth)/           # login
    (dashboard)/
      layout.tsx      # carga dbUser, renderiza AppSidebar
      [agencySlug]/
        page.tsx
        parametros/   ✅
        clientes/     ✅ nuevo/ [id]/
        prestadores/  ✅ nuevo/ [id]/
        programas/    ✅ nuevo/ [id]/
        reservas/     ✅ nueva/ [id]/
        tarifas/      ✅ costos/ ventas/ programas/
        facturacion/  ✅ nueva/ [id]/ [id]/nc/
        caja/         ✅ create-caja-button.tsx [id]/
        ingresos/     ✅ nuevo/ [id]/
        ordenes-pago/ ✅ nueva/ [id]/ facturas/nueva/
        cuentas/      ✅ clientes/[clientId]/ prestadores/[providerId]/
        iva/          🚧 placeholder
        receptivo/    🚧 placeholder
  components/
    ui/               # shadcn/ui (sin tabs — usar URL search params para tabs)
    forms/            # formularios reutilizables
    app-sidebar.tsx   # ya incluye todos los módulos en nav
  lib/
    prisma.ts
    invoice-utils.ts  # getCbteTipo(), getInvoiceLetter(), formatInvoiceNumber()
    supabase/server.ts + client.ts
  actions/
    clientes.actions.ts, prestadores.actions.ts, programas.actions.ts
    reservas.actions.ts, tarifas.actions.ts, facturacion.actions.ts
    caja.actions.ts, ingresos.actions.ts, ordenes-pago.actions.ts
  proxy.ts
prisma/
  schema.prisma       # fuente de verdad
  migrations/         # SQL manual — NO migrate dev
```

---

## Convenciones críticas

### Button + Link (Base UI — NO asChild)
```tsx
<Button render={<Link href={href} />}>Texto</Button>
// Si el render no es <button>, nativeButton se auto-detecta como false en button.tsx
```

### Select (shadcn + Base UI)
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
<Select value={val} onValueChange={(v) => setVal(v ?? "")}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent><SelectItem value="x">Label</SelectItem></SelectContent>
</Select>
```

### Tabs — NO existe componente `tabs` en el proyecto
Usar URL search params (Server Components) o useState (Client Components):
```tsx
// Server Component — URL params
const activeTab = (searchParams.tab as TabKey) ?? "default";
<Link href={`?tab=x`} className={activeTab === "x" ? "border-primary..." : "border-transparent..."}>
```

### Server Actions
- Validación Zod siempre
- NUNCA queries sin `agencyId` (multi-tenant)
- Funciones síncronas helper → `src/lib/` (no en archivos "use server")
- `redirect()` después de mutaciones exitosas
- `revalidatePath()` en todas las mutaciones

### Patrones de datos
- `Decimal` de Prisma → `parseFloat(String(n))` para operar con números
- Saldo corriente en CC: el último `ClientAccountMovement` / `ProviderAccountMovement` tiene el balance actual. Usar `distinct: ["clientId", "currency"]` + `orderBy: { createdAt: "desc" }`.
- Caja abierta hoy: `DailyCash` con `status: "OPEN"` y `date: { gte: today, lt: tomorrow }`

---

## Dominio — conceptos clave

### Facturación Argentina (ARCA-ready)
- **Letra A**: cliente RI → IVA discriminado. `cbteTipo`: FA=1, ND=2, NC=3
- **Letra B**: CF/MO/EX/NC → IVA incluido. `cbteTipo`: FA=6, ND=7, NC=8
- Letra auto por `taxPosition` del cliente; `authorizationStatus` LOCAL por ahora
- **Concepto 2 = Servicios**: requiere `serviceFrom`/`serviceTo` para ARCA
- **Numeración**: `InvoiceSequence` atómica por `(salePointId + letter + type)`
- **Display**: `A-0001-00000001`; recibos `RC-00000001`; OPs `OP-00000001`

### IVA Turismo
- `GRAVADO` 21% → `vatGeneral`; `GRAVADO_TRANSPORTE` 10.5% → `vatTransport`
- `NO_COMPUTABLE` → `nonComputed`; `EXENTO` → `exempt`; `IMPUESTOS` → `taxes`

### Enums clave
- `TaxPosition`: RI | MO | CF | EX | NC
- `Currency`: PESOS | USD
- `DailyCashStatus`: PENDING | OPEN | CLOSED
- `InvoiceLetter`: A | B
- `InvoiceType`: FA | ND | NC
- `AccountMovType`: DEBIT | CREDIT
- `CashDirection`: IN | OUT

### Caja Diaria
- PENDING (acumula movimientos) → OPEN (operador la abre) → CLOSED
- Recibos → `CashTransaction IN`; OPs → `CashTransaction OUT`
- Una por día/moneda; `@@unique([agencyId, date, currency])`

### Cuentas Corrientes
- Clientes: FA/ND = DEBIT; Recibo = CREDIT; balance positivo = cliente debe
- Prestadores: Factura compra = DEBIT; OP = CREDIT; balance positivo = debemos al prestador

---

## Comandos útiles
```bash
npm run dev
npm run build
npx prisma generate    # tras cambios de schema
# Migraciones: SQL manual → Supabase SQL Editor → prisma/migrations/FECHA_nombre/migration.sql
```

## Credenciales desarrollo
- Admin: `admin@goraturismo.com.ar` / `Gora2024Admin!`
- URL local: `http://localhost:3000/gora`
- GitHub: JorgeSantilli/gora-web (branch: master)
