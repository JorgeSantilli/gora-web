import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createGuide } from "@/actions/receptivo.actions";

export default async function NuevoGuiaPage({
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

  const last = await prisma.guide.findFirst({
    where:   { agencyId: agency.id },
    orderBy: { code: "desc" },
    select:  { code: true },
  });
  const nextCode = (last?.code ?? 0) + 1;

  async function handleCreate(formData: FormData) {
    "use server";
    const ag = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (!ag) return;
    await createGuide(ag.id, agencySlug, {
      code:      formData.get("code"),
      name:      formData.get("name"),
      phone:     formData.get("phone") || undefined,
      taxId:     formData.get("taxId") || undefined,
      languages: formData.get("languages") || undefined,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/receptivo?tab=guias`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Guía</h1>
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
            <input name="name" required placeholder="María García"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Teléfono</label>
            <input name="phone" placeholder="261 555 1234"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">CUIL</label>
            <input name="taxId" placeholder="27-12345678-9"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Idiomas (separados por coma)</label>
            <input name="languages" placeholder="Castellano, Inglés, Portugués"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">Guardar</Button>
          <Button variant="outline" render={<Link href={`/${agencySlug}/receptivo?tab=guias`} />}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
