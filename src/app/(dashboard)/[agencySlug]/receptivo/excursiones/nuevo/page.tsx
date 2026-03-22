import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createDailyExcursion } from "@/actions/receptivo.actions";

export default async function NuevaExcursionPage({
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

  const excursionCodes = await prisma.excursionCode.findMany({
    where:   { agencyId: agency.id, active: true },
    orderBy: { code: "asc" },
    select:  { id: true, code: true, name: true },
  });

  const today = new Date().toISOString().split("T")[0];

  async function handleCreate(formData: FormData) {
    "use server";
    const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!ag) return;
    await createDailyExcursion(ag.id, agencySlug, {
      date:           formData.get("date"),
      excursionCodeId: formData.get("excursionCodeId") || undefined,
      time:           formData.get("time") || undefined,
      comments:       formData.get("comments") || undefined,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-md">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/receptivo?tab=excursiones`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Nueva Excursión</h1>
      </div>

      <form action={handleCreate} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Fecha *</label>
          <input name="date" type="date" required defaultValue={today}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo de excursión</label>
          <select name="excursionCodeId"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
            <option value="">Sin código</option>
            {excursionCodes.map((ec) => (
              <option key={ec.id} value={ec.id}>{ec.code} — {ec.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Horario de salida</label>
          <input name="time" type="time"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Comentarios</label>
          <textarea name="comments" rows={2} placeholder="Observaciones..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">Crear excursión</Button>
          <Button variant="outline" render={<Link href={`/${agencySlug}/receptivo?tab=excursiones`} />}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
