import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pencil } from "lucide-react";
import { ReservationForm } from "@/components/forms/reservation-form";
import { ReservationServices } from "@/components/forms/reservation-services";
import { ReservationAmounts } from "@/components/forms/reservation-amounts";
import { ReservationStatusActions } from "@/components/forms/reservation-status-actions";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  TENTATIVE:       { label: "Tentativa",      variant: "secondary" },
  CONFIRMED:       { label: "Confirmada",     variant: "default" },
  CANCELLED:       { label: "Cancelada",      variant: "destructive" },
  INVOICED:        { label: "Facturada",      variant: "outline" },
  VOUCHERS_ISSUED: { label: "Vouchers emit.", variant: "outline" },
};

export default async function ReservaDetailPage({
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

  // Load db user for confirmedBy
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { name: true, email: true },
  });
  const currentUserName = dbUser?.name ?? dbUser?.email ?? user.email ?? "Usuario";

  const [reservation, clients, programs, providers, roomTypes, foodTypes, excursionCodes, transferSegments, ticketSegments, pensionRegimes] =
    await Promise.all([
      prisma.reservation.findUnique({
        where: { id, agencyId: agency.id },
        include: {
          client: { select: { fantasyName: true } },
          program: { select: { code: true, name: true } },
          passengers: { orderBy: { order: "asc" } },
          accommodations: {
            include: {
              provider: { select: { id: true, fantasyName: true } },
              rooms: true,
            },
            orderBy: { checkIn: "asc" },
          },
          meals: {
            include: { provider: { select: { id: true, fantasyName: true } } },
          },
          excursions: {
            include: { provider: { select: { id: true, fantasyName: true } } },
            orderBy: { date: "asc" },
          },
          transfers: {
            include: { provider: { select: { id: true, fantasyName: true } } },
            orderBy: { date: "asc" },
          },
          tickets: {
            include: { provider: { select: { id: true, fantasyName: true } } },
            orderBy: { date: "asc" },
          },
          rentals: {
            include: { provider: { select: { id: true, fantasyName: true } } },
          },
          miscs: {
            include: { provider: { select: { id: true, fantasyName: true } } },
          },
        },
      }),
      prisma.client.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { fantasyName: "asc" },
      }),
      prisma.program.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { name: "asc" },
      }),
      prisma.provider.findMany({
        where: { agencyId: agency.id, active: true },
        select: { id: true, fantasyName: true },
        orderBy: { fantasyName: "asc" },
      }),
      prisma.roomType.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { name: "asc" },
      }),
      prisma.foodType.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { name: "asc" },
      }),
      prisma.excursionCode.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { code: "asc" },
      }),
      prisma.transferSegment.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { code: "asc" },
      }),
      prisma.ticketSegment.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { code: "asc" },
      }),
      prisma.pensionRegime.findMany({
        where: { agencyId: agency.id },
        orderBy: { name: "asc" },
      }),
    ]);

  if (!reservation) notFound();

  const st = STATUS_LABELS[reservation.status] ?? { label: reservation.status, variant: "secondary" as const };

  const fmt = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">
              {reservation.origin}{reservation.number}
            </h1>
            <Badge variant={st.variant}>{st.label}</Badge>
            <span className="text-muted-foreground text-sm">
              {reservation.currency === "USD" ? "u$s" : "$"}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Titular: <span className="font-medium text-foreground">{reservation.leadPax}</span>
            {" · "}
            {reservation.adults}A{reservation.minors > 0 ? ` ${reservation.minors}M` : ""}
            {reservation.free > 0 ? ` ${reservation.free}G` : ""}
            {reservation.client && <> · {reservation.client.fantasyName}</>}
          </p>
          {(reservation.checkIn || reservation.checkOut) && (
            <p className="text-sm text-muted-foreground">
              {fmt(reservation.checkIn)} → {fmt(reservation.checkOut)}
              {reservation.inMedium && <> · Entra: {reservation.inMedium}{reservation.inTime && ` ${reservation.inTime}`}</>}
              {reservation.outMedium && <> · Sale: {reservation.outMedium}{reservation.outTime && ` ${reservation.outTime}`}</>}
            </p>
          )}
          {reservation.expiresAt && reservation.status === "TENTATIVE" && (
            <p className="text-xs text-amber-600">
              Vence: {fmt(reservation.expiresAt)}
            </p>
          )}
          {reservation.confirmedAt && (
            <p className="text-xs text-muted-foreground">
              Confirmada el {fmt(reservation.confirmedAt)}{reservation.confirmedBy && ` por ${reservation.confirmedBy}`}
            </p>
          )}
        </div>
        <ReservationStatusActions
          reservationId={reservation.id}
          agencyId={agency.id}
          agencySlug={agencySlug}
          status={reservation.status}
          currentUserName={currentUserName}
        />
      </div>

      <Separator />

      {/* Layout 2 col */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">

        {/* Columna izquierda: encabezado editable */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Encabezado</h2>
          </div>
          <ReservationForm
            agencyId={agency.id}
            agencySlug={agencySlug}
            reservation={reservation}
            origins={[]}
            clients={clients}
            programs={programs}
          />

          <Separator />

          {/* Importes */}
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Importes</h2>
            <ReservationAmounts
              reservationId={reservation.id}
              agencyId={agency.id}
              agencySlug={agencySlug}
              currency={reservation.currency as "PESOS" | "USD"}
              totalAmount={reservation.totalAmount ? Number(reservation.totalAmount) : null}
              taxableAmount={reservation.taxableAmount ? Number(reservation.taxableAmount) : null}
              transportTaxableAmount={reservation.transportTaxableAmount ? Number(reservation.transportTaxableAmount) : null}
              nonComputedAmount={reservation.nonComputedAmount ? Number(reservation.nonComputedAmount) : null}
              exemptAmount={reservation.exemptAmount ? Number(reservation.exemptAmount) : null}
              vatGeneral={reservation.vatGeneral ? Number(reservation.vatGeneral) : null}
              vatTransport={reservation.vatTransport ? Number(reservation.vatTransport) : null}
              taxes={reservation.taxes ? Number(reservation.taxes) : null}
              agencyCommissionAmount={reservation.agencyCommissionAmount ? Number(reservation.agencyCommissionAmount) : null}
              netAmount={reservation.netAmount ? Number(reservation.netAmount) : null}
              totalInvoice={reservation.totalInvoice ? Number(reservation.totalInvoice) : null}
            />
          </div>

          {/* Notas */}
          {reservation.notes && (
            <>
              <Separator />
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Notas</h2>
                <p className="text-sm whitespace-pre-wrap">{reservation.notes}</p>
              </div>
            </>
          )}
        </div>

        {/* Columna derecha: servicios */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Servicios</h2>
          <ReservationServices
            reservationId={reservation.id}
            agencyId={agency.id}
            passengers={reservation.passengers}
            accommodations={reservation.accommodations}
            meals={reservation.meals}
            excursions={reservation.excursions}
            transfers={reservation.transfers}
            tickets={reservation.tickets}
            rentals={reservation.rentals}
            miscs={reservation.miscs}
            providers={providers}
            roomTypes={roomTypes}
            foodTypes={foodTypes}
            excursionCodes={excursionCodes}
            transferSegments={transferSegments}
            ticketSegments={ticketSegments}
            pensionRegimes={pensionRegimes}
          />
        </div>
      </div>

    </div>
  );
}
