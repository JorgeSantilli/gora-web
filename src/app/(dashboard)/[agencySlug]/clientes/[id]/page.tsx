import { notFound, redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ClientForm } from "@/components/forms/client-form";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ agencySlug: string; id: string }>;
}) {
  const { agencySlug, id } = await params;

  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const [client, clientTypes] = await Promise.all([
    prisma.client.findUnique({ where: { id, agencyId: agency.id } }),
    prisma.clientType.findMany({
      where: { agencyId: agency.id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!client) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Editar Cliente</h1>
        <p className="text-muted-foreground text-sm">{client.fantasyName}</p>
      </div>
      <ClientForm
        agencyId={agency.id}
        agencySlug={agencySlug}
        client={client}
        clientTypes={clientTypes}
      />
    </div>
  );
}
