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
- **Prisma client:** usar `PrismaPg` adapter en cada instancia
- **Migraciones:** usar `prisma generate` + SQL manual en Supabase SQL Editor (el pooler no soporta `migrate dev`/`db push` interactivo). Guardar SQL en `prisma/migrations/FECHA_nombre/migration.sql`

## Arquitectura multi-tenant
- Cada `Agency` es un tenant independiente
- Todas las tablas tienen `agencyId` (FK a `Agency`)
- Campos configurables por agencia: `taxId` (CUIT), `taxPosition` (RI por defecto), puntos de venta (`SalePoint`), monedas
- El primer tenant: slug `gora`, id `agency_gora_001`
- User model: `id` (cuid propio) + `supabaseId` (UUID de Supabase Auth) — buscar siempre por `supabaseId`

## Roles de usuario (3 niveles)
- `ADMIN` — acceso irrestricto, gestión de la agencia
- `OPERATOR_ADMIN` — cajas, créditos, IVA, límites de cuenta, tarifas
- `OPERATOR` — reservas, vouchers, listados operativos

---

## Estado de desarrollo — Módulos

### ✅ Completados (8/15)

| # | Módulo | Rutas | Notas clave |
|---|--------|-------|-------------|
| 1 | **Foundation** | `/login`, layout, sidebar | Auth, multi-tenant, RBAC |
| 2 | **Parámetros** | `/parametros` | 8 tablas de configuración base |
| 3 | **Prestadores** | `/prestadores` nuevo/[id] | Hoteles, restaurants, transportes |
| 4 | **Clientes** | `/clientes` nuevo/[id] | Agencias y pasajeros directos |
| 5 | **Programas** | `/programas` nuevo/[id] | Paquetes con 7 tipos de servicio |
| 6 | **Reservas** | `/reservas` nueva/[id] | Core: 8 servicios + importes + estados + auto-numeración |
| 7 | **Tarifas y Costos** | `/tarifas` (3 tabs) | `details:Json` dinámico por serviceType, ProgramTariff |
| 8 | **Facturación** | `/facturacion` nueva/[id]/nc | FA/ND/NC, letra A/B auto, multi-PV, IVA turismo, ARCA-ready |

### 🚧 Pendientes (7/15) — Prioridad sugerida

| # | Módulo | Prioridad | Dependencias | Complejidad |
|---|--------|-----------|--------------|-------------|
| 9 | **Cajas Diarias** | 🔴 Alta | — | Media |
| 10 | **Ingreso de Valores** | 🔴 Alta | Facturas, Caja | Alta |
| 11 | **Órdenes de Pago** | 🔴 Alta | PurchaseInvoice, Caja | Alta |
| 12 | **Cuentas Corrientes** | 🟡 Media | Recibos, OPs | Media |
| 13 | **IVA** | 🟡 Media | Facturas, PurchaseInvoice | Media (reportes) |
| 14 | **Receptivo** | 🟢 Baja | Vehículos, choferes | Media |
| 15 | **Reportes** | 🟢 Baja | Todos los módulos | Alta |

#### Detalle de pendientes

**Módulo 9 — Cajas Diarias (`/caja`)**
- `DailyCash`: una por día/moneda (PESOS y USD separadas), estados PENDING→OPEN→CLOSED
- `CashTransaction`: asientos de ingreso/egreso con origen/tipo/importe
- Apertura y cierre de caja; visualización de movimientos del día
- Los recibos y OPs generarán asientos automáticos aquí

**Módulo 10 — Ingreso de Valores (`/ingresos`)**
- `Receipt`: recibo de cobro a cliente, vinculado a factura/s y reserva
- `ReceiptItem`: líneas ligando recibo↔factura con importe y moneda
- `Check`: cheques de terceros (recibidos) — número, banco, librador, monto, diferido
- `CurrencyBill`: billetes de moneda extranjera — serie, monto, cliente
- Genera `ClientAccountMovement` (crédito en cc del cliente)
- Genera asiento en `DailyCash` (IN)
- Multi-medio: efectivo + cheques + billetes en un mismo recibo

**Módulo 11 — Órdenes de Pago (`/ordenes-pago`)**
- `PurchaseInvoice`: facturas de compra de prestadores (IVA compras)
- `PaymentOrder`: pago a prestador, vinculado a una o más PurchaseInvoice
- `PaymentOrderItem`: líneas OP↔PurchaseInvoice
- Puede incluir cheques propios emitidos
- Genera `ProviderAccountMovement` (débito en cc del prestador)
- Genera asiento en `DailyCash` (OUT)

**Módulo 12 — Cuentas Corrientes (`/cuentas`)**
- `ClientAccountMovement`: débito (factura) / crédito (recibo) por cliente; saldo acumulado
- `ProviderAccountMovement`: débito (OP/pago) / crédito (nota de crédito) por prestador
- Listado de estado de cuenta por cliente o prestador con saldo actual
- Dependencia directa de módulos 10 y 11

**Módulo 13 — IVA (`/iva`)**
- Libro IVA Ventas: listado de `Invoice` por período (FA/ND/NC) con columnas ARCA
- Libro IVA Compras: listado de `PurchaseInvoice` por período
- Principalmente reportes/exportación; no requiere modelos nuevos
- ARCA-ready: columnas alineadas a RG 4291 (cbteTipo, ImpNeto, ImpIVA, etc.)

**Módulo 14 — Receptivo (`/receptivo`)**
- `Vehicle` + `VehicleExpiry`: vehículos propios/terceros con alertas de vencimiento
- `Driver` + `DriverExpiry`: choferes con carnet/seguro
- `Guide`: guías con idiomas
- `TransportCompany`: empresas de transporte (Resolución)
- `DailyTransfer`: traslados diarios
- `DailyExcursion` + `DailyExcursionVehicle`: excursiones diarias con asignación de vehículo/chofer/guía

**Módulo 15 — Reportes (`/reportes`)**
- Ocupación hotelera por programa/fecha
- Pasajeros por reserva/programa
- Comisiones por cliente/período
- Movimientos de caja por período
- Sin modelos propios — consultas sobre datos existentes

---

## Estructura de carpetas
```
src/
  app/
    (auth)/           # login — sin layout principal
    (dashboard)/      # app protegida con layout
      layout.tsx      # carga dbUser por supabaseId, renderiza AppSidebar
      [agencySlug]/
        page.tsx      # dashboard home
        parametros/   # ✅
        clientes/     # ✅
        prestadores/  # ✅
        programas/    # ✅
        reservas/     # ✅
        tarifas/      # ✅ (costos/ ventas/ programas/)
        facturacion/  # ✅ (nueva/ [id]/ [id]/nc/)
        caja/         # 🚧
        ingresos/     # 🚧
        ordenes-pago/ # 🚧
        cuentas/      # 🚧
        iva/          # 🚧
        receptivo/    # 🚧
  components/
    ui/               # shadcn/ui components (Base UI — render prop pattern)
    forms/            # formularios reutilizables
    app-sidebar.tsx   # sidebar con navegación
  lib/
    prisma.ts         # singleton con PrismaPg adapter
    invoice-utils.ts  # getCbteTipo(), getInvoiceLetter(), formatInvoiceNumber()
    supabase/
      server.ts       # Supabase server client (cookies)
      client.ts       # Supabase browser client
    utils.ts          # cn(), formatCurrency(), formatDate()
  actions/            # Server Actions (mutaciones)
    [module].actions.ts
  proxy.ts            # auth proxy (Next.js 16) — export function proxy
prisma/
  schema.prisma       # fuente de verdad del modelo de datos
  migrations/         # SQL manual aplicado en Supabase SQL Editor
  seed.sql            # datos base
  create-admin.ts     # crea usuario admin
```

## Convenciones

### Prisma Client (IMPORTANTE — Prisma 7)
```ts
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

### Select component (shadcn + Base UI)
```tsx
// CORRECTO — imports separados, NO Select.Trigger
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select value={val} onValueChange={(v) => setVal(v ?? "")}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="x">Label</SelectItem>
  </SelectContent>
</Select>
```

### Button con Link (Base UI — NO asChild)
```tsx
<Button render={<Link href={href} />}>Texto</Button>
```

### Server Actions
- Toda mutación usa Server Actions — no API routes salvo excepciones
- Validación con Zod en cada action
- Siempre incluir `agencyId` en queries — NUNCA queries sin tenant filter
- Funciones helper síncronas NO pueden estar en archivos `"use server"` → usar `src/lib/`

### Patrón relaciones Prisma sin @relation explícita
Algunos FK (ej: `foodTypeId` en `ProgramMeal`) no tienen `@relation` definida en schema.
Solución: cargar arrays de lookup por separado y resolver labels en código:
```ts
meals={program.programMeals.map((m) => ({
  ...m,
  foodTypeName: foodTypes.find((f) => f.id === m.foodTypeId)?.name ?? null,
}))}
```

## Dominio de negocio — conceptos clave

### Reserva
- Identificada por `letter` (letra de ReservationOrigin) + `number` (ej: M67905)
- Estados: TENTATIVE → CONFIRMED → CANCELLED / INVOICED / VOUCHERS_ISSUED
- Compuesta de: Alojamiento (con habitaciones), Comidas, Excursiones, Traslados, Tickets, Rentas, Varios

### Facturación Argentina (ARCA-ready)
- **Letra A**: cliente RI → IVA discriminado. `cbteTipo`: FA=1, ND=2, NC=3
- **Letra B**: CF/MO/EX/NC → IVA incluido. `cbteTipo`: FA=6, ND=7, NC=8
- La letra se determina automáticamente del `taxPosition` del cliente
- **Concepto 2 = Servicios** (turismo): requiere `serviceFrom`/`serviceTo` para ARCA
- **Numeración**: secuencia atómica en `InvoiceSequence` por `(salePointId + letter + type)`
- **Formato display**: `A-0001-00000001` (letra-PV:4-número:8)
- `authorizationStatus`: LOCAL (actual) → PENDING → AUTHORIZED/REJECTED (futuro con ARCA)
- **SalePoint**: multi-PV por agencia; GORA tiene PV 1 creado
- NC siempre sobre FA existente (`creditNoteFor`); reduce `balance` de la FA original
- Anulación local solo si `authorizationStatus !== AUTHORIZED` (ARCA no permite anular CAE)

### IVA Turismo
- `GRAVADO` (21%): base × 0.21 → `vatGeneral`
- `GRAVADO_TRANSPORTE` (10.5%): base × 0.105 → `vatTransport` (aéreo nacional)
- `NO_COMPUTABLE`: no genera IVA → `nonComputed`
- `EXENTO`: operación exenta → `exempt`
- `IMPUESTOS`: otros tributos → `taxes`
- `ImpTotal` ARCA = taxable + transportTaxable + nonComputed + exempt + vatGeneral + vatTransport + taxes

### Caja Diaria
- Una por día/moneda (PESOS y USD separadas)
- Estados: PENDING → OPEN → CLOSED
- Los recibos generan CashTransaction IN; las OPs generan CashTransaction OUT
- Debe cerrarse diariamente antes de generar la del día siguiente

### Cuentas Corrientes
- `ClientAccountMovement`: FA/ND = débito; RC (recibo) = crédito; balance acumulado
- `ProviderAccountMovement`: OP = débito; NC de compra = crédito; balance acumulado

## Comandos útiles
```bash
npm run dev
npm run build
npm run seed                                              # verificar DB
npx dotenv -e .env.local -- tsx prisma/create-admin.ts   # crear admin
npx prisma generate                                       # regenerar client tras cambios de schema
# Migraciones: escribir SQL → aplicar en Supabase SQL Editor → guardar en prisma/migrations/
```

## Credenciales desarrollo
- Admin: `admin@goraturismo.com.ar` / `Gora2024Admin!`
- URL local: `http://localhost:3000/gora`
