import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { updateGuide } from "@/actions/receptivo.actions";

export default async function GuiaDetailPage({
  params,
}: {
  params: Promise<{ agencySlug: string; guiaId: string }>;
}) {
  const { agencySlug, guiaId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const guide = await prisma.guide.findUnique({
    where: { id: guiaId, agencyId: agency.id },
  });
  if (!guide) redirect(`/${agencySlug}/receptivo?tab=guias`);

  async function handleUpdate(formData: FormData) {
    "use server";
    const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!ag) return;
    await updateGuide(guiaId, ag.id, agencySlug, {
      code:      guide!.code,
      name:      formData.get("name"),
      phone:     formData.get("phone") || undefined,
      taxId:     formData.get("taxId") || undefined,
      languages: formData.get("languages") || undefined,
      active:    formData.get("active") === "true",
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/receptivo?tab=guias`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{guide.name}</h1>
          <p className="text-muted-foreground text-sm">Cód. {guide.code}</p>
        </div>
      </div>

      <form action={handleUpdate} className="space-y-4 border rounded-lg p-4">
        <h2 className="font-semibold text-sm">Datos del guía</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Nombre *</label>
            <input name="name" required defaultValue={guide.name}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Teléfono</label>
            <input name="phone" defaultValue={guide.phone ?? ""}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">CUIL</label>
            <input name="taxId" defaultValue={guide.taxId ?? ""}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Idiomas (separados por coma)</label>
            <input name="languages" defaultValue={guide.languages.join(", ")}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Estado</label>
            <select name="active" defaultValue={guide.active ? "true" : "false"}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        </div>
        <Button type="submit" size="sm">Guardar cambios</Button>
      </form>
    </div>
  );
}
