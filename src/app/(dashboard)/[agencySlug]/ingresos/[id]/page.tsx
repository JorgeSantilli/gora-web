import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  return parseFloat(String(n)).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function IngresoDetailPage({
  params,
}: {
  params: Promise<{ agencySlug: string; id: string }>;
}) {
  const { agencySlug, id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const receipt = await prisma.receipt.findUnique({
    where:   { id, agencyId: agency.id },
    include: {
      client:       { select: { fantasyName: true, legalName: true } },
      items: {
        include: {
          invoice: {
            select: { letter: true, type: true, salePoint: true, number: true, date: true },
          },
        },
      },
      checks:       true,
      currencyBills: true,
    },
  });
  if (!receipt) redirect(`/${agencySlug}/ingresos`);

  const symbol     = receipt.currency === "USD" ? "u$s" : "$";
  const rcNumber   = `RC-${String(receipt.number).padStart(8, "0")}`;
  const hasChecks  = parseFloat(String(receipt.checkAmount)) > 0;
  const hasCash    = parseFloat(String(receipt.cashAmount)) > 0;
  const method     = hasChecks && hasCash ? "Mixto" : hasChecks ? "Cheques" : "Efectivo";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8"
          render={<Link href={`/${agencySlug}/ingresos`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{rcNumber}</h1>
            <Badge variant="outline">{receipt.currency}</Badge>
            <Badge variant="secondary">{method}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {fmtDate(receipt.date)} · {receipt.client.fantasyName}
            {receipt.createdBy ? ` · Emitido por ${receipt.createdBy}` : ""}
            {receipt.createdAt ? ` · ${fmtDateTime(receipt.createdAt)}` : ""}
          </p>
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Recibido</p>
          <p className="text-2xl font-bold font-mono">{symbol} {fmt(receipt.totalAmount)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-1">Efectivo</p>
          <p className="text-xl font-semibold font-mono">{symbol} {fmt(receipt.cashAmount)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-1">Cheques</p>
          <p className="text-xl font-semibold font-mono">{symbol} {fmt(receipt.checkAmount)}</p>
        </div>
      </div>

      {/* Facturas canceladas */}
      <div>
        <h2 className="text-base font-semibold mb-2">Comprobantes cancelados</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono">Comprobante</TableHead>
                <TableHead className="w-24 text-center">Fecha</TableHead>
                <TableHead className="text-right w-36">Importe cancelado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipt.items.map((item) => {
                const inv = item.invoice;
                const label = `${inv.letter}-${String(inv.salePoint).padStart(4,"0")}-${String(inv.number).padStart(8,"0")}`;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{label}</TableCell>
                    <TableCell className="text-center text-sm">{fmtDate(inv.date)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{symbol} {fmt(item.amount)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Cheques */}
      {receipt.checks.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-2">Cheques recibidos</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Librador</TableHead>
                  <TableHead className="w-24 text-center">Emisión</TableHead>
                  <TableHead className="w-24 text-center">Vto/Cobro</TableHead>
                  <TableHead className="text-center w-20">Cartera</TableHead>
                  <TableHead className="text-right w-32">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.checks.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm">{c.number}</TableCell>
                    <TableCell className="text-sm">{c.bank ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.drawer ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{c.issuedAt ? fmtDate(c.issuedAt) : "—"}</TableCell>
                    <TableCell className="text-center text-sm">{c.deferredDate ? fmtDate(c.deferredDate) : "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={c.inPortfolio ? "default" : "secondary"} className="text-xs">
                        {c.inPortfolio ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{symbol} {fmt(c.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Billetes */}
      {receipt.currencyBills.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-2">Billetes recibidos</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serie</TableHead>
                  <TableHead>Entregado por</TableHead>
                  <TableHead className="text-right w-32">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.currencyBills.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-sm">{b.serialNumber}</TableCell>
                    <TableCell className="text-sm">{b.deliveredBy ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">u$s {fmt(b.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
