import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createDailyTransfer } from "@/actions/receptivo.actions";

const TRANSFER_TYPES = [
  { value: "ENTRADA",    label: "Entrada" },
  { value: "SALIDA",     label: "Salida" },
  { value: "CENA_SHOW",  label: "Cena/Show" },
  { value: "CONEXION",   label: "Conexión" },
  { value: "ASISTENCIA", label: "Asistencia" },
];

export default async function NuevoTrasladoPage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}) {
  const { agencySlug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  async function handleCreate(formData: FormData) {
    "use server";
    const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!ag) return;
    await createDailyTransfer(ag.id, agencySlug, {
      date: formData.get("date"),
      type: formData.get("type"),
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-md">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/receptivo?tab=traslados`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Traslado</h1>
      </div>

      <form action={handleCreate} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Fecha *</label>
          <input name="date" type="date" required defaultValue={today}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo *</label>
          <select name="type" required defaultValue="ENTRADA"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
            {TRANSFER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">Crear traslado</Button>
          <Button variant="outline" render={<Link href={`/${agencySlug}/receptivo?tab=traslados`} />}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
