import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ReceiptForm } from "./receipt-form";

export default async function NuevoIngresoPage({
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

  const dbUser = await prisma.user.findFirst({ where: { supabaseId: user.id } });

  // Clientes activos
  const clients = await prisma.client.findMany({
    where:   { agencyId: agency.id, active: true },
    orderBy: { fantasyName: "asc" },
    select:  { id: true, fantasyName: true, legalName: true },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8"
          render={<Link href={`/${agencySlug}/ingresos`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Recibo</h1>
          <p className="text-muted-foreground text-sm">Ingreso de valores — cobro a cliente</p>
        </div>
      </div>

      <ReceiptForm
        agencyId={agency.id}
        agencySlug={agencySlug}
        userName={dbUser?.name ?? user.email ?? ""}
        clients={clients}
      />
    </div>
  );
}
