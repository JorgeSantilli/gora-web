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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  return parseFloat(String(n)).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  CHEQUES:  "Cheques",
  MIXTO:    "Mixto",
};

export default async function IngresosPage({
  params,
  searchParams,
}: {
  params:       Promise<{ agencySlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { agencySlug } = await params;
  const { q }          = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const receipts = await prisma.receipt.findMany({
    where: {
      agencyId: agency.id,
      ...(q ? {
        client: { fantasyName: { contains: q, mode: "insensitive" } },
      } : {}),
    },
    include: {
      client: { select: { fantasyName: true } },
    },
    orderBy: [{ date: "desc" }, { number: "desc" }],
    take:    300,
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ingreso de Valores</h1>
          <p className="text-muted-foreground text-sm">Recibos de cobro a clientes</p>
        </div>
        <Button render={<Link href={`/${agencySlug}/ingresos/nuevo`} />}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Recibo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 font-mono">Nro.</TableHead>
              <TableHead className="w-24 text-center">Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="w-20">Moneda</TableHead>
              <TableHead className="w-32 text-right">Total</TableHead>
              <TableHead className="w-24">Forma</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No hay recibos.{" "}
                  <Link href={`/${agencySlug}/ingresos/nuevo`} className="underline">
                    Emitir el primero
                  </Link>
                </TableCell>
              </TableRow>
            ) : receipts.map((rc) => {
              const hasChecks = parseFloat(String(rc.checkAmount)) > 0;
              const hasCash   = parseFloat(String(rc.cashAmount)) > 0;
              const method    = hasChecks && hasCash ? "MIXTO" : hasChecks ? "CHEQUES" : "EFECTIVO";
              const symbol    = rc.currency === "USD" ? "u$s" : "$";
              return (
                <TableRow key={rc.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    RC-{String(rc.number).padStart(8, "0")}
                  </TableCell>
                  <TableCell className="text-center text-sm">{fmtDate(rc.date)}</TableCell>
                  <TableCell className="text-sm">{rc.client.fantasyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{rc.currency}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {symbol} {fmt(rc.totalAmount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {METHOD_LABEL[method]}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8"
                      render={<Link href={`/${agencySlug}/ingresos/${rc.id}`} />}>
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
