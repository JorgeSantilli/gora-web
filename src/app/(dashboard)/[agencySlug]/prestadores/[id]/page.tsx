import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ProviderForm } from "@/components/forms/provider-form";

export default async function EditarPrestadorPage({
  params,
}: {
  params: Promise<{ agencySlug: string; id: string }>;
}) {
  const { agencySlug, id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const [provider, serviceProviderTypes, providerOrigins] = await Promise.all([
    prisma.provider.findUnique({ where: { id, agencyId: agency.id } }),
    prisma.serviceProviderType.findMany({
      where: { agencyId: agency.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.providerOrigin.findMany({
      where: { agencyId: agency.id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!provider) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Editar Prestador</h1>
        <p className="text-muted-foreground text-sm">{provider.fantasyName}</p>
      </div>
      <ProviderForm
        agencyId={agency.id}
        agencySlug={agencySlug}
        provider={provider}
        serviceProviderTypes={serviceProviderTypes}
        providerOrigins={providerOrigins}
      />
    </div>
  );
}
