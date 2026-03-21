import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { VoidInvoiceButton } from "./void-invoice-button";

const TYPE_LABEL: Record<string, string> = {
  FA: "Factura", ND: "Nota de Débito", NC: "Nota de Crédito",
};

const VAT_LABEL: Record<string, string> = {
  GRAVADO:            "Gravado 21%",
  GRAVADO_TRANSPORTE: "Gravado Transporte 10.5%",
  NO_COMPUTABLE:      "No Computable",
  EXENTO:             "Exento",
  IMPUESTOS:          "Impuestos / Tributos",
};

const AUTH_LABEL: Record<string, string> = {
  LOCAL:      "LOCAL (sin CAE)",
  PENDING:    "PENDIENTE",
  AUTHORIZED: "AUTORIZADO",
  REJECTED:   "RECHAZADO",
  FAILED:     "ERROR",
};

function fmt(n: unknown) {
  return parseFloat(String(n)).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatNumber(letter: string, salePoint: number, number: number) {
  return `${letter}-${String(salePoint).padStart(4, "0")}-${String(number).padStart(8, "0")}`;
}

export default async function InvoiceDetailPage({
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

  const invoice = await prisma.invoice.findUnique({
    where: { id, agencyId: agency.id },
    include: {
      client: { select: { fantasyName: true, taxId: true } },
      items:  true,
    },
  });

  if (!invoice) notFound();

  const displayNumber = formatNumber(invoice.letter, invoice.salePoint, invoice.number);
  const curr = invoice.currency === "USD" ? "u$s" : "$";
  const canVoid = !invoice.isVoided && invoice.authorizationStatus !== "AUTHORIZED";
  const canNC = !invoice.isVoided && invoice.type === "FA";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{displayNumber}</h1>
            <Badge variant="outline">{invoice.letter} — {TYPE_LABEL[invoice.type]}</Badge>
            {invoice.isVoided && <Badge variant="destructive">ANULADO</Badge>}
          </div>
          <p className="text-muted-foreground text-sm mt-1">{invoice.client.fantasyName}</p>
        </div>
        <div className="flex gap-2">
          {canNC && (
            <Button variant="outline" render={<Link href={`/${agencySlug}/facturacion/${invoice.id}/nc`} />}>
              Emitir NC
            </Button>
          )}
          {canVoid && (
            <VoidInvoiceButton
              invoiceId={invoice.id}
              agencyId={agency.id}
              agencySlug={agencySlug}
              displayNumber={displayNumber}
            />
          )}
          <Button variant="ghost" render={<Link href={`/${agencySlug}/facturacion`} />}>
            Volver
          </Button>
        </div>
      </div>

      {/* Datos del comprobante */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-md border p-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Fecha</p>
          <p className="font-medium">{fmtDate(invoice.date)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Período</p>
          <p className="font-medium">{fmtDate(invoice.serviceFrom)} — {fmtDate(invoice.serviceTo)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Moneda</p>
          <p className="font-medium">
            {invoice.currency === "USD" ? `Dólares (u$s)` : "Pesos ($)"}
            {invoice.exchangeRate && ` — TC: ${fmt(invoice.exchangeRate)}`}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estado ARCA</p>
          <p className="font-medium">{AUTH_LABEL[invoice.authorizationStatus]}</p>
          {invoice.cae && <p className="font-mono text-xs text-muted-foreground mt-0.5">CAE: {invoice.cae}</p>}
        </div>
        {invoice.clientTaxId && (
          <div>
            <p className="text-xs text-muted-foreground">CUIT receptor</p>
            <p className="font-medium">{invoice.clientTaxId}</p>
          </div>
        )}
        {invoice.clientTaxPosition && (
          <div>
            <p className="text-xs text-muted-foreground">Cond. fiscal receptor</p>
            <p className="font-medium">{invoice.clientTaxPosition}</p>
          </div>
        )}
        {invoice.creditNoteFor && (
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">NC sobre factura</p>
            <Link href={`/${agencySlug}/facturacion/${invoice.creditNoteFor}`} className="text-sm underline font-medium">
              Ver factura original
            </Link>
          </div>
        )}
      </div>

      {/* Ítems */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Ítems</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-52">Concepto IVA</TableHead>
                <TableHead className="w-32 text-right">Neto / Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{item.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {VAT_LABEL[item.vatConcept] ?? item.vatConcept}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {curr} {fmt(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Totales */}
      <div className="rounded-md border p-4 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Resumen de importes</p>
        <div className="space-y-1 text-sm max-w-xs ml-auto">
          {parseFloat(String(invoice.taxableAmount)) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Neto gravado 21%</span>
              <span className="font-mono">{curr} {fmt(invoice.taxableAmount)}</span>
            </div>
          )}
          {parseFloat(String(invoice.transportTaxable)) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Neto gravado 10.5%</span>
              <span className="font-mono">{curr} {fmt(invoice.transportTaxable)}</span>
            </div>
          )}
          {parseFloat(String(invoice.nonComputed)) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">No computable</span>
              <span className="font-mono">{curr} {fmt(invoice.nonComputed)}</span>
            </div>
          )}
          {parseFloat(String(invoice.exempt)) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exento</span>
              <span className="font-mono">{curr} {fmt(invoice.exempt)}</span>
            </div>
          )}
          {invoice.letter === "A" && parseFloat(String(invoice.vatGeneral)) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA 21%</span>
              <span className="font-mono">{curr} {fmt(invoice.vatGeneral)}</span>
            </div>
          )}
          {invoice.letter === "A" && parseFloat(String(invoice.vatTransport)) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA 10.5%</span>
              <span className="font-mono">{curr} {fmt(invoice.vatTransport)}</span>
            </div>
          )}
          {parseFloat(String(invoice.taxes)) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impuestos</span>
              <span className="font-mono">{curr} {fmt(invoice.taxes)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>TOTAL</span>
            <span className="font-mono">{curr} {fmt(invoice.total)}</span>
          </div>
          {parseFloat(String(invoice.balance)) !== parseFloat(String(invoice.total)) && (
            <div className="flex justify-between text-muted-foreground">
              <span>Saldo pendiente</span>
              <span className="font-mono">{curr} {fmt(invoice.balance)}</span>
            </div>
          )}
          {invoice.letter === "B" && (parseFloat(String(invoice.vatGeneral)) + parseFloat(String(invoice.vatTransport))) > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              IVA incluido: {curr} {fmt(parseFloat(String(invoice.vatGeneral)) + parseFloat(String(invoice.vatTransport)))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
