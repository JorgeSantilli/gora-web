import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deleteDailyTransfer } from "@/actions/receptivo.actions";

const TRANSFER_LABEL: Record<string, string> = {
  ENTRADA:   "Entrada",
  SALIDA:    "Salida",
  CENA_SHOW: "Cena/Show",
  CONEXION:  "Conexión",
  ASISTENCIA: "Asistencia",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function TrasladoDetailPage({
  params,
}: {
  params: Promise<{ agencySlug: string; trasladoId: string }>;
}) {
  const { agencySlug, trasladoId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const transfer = await prisma.dailyTransfer.findUnique({
    where: { id: trasladoId, agencyId: agency.id },
  });
  if (!transfer) redirect(`/${agencySlug}/receptivo?tab=traslados`);

  async function handleDelete() {
    "use server";
    const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!ag) return;
    await deleteDailyTransfer(trasladoId, ag.id, agencySlug);
  }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/receptivo?tab=traslados`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Traslado — {fmtDate(transfer.date)}</h1>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Fecha</span>
          <span className="text-sm font-medium">{fmtDate(transfer.date)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tipo</span>
          <Badge variant="outline">{TRANSFER_LABEL[transfer.type] ?? transfer.type}</Badge>
        </div>
      </div>

      <form action={handleDelete}>
        <Button type="submit" variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-1" />Eliminar traslado
        </Button>
      </form>
    </div>
  );
}
