import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createDriver } from "@/actions/receptivo.actions";

export default async function NuevoChoferPage({
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

  const last = await prisma.driver.findFirst({
    where:   { agencyId: agency.id },
    orderBy: { code: "desc" },
    select:  { code: true },
  });
  const nextCode = (last?.code ?? 0) + 1;

  async function handleCreate(formData: FormData) {
    "use server";
    const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!ag) return;
    await createDriver(ag.id, agencySlug, {
      code:  formData.get("code"),
      name:  formData.get("name"),
      phone: formData.get("phone") || undefined,
      taxId: formData.get("taxId") || undefined,
      isOwn: formData.get("isOwn") === "true",
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/receptivo?tab=choferes`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Chofer</h1>
      </div>

      <form action={handleCreate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Código *</label>
            <input name="code" type="number" defaultValue={nextCode} required
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Nombre completo *</label>
            <input name="name" required placeholder="Juan Pérez"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Teléfono</label>
            <input name="phone" placeholder="261 555 1234"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">CUIL</label>
            <input name="taxId" placeholder="20-12345678-9"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Tipo</label>
            <select name="isOwn" defaultValue="true"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option value="true">Propio (en relación de dependencia)</option>
              <option value="false">Externo / Tercero</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">Guardar</Button>
          <Button variant="outline" render={<Link href={`/${agencySlug}/receptivo?tab=choferes`} />}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
