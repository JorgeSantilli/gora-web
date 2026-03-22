import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  const v = parseFloat(String(n));
  return isNaN(v) ? "0,00" : v.toLocaleString("es-AR", { minimumFractionDigits: 2 });
}
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const REPORT_TITLES: Record<string, string> = {
  "reservas-estado":     "Estado de Reservas",
  "pasajeros-programa":  "Pasajeros por Programa",
  "facturacion-cliente": "Facturación por Cliente",
  "facturas-pendientes": "Facturas Pendientes de Cobro",
  "movimientos-caja":    "Movimientos de Caja",
  "ocupacion-hotelera":  "Ocupación Hotelera",
};

const STATUS_LABEL: Record<string, string> = {
  TENTATIVE:  "Tentativa",
  CONFIRMED:  "Confirmada",
  CANCELLED:  "Cancelada",
  COMPLETED:  "Completada",
  NO_SHOW:    "No show",
};

const STATUS_VARIANT: Record<string, "outline" | "secondary" | "destructive" | "default"> = {
  TENTATIVE:  "outline",
  CONFIRMED:  "default",
  CANCELLED:  "destructive",
  COMPLETED:  "secondary",
  NO_SHOW:    "outline",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReporteDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ agencySlug: string; reportSlug: string }>;
  searchParams: Promise<{ desde?: string; hasta?: string; currency?: string }>;
}) {
  const { agencySlug, reportSlug } = await params;
  const sp = await searchParams;

  if (!REPORT_TITLES[reportSlug]) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  // ── Período default: mes actual ───────────────────────────────────────────
  const now      = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}-01`;
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const lastDayS = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}-${lastDay}`;

  const desdeStr    = sp.desde ?? firstDay;
  const hastaStr    = sp.hasta ?? lastDayS;
  const currency    = sp.currency ?? "PESOS";

  const desde = new Date(desdeStr + "T00:00:00");
  const hasta = new Date(hastaStr + "T23:59:59");

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTE: reservas-estado
  // ─────────────────────────────────────────────────────────────────────────
  let reservasPorEstado: { status: string; count: number }[] = [];
  if (reportSlug === "reservas-estado") {
    const rows = await prisma.reservation.groupBy({
      by:     ["status"],
      where:  { agencyId: agency.id, createdAt: { gte: desde, lte: hasta } },
      _count: { _all: true },
      orderBy: { _count: { status: "desc" } },
    });
    reservasPorEstado = rows.map((r) => ({ status: r.status, count: r._count._all }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTE: pasajeros-programa
  // ─────────────────────────────────────────────────────────────────────────
  let pasajerosPorPrograma: { programCode: number | null; programId: string | null; adults: number; minors: number; free: number; count: number }[] = [];
  if (reportSlug === "pasajeros-programa") {
    const rows = await prisma.reservation.groupBy({
      by:     ["programId", "programCode"],
      where:  { agencyId: agency.id, createdAt: { gte: desde, lte: hasta } },
      _count: { _all: true },
      _sum:   { adults: true, minors: true, free: true },
      orderBy: { _sum: { adults: "desc" } },
    });
    pasajerosPorPrograma = rows.map((r) => ({
      programCode: r.programCode,
      programId:   r.programId,
      adults:      r._sum.adults ?? 0,
      minors:      r._sum.minors ?? 0,
      free:        r._sum.free ?? 0,
      count:       r._count._all,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTE: facturacion-cliente
  // ─────────────────────────────────────────────────────────────────────────
  let facturacionPorCliente: { clientId: string; clientName: string; total: number; count: number }[] = [];
  if (reportSlug === "facturacion-cliente") {
    const rows = await prisma.invoice.groupBy({
      by:     ["clientId"],
      where:  { agencyId: agency.id, isVoided: false, currency: currency as "PESOS" | "USD", date: { gte: desde, lte: hasta } },
      _sum:   { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: "desc" } },
      take: 200,
    });
    const clientIds = rows.map((r) => r.clientId);
    const clients = await prisma.client.findMany({
      where:  { id: { in: clientIds } },
      select: { id: true, fantasyName: true },
    });
    const clientMap = new Map(clients.map((c) => [c.id, c.fantasyName]));
    facturacionPorCliente = rows.map((r) => ({
      clientId:   r.clientId,
      clientName: clientMap.get(r.clientId) ?? "Desconocido",
      total:      parseFloat(String(r._sum.total ?? 0)),
      count:      r._count._all,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTE: facturas-pendientes
  // ─────────────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let facturasPendientes: any[] = [];
  if (reportSlug === "facturas-pendientes") {
    facturasPendientes = await prisma.invoice.findMany({
      where: {
        agencyId: agency.id,
        isVoided: false,
        currency: currency as "PESOS" | "USD",
        balance:  { gt: 0 },
      },
      include: { client: { select: { fantasyName: true } } },
      orderBy: { date: "desc" },
      take: 500,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTE: movimientos-caja
  // ─────────────────────────────────────────────────────────────────────────
  let movimientosCaja: Awaited<ReturnType<typeof prisma.cashTransaction.findMany>> = [];
  let totalIn = 0, totalOut = 0;
  if (reportSlug === "movimientos-caja") {
    const cashes = await prisma.dailyCash.findMany({
      where:   { agencyId: agency.id, currency: currency as "PESOS" | "USD", date: { gte: desde, lte: hasta } },
      select:  { id: true },
    });
    const cashIds = cashes.map((c) => c.id);
    movimientosCaja = await prisma.cashTransaction.findMany({
      where:   { dailyCashId: { in: cashIds } },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    totalIn  = movimientosCaja.filter((m) => m.direction === "IN").reduce((s, m) => s + parseFloat(String(m.amount)), 0);
    totalOut = movimientosCaja.filter((m) => m.direction === "OUT").reduce((s, m) => s + parseFloat(String(m.amount)), 0);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTE: ocupacion-hotelera
  // ─────────────────────────────────────────────────────────────────────────
  let ocupacionHotelera: { providerId: string; providerName: string; count: number; adults: number }[] = [];
  if (reportSlug === "ocupacion-hotelera") {
    const accomRows = await prisma.reservationAccommodation.findMany({
      where:   { reservation: { agencyId: agency.id, checkIn: { gte: desde, lte: hasta } } },
      include: {
        provider:    { select: { fantasyName: true } },
        reservation: { select: { adults: true } },
      },
      take: 2000,
    });
    const hotelMap = new Map<string, { providerName: string; count: number; adults: number }>();
    for (const acc of accomRows) {
      const key = acc.providerId;
      if (!hotelMap.has(key)) hotelMap.set(key, { providerName: acc.provider?.fantasyName ?? "Desconocido", count: 0, adults: 0 });
      const entry = hotelMap.get(key)!;
      entry.count++;
      entry.adults += acc.reservation.adults;
    }
    ocupacionHotelera = [...hotelMap.entries()].map(([providerId, v]) => ({ providerId, ...v }))
      .sort((a, b) => b.count - a.count);
  }

  const title = REPORT_TITLES[reportSlug];
  const showCurrencyFilter = ["facturacion-cliente", "facturas-pendientes", "movimientos-caja"].includes(reportSlug);
  const showDateFilter = ["reservas-estado", "pasajeros-programa", "facturacion-cliente", "movimientos-caja", "ocupacion-hotelera"].includes(reportSlug);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/reportes`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      </div>

      {/* Filtros */}
      {(showDateFilter || showCurrencyFilter) && (
        <form method="GET" action={`/${agencySlug}/reportes/${reportSlug}`} className="flex flex-wrap gap-3 items-end">
          {showDateFilter && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Desde</label>
                <input type="date" name="desde" defaultValue={desdeStr}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Hasta</label>
                <input type="date" name="hasta" defaultValue={hastaStr}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
              </div>
            </>
          )}
          {showCurrencyFilter && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Moneda</label>
              <select name="currency" defaultValue={currency}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                <option value="PESOS">Pesos</option>
                <option value="USD">USD</option>
              </select>
            </div>
          )}
          <button type="submit"
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            Filtrar
          </button>
          <Link href={`/${agencySlug}/reportes/${reportSlug}`}
            className="h-9 px-4 rounded-md border text-sm font-medium flex items-center hover:bg-muted">
            Limpiar
          </Link>
        </form>
      )}

      {/* ─── RESERVAS ESTADO ────────────────────────────────────────────────────── */}
      {reportSlug === "reservas-estado" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead className="w-32 text-right">Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservasPorEstado.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center py-10 text-muted-foreground">Sin datos en el período.</TableCell></TableRow>
              ) : reservasPorEstado.map((r) => (
                <TableRow key={r.status}>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">{r.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── PASAJEROS PROGRAMA ─────────────────────────────────────────────────── */}
      {reportSlug === "pasajeros-programa" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">Cód.</TableHead>
                <TableHead className="w-20 text-right">Reservas</TableHead>
                <TableHead className="w-24 text-right">Adultos</TableHead>
                <TableHead className="w-20 text-right">Menores</TableHead>
                <TableHead className="w-20 text-right">Free</TableHead>
                <TableHead className="w-24 text-right font-semibold">Total pax</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pasajerosPorPrograma.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Sin datos en el período.</TableCell></TableRow>
              ) : pasajerosPorPrograma.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-center font-mono text-sm">{r.programCode ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">{r.count}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{r.adults}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{r.minors}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{r.free}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{r.adults + r.minors + r.free}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── FACTURACIÓN CLIENTE ────────────────────────────────────────────────── */}
      {reportSlug === "facturacion-cliente" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-24 text-right">Comprobantes</TableHead>
                <TableHead className="w-36 text-right font-semibold">Total facturado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturacionPorCliente.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">Sin datos en el período.</TableCell></TableRow>
              ) : facturacionPorCliente.map((r) => (
                <TableRow key={r.clientId}>
                  <TableCell>
                    <Link href={`/${agencySlug}/cuentas/clientes/${r.clientId}`} className="hover:underline font-medium text-sm">
                      {r.clientName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-sm">{r.count}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{fmt(r.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── FACTURAS PENDIENTES ────────────────────────────────────────────────── */}
      {reportSlug === "facturas-pendientes" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Fecha</TableHead>
                <TableHead className="w-32">Comprobante</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-32 text-right">Total</TableHead>
                <TableHead className="w-32 text-right text-amber-600">Saldo pendiente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturasPendientes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Sin facturas pendientes.</TableCell></TableRow>
              ) : facturasPendientes.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-sm">{fmtDate(inv.date)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/${agencySlug}/facturacion/${inv.id}`} className="hover:underline text-primary">
                      {inv.letter}-{String(inv.salePoint).padStart(4,"0")}-{String(inv.number).padStart(8,"0")}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {inv.client.fantasyName}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(inv.total)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold text-amber-600">{fmt(inv.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── MOVIMIENTOS CAJA ───────────────────────────────────────────────────── */}
      {reportSlug === "movimientos-caja" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-xl font-bold text-green-600 font-mono">{fmt(totalIn)}</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Egresos</p>
              <p className="text-xl font-bold text-red-600 font-mono">{fmt(totalOut)}</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Neto</p>
              <p className={`text-xl font-bold font-mono ${totalIn - totalOut >= 0 ? "text-foreground" : "text-red-600"}`}>{fmt(totalIn - totalOut)}</p>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Tipo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead className="w-32 text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosCaja.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Sin movimientos en el período.</TableCell></TableRow>
                ) : movimientosCaja.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge variant={m.direction === "IN" ? "secondary" : "outline"} className="text-xs">
                        {m.direction === "IN" ? "Ingreso" : "Egreso"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{m.origin}</TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{m.voucherType}</span>
                      {m.voucherNumber && <span className="text-muted-foreground ml-2 font-mono text-xs">{m.voucherNumber}</span>}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm font-semibold ${m.direction === "IN" ? "text-green-600" : "text-red-600"}`}>
                      {fmt(m.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ─── OCUPACIÓN HOTELERA ─────────────────────────────────────────────────── */}
      {reportSlug === "ocupacion-hotelera" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel / Prestador</TableHead>
                <TableHead className="w-32 text-right">Reservas</TableHead>
                <TableHead className="w-32 text-right">Adultos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ocupacionHotelera.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">Sin reservas con alojamiento en el período.</TableCell></TableRow>
              ) : ocupacionHotelera.map((r) => (
                <TableRow key={r.providerId}>
                  <TableCell className="font-medium text-sm">{r.providerName}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{r.count}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{r.adults}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
