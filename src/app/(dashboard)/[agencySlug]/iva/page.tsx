import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  const v = parseFloat(String(n));
  return isNaN(v) ? "0,00" : v.toLocaleString("es-AR", { minimumFractionDigits: 2 });
}
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0); }
function n(v: unknown) { return parseFloat(String(v)); }

const TYPE_LABEL: Record<string, string> = { FA: "Factura", ND: "Nota Débito", NC: "Nota Crédito" };
const TAX_POS_LABEL: Record<string, string> = { RI: "R.I.", MO: "Monotrib.", CF: "C.F.", EX: "Exento", NC: "No cat." };

const TABS = [
  { key: "ventas",  label: "IVA Ventas" },
  { key: "compras", label: "IVA Compras" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function IvaPage({
  params,
  searchParams,
}: {
  params:       Promise<{ agencySlug: string }>;
  searchParams: Promise<{ tab?: string; desde?: string; hasta?: string; tipo?: string; pv?: string }>;
}) {
  const { agencySlug } = await params;
  const sp = await searchParams;
  const activeTab = (sp.tab as TabKey) ?? "ventas";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  // ── Defaults de período: mes actual ─────────────────────────────────────────
  const now = new Date();
  const defaultDesde = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const defaultHasta = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${lastDay}`;

  const desdeStr = sp.desde ?? defaultDesde;
  const hastaStr = sp.hasta ?? defaultHasta;
  const tipoFilter = sp.tipo ?? "";
  const pvFilter   = sp.pv ?? "";

  const desde = new Date(desdeStr + "T00:00:00");
  const hasta = new Date(hastaStr + "T23:59:59");

  // ── Puntos de venta disponibles ──────────────────────────────────────────────
  const salePoints = await prisma.salePoint.findMany({
    where:   { agencyId: agency.id, active: true },
    orderBy: { number: "asc" },
  });

  // ── Datos IVA Ventas ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ventas: any[] = [];
  if (activeTab === "ventas") {
    ventas = await prisma.invoice.findMany({
      where: {
        agencyId:  agency.id,
        isVoided:  false,
        date:      { gte: desde, lte: hasta },
        ...(tipoFilter ? { type: tipoFilter as "FA" | "ND" | "NC" } : {}),
        ...(pvFilter   ? { salePoint: parseInt(pvFilter) }          : {}),
      },
      include: { client: { select: { fantasyName: true, taxId: true, taxPosition: true } } },
      orderBy: [{ date: "asc" }, { salePoint: "asc" }, { number: "asc" }],
    });
  }

  // ── Datos IVA Compras ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let compras: any[] = [];
  if (activeTab === "compras") {
    compras = await prisma.purchaseInvoice.findMany({
      where: {
        agencyId: agency.id,
        isVoided: false,
        date:     { gte: desde, lte: hasta },
        ...(tipoFilter ? { type: tipoFilter as "FA" | "ND" | "NC" } : {}),
      },
      include: { provider: { select: { fantasyName: true, taxId: true, taxPosition: true } } },
      orderBy: [{ date: "asc" }, { number: "asc" }],
    });
  }

  // ── Totales Ventas ───────────────────────────────────────────────────────────
  const vTotals = {
    taxable:       sum(ventas.map((v) => n(v.taxableAmount))),
    transport:     sum(ventas.map((v) => n(v.transportTaxable))),
    nonComputed:   sum(ventas.map((v) => n(v.nonComputed))),
    exempt:        sum(ventas.map((v) => n(v.exempt))),
    vatGeneral:    sum(ventas.map((v) => n(v.vatGeneral))),
    vatTransport:  sum(ventas.map((v) => n(v.vatTransport))),
    taxes:         sum(ventas.map((v) => n(v.taxes))),
    total:         sum(ventas.map((v) => n(v.total))),
  };

  // ── Totales Compras ──────────────────────────────────────────────────────────
  const cTotals = {
    taxable:     sum(compras.map((c) => n(c.taxable))),
    nonComputed: sum(compras.map((c) => n(c.nonComputed))),
    exempt:      sum(compras.map((c) => n(c.exempt))),
    vat:         sum(compras.map((c) => n(c.vat))),
    taxes:       sum(compras.map((c) => n(c.taxes))),
    total:       sum(compras.map((c) => n(c.total))),
  };

  // ── Build filter URL ─────────────────────────────────────────────────────────
  function filterHref(overrides: Record<string, string>) {
    const q = new URLSearchParams({
      tab:   activeTab,
      desde: desdeStr,
      hasta: hastaStr,
      ...(tipoFilter ? { tipo: tipoFilter } : {}),
      ...(pvFilter   ? { pv: pvFilter }     : {}),
      ...overrides,
    });
    return `/${agencySlug}/iva?${q}`;
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Libro IVA</h1>
        <p className="text-muted-foreground text-sm">Ventas y compras para presentación fiscal</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={filterHref({ tab: t.key })}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Filtros */}
      <form method="GET" action={`/${agencySlug}/iva`} className="flex flex-wrap gap-3 items-end">
        <input type="hidden" name="tab" value={activeTab} />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Desde</label>
          <input
            type="date" name="desde" defaultValue={desdeStr}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Hasta</label>
          <input
            type="date" name="hasta" defaultValue={hastaStr}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Tipo</label>
          <select
            name="tipo" defaultValue={tipoFilter}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Todos</option>
            <option value="FA">Factura</option>
            <option value="ND">Nota de Débito</option>
            <option value="NC">Nota de Crédito</option>
          </select>
        </div>
        {activeTab === "ventas" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Punto de Venta</label>
            <select
              name="pv" defaultValue={pvFilter}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Todos</option>
              {salePoints.map((sp) => (
                <option key={sp.id} value={sp.number}>PV {String(sp.number).padStart(4, "0")}{sp.name ? ` — ${sp.name}` : ""}</option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          Filtrar
        </button>
        <Link
          href={`/${agencySlug}/iva?tab=${activeTab}`}
          className="h-9 px-4 rounded-md border text-sm font-medium flex items-center hover:bg-muted"
        >
          Limpiar
        </Link>
      </form>

      {/* ─── IVA VENTAS ───────────────────────────────────────────────────────── */}
      {activeTab === "ventas" && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Fecha</TableHead>
                <TableHead className="w-28">Comprobante</TableHead>
                <TableHead className="w-16 text-center">Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-28">CUIT</TableHead>
                <TableHead className="w-16 text-center">Cond.</TableHead>
                <TableHead className="w-24 text-right">Grav. 21%</TableHead>
                <TableHead className="w-24 text-right">Grav. 10.5%</TableHead>
                <TableHead className="w-24 text-right">No comp.</TableHead>
                <TableHead className="w-24 text-right">Exento</TableHead>
                <TableHead className="w-24 text-right">IVA 21%</TableHead>
                <TableHead className="w-24 text-right">IVA 10.5%</TableHead>
                <TableHead className="w-24 text-right">Tributos</TableHead>
                <TableHead className="w-28 text-right font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-10 text-muted-foreground">
                    Sin comprobantes en el período seleccionado.
                  </TableCell>
                </TableRow>
              ) : ventas.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-sm">{fmtDate(inv.date)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/${agencySlug}/facturacion/${inv.id}`} className="hover:underline text-primary">
                      {inv.letter}-{String(inv.salePoint).padStart(4,"0")}-{String(inv.number).padStart(8,"0")}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">{TYPE_LABEL[inv.type] ?? inv.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{inv.client.fantasyName}</TableCell>
                  <TableCell className="font-mono text-xs">{inv.clientTaxId ?? inv.client.taxId ?? "—"}</TableCell>
                  <TableCell className="text-center text-xs">
                    {TAX_POS_LABEL[(inv.clientTaxPosition ?? inv.client.taxPosition) as string] ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(inv.taxableAmount)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(inv.transportTaxable)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(inv.nonComputed)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(inv.exempt)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(inv.vatGeneral)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(inv.vatTransport)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(inv.taxes)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">{fmt(inv.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {ventas.length > 0 && (
              <TableFooter>
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={6} className="text-right text-sm">Totales ({ventas.length} comprobantes)</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(vTotals.taxable)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(vTotals.transport)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(vTotals.nonComputed)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(vTotals.exempt)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(vTotals.vatGeneral)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(vTotals.vatTransport)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(vTotals.taxes)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(vTotals.total)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      )}

      {/* ─── IVA COMPRAS ──────────────────────────────────────────────────────── */}
      {activeTab === "compras" && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Fecha</TableHead>
                <TableHead className="w-32">Comprobante</TableHead>
                <TableHead className="w-16 text-center">Tipo</TableHead>
                <TableHead>Prestador</TableHead>
                <TableHead className="w-28">CUIT</TableHead>
                <TableHead className="w-16 text-center">Cond.</TableHead>
                <TableHead className="w-24 text-right">Gravado</TableHead>
                <TableHead className="w-24 text-right">No comp.</TableHead>
                <TableHead className="w-24 text-right">Exento</TableHead>
                <TableHead className="w-24 text-right">IVA</TableHead>
                <TableHead className="w-24 text-right">Tributos</TableHead>
                <TableHead className="w-28 text-right font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                    Sin comprobantes en el período seleccionado.
                  </TableCell>
                </TableRow>
              ) : compras.map((pi) => {
                const provName = pi.provider?.fantasyName ?? pi.providerName ?? "Eventual";
                const provTaxId = pi.providerTaxId ?? pi.provider?.taxId ?? "—";
                const provTaxPos = pi.providerTaxPos ?? pi.provider?.taxPosition;
                return (
                  <TableRow key={pi.id}>
                    <TableCell className="text-sm">{fmtDate(pi.date)}</TableCell>
                    <TableCell className="font-mono text-xs">{pi.number}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">{TYPE_LABEL[pi.type] ?? pi.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{provName}</TableCell>
                    <TableCell className="font-mono text-xs">{provTaxId}</TableCell>
                    <TableCell className="text-center text-xs">
                      {TAX_POS_LABEL[provTaxPos as string] ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(pi.taxable)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(pi.nonComputed)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(pi.exempt)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(pi.vat)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(pi.taxes)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{fmt(pi.total)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            {compras.length > 0 && (
              <TableFooter>
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={6} className="text-right text-sm">Totales ({compras.length} comprobantes)</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(cTotals.taxable)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(cTotals.nonComputed)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(cTotals.exempt)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(cTotals.vat)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(cTotals.taxes)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(cTotals.total)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      )}
    </div>
  );
}
