import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ProgramForm } from "@/components/forms/program-form";

export default async function NuevoProgramaPage({
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

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nuevo Programa</h1>
        <p className="text-muted-foreground text-sm">
          Creá el encabezado y luego agregá los servicios desde la edición
        </p>
      </div>
      <ProgramForm agencyId={agency.id} agencySlug={agencySlug} />
    </div>
  );
}
