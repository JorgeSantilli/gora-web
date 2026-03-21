import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = { FA: "Factura", ND: "Nota de Débito", NC: "Nota de Crédito" };

const AUTH_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOCAL:      { label: "LOCAL",      variant: "secondary" },
  AUTHORIZED: { label: "AUTORIZADO", variant: "default" },
  REJECTED:   { label: "RECHAZADO",  variant: "destructive" },
  FAILED:     { label: "ERROR",      variant: "destructive" },
  PENDING:    { label: "PENDIENTE",  variant: "outline" },
};

function formatNumber(letter: string, salePoint: number, number: number) {
  return `${letter}-${String(salePoint).padStart(4, "0")}-${String(number).padStart(8, "0")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  return parseFloat(String(n)).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const TABS = [
  { key: "todas",   label: "Todas" },
  { key: "facturas", label: "Facturas" },
  { key: "nc",      label: "Notas de Crédito" },
  { key: "nd",      label: "Notas de Débito" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FacturacionPage({
  params,
  searchParams,
}: {
  params:       Promise<{ agencySlug: string }>;
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { agencySlug } = await params;
  const { tab, q }     = await searchParams;
  const activeTab      = (TABS.find((t) => t.key === tab)?.key) ?? "todas";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const typeFilter = activeTab === "facturas" ? { type: "FA" as const }
                   : activeTab === "nc" ?       { type: "NC" as const }
                   : activeTab === "nd" ?       { type: "ND" as const }
                   : undefined;

  const invoices = await prisma.invoice.findMany({
    where: {
      agencyId: agency.id,
      ...(typeFilter ?? {}),
      ...(q ? {
        OR: [
          { client: { fantasyName: { contains: q, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      client: { select: { fantasyName: true } },
    },
    orderBy: [{ date: "desc" }, { number: "desc" }],
    take: 300,
  });

  const hasActiveSalePoints = await prisma.salePoint.findFirst({
    where: { agencyId: agency.id, active: true },
  });

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturación</h1>
          <p className="text-muted-foreground text-sm">Facturas, notas de crédito y débito</p>
        </div>
        {hasActiveSalePoints ? (
          <Button render={<Link href={`/${agencySlug}/facturacion/nueva`} />}>
            <Plus className="h-4 w-4 mr-2" />Nuevo Comprobante
          </Button>
        ) : (
          <Button variant="outline" disabled title="Configure al menos un punto de venta en Parámetros">
            <Plus className="h-4 w-4 mr-2" />Nuevo Comprobante
          </Button>
        )}
      </div>

      {/* Alerta si no hay PVs */}
      {!hasActiveSalePoints && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm">
          Configure al menos un{" "}
          <Link href={`/${agencySlug}/parametros`} className="underline font-medium">
            Punto de Venta
          </Link>{" "}
          en Parámetros antes de emitir comprobantes.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/${agencySlug}/facturacion?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Número</TableHead>
              <TableHead className="w-24 text-center">Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="w-28">Tipo</TableHead>
              <TableHead className="w-24 text-right">Total</TableHead>
              <TableHead className="w-24 text-right">Saldo</TableHead>
              <TableHead className="w-24 text-center">Estado</TableHead>
              <TableHead className="w-12 text-center">Acc.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No hay comprobantes.{" "}
                  {hasActiveSalePoints && (
                    <Link href={`/${agencySlug}/facturacion/nueva`} className="underline">
                      Emitir el primero
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ) : invoices.map((inv) => {
              const { label: authLabel, variant: authVariant } = AUTH_BADGE[inv.authorizationStatus] ?? AUTH_BADGE.LOCAL;
              return (
                <TableRow key={inv.id} className={inv.isVoided ? "opacity-50 line-through" : undefined}>
                  <TableCell className="font-mono text-sm font-medium">
                    {formatNumber(inv.letter, inv.salePoint, inv.number)}
                  </TableCell>
                  <TableCell className="text-center text-sm">{fmtDate(inv.date)}</TableCell>
                  <TableCell className="text-sm">{inv.client.fantasyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {inv.letter} — {TYPE_LABEL[inv.type] ?? inv.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {inv.currency === "USD" ? "u$s" : "$"} {fmt(inv.total)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {inv.currency === "USD" ? "u$s" : "$"} {fmt(inv.balance)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={authVariant} className="text-xs">
                      {inv.isVoided ? "ANULADO" : authLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="icon" variant="ghost" className="h-8 w-8"
                      render={<Link href={`/${agencySlug}/facturacion/${inv.id}`} />}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
