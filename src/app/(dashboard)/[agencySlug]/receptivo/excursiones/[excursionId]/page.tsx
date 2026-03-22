import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Trash2 } from "lucide-react";
import { updateDailyExcursion, addExcursionVehicle, removeExcursionVehicle } from "@/actions/receptivo.actions";

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function ExcursionDetailPage({
  params,
}: {
  params: Promise<{ agencySlug: string; excursionId: string }>;
}) {
  const { agencySlug, excursionId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const [excursion, excursionCodes, vehicles, drivers, guides] = await Promise.all([
    prisma.dailyExcursion.findUnique({
      where:   { id: excursionId, agencyId: agency.id },
      include: {
        vehicles: {
          include: {
            vehicle:          { select: { description: true, plate: true } },
            transportCompany: { select: { name: true } },
          },
        },
      },
    }),
    prisma.excursionCode.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.vehicle.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { code: "asc" }, select: { id: true, code: true, description: true } }),
    prisma.driver.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.guide.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
  ]);

  if (!excursion) redirect(`/${agencySlug}/receptivo?tab=excursiones`);

  const dateStr = excursion.date.toISOString().split("T")[0];

  async function handleUpdate(formData: FormData) {
    "use server";
    const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!ag) return;
    await updateDailyExcursion(excursionId, ag.id, agencySlug, {
      date:           formData.get("date"),
      excursionCodeId: formData.get("excursionCodeId") || undefined,
      time:           formData.get("time") || undefined,
      comments:       formData.get("comments") || undefined,
    });
  }

  async function handleAddVehicle(formData: FormData) {
    "use server";
    const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!ag) return;
    await addExcursionVehicle(excursionId, ag.id, agencySlug, {
      vehicleId: formData.get("vehicleId") as string || undefined,
      driverId:  formData.get("driverId")  as string || undefined,
      guideId:   formData.get("guideId")   as string || undefined,
      copies:    Number(formData.get("copies")) || 1,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/receptivo?tab=excursiones`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Excursión — {fmtDate(excursion.date)}</h1>
          {excursion.time && <p className="text-sm text-muted-foreground">Salida: {excursion.time}</p>}
        </div>
      </div>

      {/* Editar datos */}
      <form action={handleUpdate} className="space-y-4 border rounded-lg p-4">
        <h2 className="font-semibold text-sm">Datos de la excursión</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha *</label>
            <input name="date" type="date" required defaultValue={dateStr}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Horario</label>
            <input name="time" type="time" defaultValue={excursion.time ?? ""}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Tipo de excursión</label>
            <select name="excursionCodeId" defaultValue={excursion.excursionCodeId ?? ""}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option value="">Sin código</option>
              {excursionCodes.map((ec) => (
                <option key={ec.id} value={ec.id}>{ec.code} — {ec.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Comentarios</label>
            <textarea name="comments" rows={2} defaultValue={excursion.comments ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" />
          </div>
        </div>
        <Button type="submit" size="sm">Guardar cambios</Button>
      </form>

      {/* Vehículos asignados */}
      <div className="space-y-3">
        <h2 className="font-semibold">Vehículos asignados</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehículo</TableHead>
                <TableHead>Chofer</TableHead>
                <TableHead>Guía</TableHead>
                <TableHead className="w-16 text-center">Copias</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {excursion.vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                    Sin vehículos asignados.
                  </TableCell>
                </TableRow>
              ) : excursion.vehicles.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="text-sm">
                    {ev.vehicle?.description ?? ev.transportCompany?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ev.driverId ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ev.guideId ?? "—"}</TableCell>
                  <TableCell className="text-center text-sm">{ev.copies}</TableCell>
                  <TableCell>
                    <form action={async () => {
                      "use server";
                      const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
                      if (!ag) return;
                      await removeExcursionVehicle(ev.id, excursionId, ag.id, agencySlug);
                    }}>
                      <button type="submit" className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Agregar vehículo */}
        <form action={handleAddVehicle} className="grid grid-cols-4 gap-2 items-end">
          <div className="space-y-1 col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Vehículo</label>
            <select name="vehicleId"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option value="">— Vehículo —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.code} — {v.description}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Chofer</label>
            <select name="driverId"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option value="">— Chofer —</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Guía</label>
            <select name="guideId"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option value="">— Guía —</option>
              {guides.map((g) => <option key={g.id} value={g.id}>{g.code} — {g.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Copias</label>
            <input name="copies" type="number" defaultValue={1} min={1}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="col-span-4">
            <Button type="submit" size="sm" variant="outline">Agregar vehículo</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
