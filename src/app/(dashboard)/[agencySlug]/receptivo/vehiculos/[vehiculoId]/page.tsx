import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Trash2 } from "lucide-react";
import { updateVehicle, addVehicleExpiry, deleteVehicleExpiry } from "@/actions/receptivo.actions";

function daysUntil(d: Date) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function VehiculoDetailPage({
  params,
}: {
  params: Promise<{ agencySlug: string; vehiculoId: string }>;
}) {
  const { agencySlug, vehiculoId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const vehicle = await prisma.vehicle.findUnique({
    where:   { id: vehiculoId, agencyId: agency.id },
    include: { expiries: { orderBy: { expiresAt: "asc" } } },
  });
  if (!vehicle) redirect(`/${agencySlug}/receptivo?tab=vehiculos`);

  async function handleUpdate(formData: FormData) {
    "use server";
    const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!ag) return;
    await updateVehicle(vehiculoId, ag.id, agencySlug, {
      code:        vehicle!.code,
      description: formData.get("description"),
      plate:       formData.get("plate") || undefined,
      seats:       formData.get("seats") || undefined,
      isOwn:       formData.get("isOwn") === "true",
      active:      formData.get("active") === "true",
      notes:       formData.get("notes") || undefined,
    });
  }

  async function handleAddExpiry(formData: FormData) {
    "use server";
    const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!ag) return;
    await addVehicleExpiry(vehiculoId, ag.id, agencySlug, vehiculoId, {
      concept:   formData.get("concept"),
      expiresAt: formData.get("expiresAt"),
      alertDays: formData.get("alertDays") || 30,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/receptivo?tab=vehiculos`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{vehicle.description}</h1>
          <p className="text-muted-foreground text-sm">Cód. {vehicle.code}{vehicle.plate ? ` · ${vehicle.plate}` : ""}</p>
        </div>
      </div>

      {/* Formulario de edición */}
      <form action={handleUpdate} className="space-y-4 border rounded-lg p-4">
        <h2 className="font-semibold text-sm">Datos del vehículo</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Descripción *</label>
            <input name="description" required defaultValue={vehicle.description}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Dominio</label>
            <input name="plate" defaultValue={vehicle.plate ?? ""}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Asientos</label>
            <input name="seats" type="number" defaultValue={vehicle.seats ?? ""}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tipo</label>
            <select name="isOwn" defaultValue={vehicle.isOwn ? "true" : "false"}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option value="true">Propio</option>
              <option value="false">De tercero</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Estado</label>
            <select name="active" defaultValue={vehicle.active ? "true" : "false"}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Notas</label>
            <textarea name="notes" rows={2} defaultValue={vehicle.notes ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" />
          </div>
        </div>
        <Button type="submit" size="sm">Guardar cambios</Button>
      </form>

      {/* Vencimientos */}
      <div className="space-y-3">
        <h2 className="font-semibold">Vencimientos</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="w-32">Vencimiento</TableHead>
                <TableHead className="w-24 text-center">Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.expiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                    Sin vencimientos cargados.
                  </TableCell>
                </TableRow>
              ) : vehicle.expiries.map((exp) => {
                const days = daysUntil(exp.expiresAt);
                return (
                  <TableRow key={exp.id}>
                    <TableCell className="text-sm">{exp.concept}</TableCell>
                    <TableCell className="text-sm">{fmtDate(exp.expiresAt)}</TableCell>
                    <TableCell className="text-center">
                      {days < 0
                        ? <Badge variant="destructive" className="text-xs">Vencido</Badge>
                        : days <= 30
                          ? <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">{days}d</Badge>
                          : <Badge variant="secondary" className="text-xs">{days}d</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      <form action={async () => {
                        "use server";
                        const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
                        if (!ag) return;
                        await deleteVehicleExpiry(exp.id, ag.id, agencySlug, vehiculoId);
                      }}>
                        <button type="submit" className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Agregar vencimiento */}
        <form action={handleAddExpiry} className="flex gap-2 items-end">
          <div className="space-y-1 flex-1">
            <label className="text-xs font-medium text-muted-foreground">Concepto</label>
            <input name="concept" required placeholder="TÉCNICA PROVINCIAL"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Vencimiento</label>
            <input name="expiresAt" type="date" required
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1 w-24">
            <label className="text-xs font-medium text-muted-foreground">Alerta (días)</label>
            <input name="alertDays" type="number" defaultValue={30}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <Button type="submit" size="sm" variant="outline">Agregar</Button>
        </form>
      </div>
    </div>
  );
}
