import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PaymentOrderForm } from "./payment-order-form";

export default async function NuevaOPPage({
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

  const providers = await prisma.provider.findMany({
    where:   { agencyId: agency.id, active: true },
    orderBy: { fantasyName: "asc" },
    select:  { id: true, fantasyName: true },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8"
          render={<Link href={`/${agencySlug}/ordenes-pago`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Orden de Pago</h1>
          <p className="text-muted-foreground text-sm">Pago a prestador / proveedor</p>
        </div>
      </div>

      <PaymentOrderForm
        agencyId={agency.id}
        agencySlug={agencySlug}
        userName={dbUser?.name ?? user.email ?? ""}
        providers={providers}
      />
    </div>
  );
}
