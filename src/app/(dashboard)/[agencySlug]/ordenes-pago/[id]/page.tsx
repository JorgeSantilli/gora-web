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

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  CHEQUES:  "Cheques",
  MIXTO:    "Mixto",
};

export default async function OPDetailPage({
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

  const op = await prisma.paymentOrder.findUnique({
    where:   { id, agencyId: agency.id },
    include: {
      provider: { select: { fantasyName: true } },
      items: {
        include: {
          purchaseInvoice: {
            select: { type: true, number: true, date: true },
          },
        },
      },
      checks: true,
    },
  });
  if (!op) redirect(`/${agencySlug}/ordenes-pago`);

  const symbol   = op.currency === "USD" ? "u$s" : "$";
  const opNumber = `OP-${String(op.number).padStart(8, "0")}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8"
          render={<Link href={`/${agencySlug}/ordenes-pago`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{opNumber}</h1>
            <Badge variant="outline">{op.currency}</Badge>
            <Badge variant="secondary">{METHOD_LABEL[op.paymentMethod]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {fmtDate(op.date)} · {op.provider.fantasyName}
            {op.createdBy ? ` · Emitida por ${op.createdBy}` : ""}
            {op.createdAt ? ` · ${fmtDateTime(op.createdAt)}` : ""}
          </p>
          {op.concept && (
            <p className="text-sm mt-1 italic">&ldquo;{op.concept}&rdquo;</p>
          )}
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Pagado</p>
          <p className="text-2xl font-bold font-mono">{symbol} {fmt(op.totalAmount)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-1">Efectivo</p>
          <p className="text-xl font-semibold font-mono">{symbol} {fmt(op.cashAmount)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-1">Cheques</p>
          <p className="text-xl font-semibold font-mono">{symbol} {fmt(op.checkAmount)}</p>
        </div>
      </div>

      {/* Facturas canceladas */}
      <div>
        <h2 className="text-base font-semibold mb-2">Facturas canceladas</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead className="w-24 text-center">Fecha</TableHead>
                <TableHead className="text-right w-36">Importe pagado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {op.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">
                    {item.purchaseInvoice.type}-{item.purchaseInvoice.number}
                  </TableCell>
                  <TableCell className="text-center text-sm">{fmtDate(item.purchaseInvoice.date)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{symbol} {fmt(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Cheques emitidos */}
      {op.checks.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-2">Cheques emitidos</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Beneficiario</TableHead>
                  <TableHead className="w-24 text-center">Emisión</TableHead>
                  <TableHead className="w-24 text-center">Diferido</TableHead>
                  <TableHead className="text-right w-32">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {op.checks.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm">{c.number}</TableCell>
                    <TableCell className="text-sm">{c.bank ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.beneficiary ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{c.issuedAt ? fmtDate(c.issuedAt) : "—"}</TableCell>
                    <TableCell className="text-center text-sm">{c.deferredDate ? fmtDate(c.deferredDate) : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{symbol} {fmt(c.amount)}</TableCell>
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
