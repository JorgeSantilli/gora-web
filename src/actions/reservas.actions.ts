"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ─── Reservation header ────────────────────────────────────────────────────────

const ReservationSchema = z.object({
  originId: z.string().min(1, "Seleccioná un origen"),
  clientId: z.string().optional(),
  programId: z.string().optional(),
  programCode: z.coerce.number().int().optional(),
  leadPax: z.string().min(1, "Ingresá el nombre del titular"),
  adults: z.coerce.number().int().min(1).default(1),
  minors: z.coerce.number().int().min(0).default(0),
  free: z.coerce.number().int().min(0).default(0),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  inMedium: z.string().optional(),
  inTime: z.string().optional(),
  outMedium: z.string().optional(),
  outTime: z.string().optional(),
  expiresAt: z.string().optional(),
  currency: z.enum(["PESOS", "USD"]).default("PESOS"),
  commission: z.coerce.number().min(0).max(100).optional(),
  isFixedCommission: z.boolean().default(true),
  notes: z.string().optional(),
});

type ReservationInput = z.infer<typeof ReservationSchema>;

export async function createReservation(agencyId: string, agencySlug: string, data: ReservationInput) {
  const v = ReservationSchema.parse(data);

  // Fetch origin and auto-increment number
  const origin = await prisma.reservationOrigin.findUnique({
    where: { id: v.originId },
  });
  if (!origin || origin.agencyId !== agencyId) throw new Error("Origen inválido");

  let number: string;
  if (origin.autoNumber) {
    const updated = await prisma.reservationOrigin.update({
      where: { id: origin.id },
      data: { lastNumber: { increment: 1 } },
    });
    number = String(updated.lastNumber);
  } else {
    throw new Error("Este origen no tiene numeración automática");
  }

  const reservation = await prisma.reservation.create({
    data: {
      agencyId,
      origin: origin.letter,
      number,
      clientId: v.clientId || undefined,
      programId: v.programId || undefined,
      programCode: v.programCode || undefined,
      leadPax: v.leadPax,
      adults: v.adults,
      minors: v.minors,
      free: v.free,
      checkIn: v.checkIn ? new Date(v.checkIn) : undefined,
      checkOut: v.checkOut ? new Date(v.checkOut) : undefined,
      inMedium: v.inMedium || undefined,
      inTime: v.inTime || undefined,
      outMedium: v.outMedium || undefined,
      outTime: v.outTime || undefined,
      expiresAt: v.expiresAt ? new Date(v.expiresAt) : undefined,
      currency: v.currency,
      commission: v.commission || undefined,
      isFixedCommission: v.isFixedCommission,
      notes: v.notes || undefined,
    },
  });

  revalidatePath(`/${agencySlug}/reservas`);
  redirect(`/${agencySlug}/reservas/${reservation.id}`);
}

export async function updateReservationHeader(
  id: string,
  agencyId: string,
  agencySlug: string,
  data: Omit<ReservationInput, "originId">
) {
  const v = ReservationSchema.omit({ originId: true }).parse(data);
  await prisma.reservation.update({
    where: { id, agencyId },
    data: {
      clientId: v.clientId || undefined,
      programId: v.programId || undefined,
      programCode: v.programCode || undefined,
      leadPax: v.leadPax,
      adults: v.adults,
      minors: v.minors,
      free: v.free,
      checkIn: v.checkIn ? new Date(v.checkIn) : null,
      checkOut: v.checkOut ? new Date(v.checkOut) : null,
      inMedium: v.inMedium || null,
      inTime: v.inTime || null,
      outMedium: v.outMedium || null,
      outTime: v.outTime || null,
      expiresAt: v.expiresAt ? new Date(v.expiresAt) : null,
      currency: v.currency,
      commission: v.commission ?? null,
      isFixedCommission: v.isFixedCommission,
      notes: v.notes || null,
    },
  });
  revalidatePath(`/${agencySlug}/reservas/${id}`);
}

export async function updateReservationAmounts(
  id: string,
  agencyId: string,
  agencySlug: string,
  data: {
    totalAmount?: number;
    taxableAmount?: number;
    transportTaxableAmount?: number;
    nonComputedAmount?: number;
    exemptAmount?: number;
    vatGeneral?: number;
    vatTransport?: number;
    taxes?: number;
    agencyCommissionAmount?: number;
    netAmount?: number;
    totalInvoice?: number;
  }
) {
  await prisma.reservation.update({
    where: { id, agencyId },
    data: {
      totalAmount: data.totalAmount ?? null,
      taxableAmount: data.taxableAmount ?? null,
      transportTaxableAmount: data.transportTaxableAmount ?? null,
      nonComputedAmount: data.nonComputedAmount ?? null,
      exemptAmount: data.exemptAmount ?? null,
      vatGeneral: data.vatGeneral ?? null,
      vatTransport: data.vatTransport ?? null,
      taxes: data.taxes ?? null,
      agencyCommissionAmount: data.agencyCommissionAmount ?? null,
      netAmount: data.netAmount ?? null,
      totalInvoice: data.totalInvoice ?? null,
    },
  });
  revalidatePath(`/${agencySlug}/reservas/${id}`);
}

// ─── Status transitions ────────────────────────────────────────────────────────

export async function confirmReservation(id: string, agencyId: string, agencySlug: string, confirmedBy: string) {
  await prisma.reservation.update({
    where: { id, agencyId },
    data: { status: "CONFIRMED", confirmedAt: new Date(), confirmedBy },
  });
  revalidatePath(`/${agencySlug}/reservas/${id}`);
  revalidatePath(`/${agencySlug}/reservas`);
}

export async function cancelReservation(id: string, agencyId: string, agencySlug: string) {
  await prisma.reservation.update({
    where: { id, agencyId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  revalidatePath(`/${agencySlug}/reservas/${id}`);
  revalidatePath(`/${agencySlug}/reservas`);
}

export async function markVouchersIssued(id: string, agencyId: string, agencySlug: string) {
  await prisma.reservation.update({
    where: { id, agencyId },
    data: { status: "VOUCHERS_ISSUED" },
  });
  revalidatePath(`/${agencySlug}/reservas/${id}`);
  revalidatePath(`/${agencySlug}/reservas`);
}

// ─── Passengers ────────────────────────────────────────────────────────────────

const PassengerSchema = z.object({
  name: z.string().min(1),
  docType: z.string().optional(),
  docNumber: z.string().optional(),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  order: z.coerce.number().int().default(0),
});

export async function addPassenger(reservationId: string, agencyId: string, data: z.infer<typeof PassengerSchema>) {
  const v = PassengerSchema.parse(data);
  await prisma.reservationPassenger.create({
    data: {
      reservationId,
      name: v.name,
      docType: v.docType || undefined,
      docNumber: v.docNumber || undefined,
      birthDate: v.birthDate ? new Date(v.birthDate) : undefined,
      nationality: v.nationality || undefined,
      occupation: v.occupation || undefined,
      order: v.order,
    },
  });
  revalidatePath(`/[agencySlug]/reservas/${reservationId}`);
}

export async function removePassenger(id: string) {
  await prisma.reservationPassenger.delete({ where: { id } });
}

// ─── Accommodations ────────────────────────────────────────────────────────────

const AccommodationSchema = z.object({
  providerId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  regime: z.string().optional(),
  confirmedWith: z.string().optional(),
});

export async function addAccommodation(reservationId: string, agencyId: string, data: z.infer<typeof AccommodationSchema>) {
  const v = AccommodationSchema.parse(data);
  const accommodation = await prisma.reservationAccommodation.create({
    data: {
      reservationId,
      providerId: v.providerId,
      checkIn: new Date(v.checkIn),
      checkOut: new Date(v.checkOut),
      regime: v.regime || undefined,
      confirmedWith: v.confirmedWith || undefined,
    },
  });
  revalidatePath(`/[agencySlug]/reservas/${reservationId}`);
  return accommodation.id;
}

export async function removeAccommodation(id: string) {
  await prisma.reservationAccommodation.delete({ where: { id } });
}

// ─── Rooms ─────────────────────────────────────────────────────────────────────

const RoomSchema = z.object({
  roomTypeId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  isCommunicating: z.boolean().default(false),
  isFree: z.boolean().default(false),
});

export async function addRoom(accommodationId: string, data: z.infer<typeof RoomSchema>) {
  const v = RoomSchema.parse(data);
  await prisma.reservationRoom.create({
    data: {
      accommodationId,
      roomTypeId: v.roomTypeId || undefined,
      quantity: v.quantity,
      isCommunicating: v.isCommunicating,
      isFree: v.isFree,
    },
  });
}

export async function removeRoom(id: string) {
  await prisma.reservationRoom.delete({ where: { id } });
}

// ─── Meals ─────────────────────────────────────────────────────────────────────

const MealSchema = z.object({
  providerId: z.string().min(1),
  foodTypeId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  quantityPerPax: z.coerce.number().int().min(1).default(1),
  date: z.string().optional(),
});

export async function addMeal(reservationId: string, agencyId: string, data: z.infer<typeof MealSchema>) {
  const v = MealSchema.parse(data);
  await prisma.reservationMeal.create({
    data: {
      reservationId,
      providerId: v.providerId,
      foodTypeId: v.foodTypeId || undefined,
      quantity: v.quantity,
      quantityPerPax: v.quantityPerPax,
      date: v.date ? new Date(v.date) : undefined,
    },
  });
  revalidatePath(`/[agencySlug]/reservas/${reservationId}`);
}

export async function removeMeal(id: string) {
  await prisma.reservationMeal.delete({ where: { id } });
}

// ─── Excursions ────────────────────────────────────────────────────────────────

const ExcursionSchema = z.object({
  providerId: z.string().min(1),
  excursionCodeId: z.string().optional(),
  date: z.string().min(1),
  time: z.string().optional(),
  pickupProviderId: z.string().optional(),
  pickupOther: z.string().optional(),
  guideType: z.string().optional(),
  isPrivate: z.boolean().default(false),
  paxCount: z.coerce.number().int().min(1).default(1),
});

export async function addExcursion(reservationId: string, agencyId: string, data: z.infer<typeof ExcursionSchema>) {
  const v = ExcursionSchema.parse(data);
  await prisma.reservationExcursion.create({
    data: {
      reservationId,
      providerId: v.providerId,
      excursionCodeId: v.excursionCodeId || undefined,
      date: new Date(v.date),
      time: v.time || undefined,
      pickupProviderId: v.pickupProviderId || undefined,
      pickupOther: v.pickupOther || undefined,
      guideType: v.guideType || undefined,
      isPrivate: v.isPrivate,
      paxCount: v.paxCount,
    },
  });
  revalidatePath(`/[agencySlug]/reservas/${reservationId}`);
}

export async function removeExcursion(id: string) {
  await prisma.reservationExcursion.delete({ where: { id } });
}

// ─── Transfers ─────────────────────────────────────────────────────────────────

const TransferSchema = z.object({
  providerId: z.string().min(1),
  transferSegmentId: z.string().optional(),
  date: z.string().min(1),
  time: z.string().optional(),
  medium: z.string().optional(),
  pickupProviderId: z.string().optional(),
  pickupOther: z.string().optional(),
  guideType: z.string().optional(),
  isPrivate: z.boolean().default(false),
  paxCount: z.coerce.number().int().min(1).default(1),
});

export async function addTransfer(reservationId: string, agencyId: string, data: z.infer<typeof TransferSchema>) {
  const v = TransferSchema.parse(data);
  await prisma.reservationTransfer.create({
    data: {
      reservationId,
      providerId: v.providerId,
      transferSegmentId: v.transferSegmentId || undefined,
      date: new Date(v.date),
      time: v.time || undefined,
      medium: v.medium || undefined,
      pickupProviderId: v.pickupProviderId || undefined,
      pickupOther: v.pickupOther || undefined,
      guideType: v.guideType || undefined,
      isPrivate: v.isPrivate,
      paxCount: v.paxCount,
    },
  });
  revalidatePath(`/[agencySlug]/reservas/${reservationId}`);
}

export async function removeTransfer(id: string) {
  await prisma.reservationTransfer.delete({ where: { id } });
}

// ─── Tickets ───────────────────────────────────────────────────────────────────

const TicketSchema = z.object({
  providerId: z.string().min(1),
  ticketSegmentId: z.string().optional(),
  date: z.string().min(1),
  passengerName: z.string().optional(),
  passengerType: z.enum(["ADULT", "CHILD", "INFANT"]).default("ADULT"),
  ticketNumber: z.string().optional(),
  issuedAt: z.string().optional(),
});

export async function addTicket(reservationId: string, agencyId: string, data: z.infer<typeof TicketSchema>) {
  const v = TicketSchema.parse(data);
  await prisma.reservationTicket.create({
    data: {
      reservationId,
      providerId: v.providerId,
      ticketSegmentId: v.ticketSegmentId || undefined,
      date: new Date(v.date),
      passengerName: v.passengerName || undefined,
      passengerType: v.passengerType,
      ticketNumber: v.ticketNumber || undefined,
      issuedAt: v.issuedAt ? new Date(v.issuedAt) : undefined,
    },
  });
  revalidatePath(`/[agencySlug]/reservas/${reservationId}`);
}

export async function removeTicket(id: string) {
  await prisma.reservationTicket.delete({ where: { id } });
}

// ─── Rentals ───────────────────────────────────────────────────────────────────

const RentalSchema = z.object({
  providerId: z.string().min(1),
  vehicleDesc: z.string().optional(),
  pickupAt: z.string().optional(),
  pickupTime: z.string().optional(),
  pickupPlace: z.string().optional(),
  pickupMedium: z.string().optional(),
  dropoffAt: z.string().optional(),
  dropoffTime: z.string().optional(),
  dropoffPlace: z.string().optional(),
  dropoffMedium: z.string().optional(),
});

export async function addRental(reservationId: string, agencyId: string, data: z.infer<typeof RentalSchema>) {
  const v = RentalSchema.parse(data);
  await prisma.reservationRental.create({
    data: {
      reservationId,
      providerId: v.providerId,
      vehicleDesc: v.vehicleDesc || undefined,
      pickupAt: v.pickupAt ? new Date(v.pickupAt) : undefined,
      pickupTime: v.pickupTime || undefined,
      pickupPlace: v.pickupPlace || undefined,
      pickupMedium: v.pickupMedium || undefined,
      dropoffAt: v.dropoffAt ? new Date(v.dropoffAt) : undefined,
      dropoffTime: v.dropoffTime || undefined,
      dropoffPlace: v.dropoffPlace || undefined,
      dropoffMedium: v.dropoffMedium || undefined,
    },
  });
  revalidatePath(`/[agencySlug]/reservas/${reservationId}`);
}

export async function removeRental(id: string) {
  await prisma.reservationRental.delete({ where: { id } });
}

// ─── Miscs ─────────────────────────────────────────────────────────────────────

const MiscSchema = z.object({
  providerId: z.string().min(1),
  description: z.string().min(1),
  vatType: z.enum(["GRAVADO", "GRAVADO_TRANSPORTE", "NO_COMPUTABLE", "EXENTO", "IMPUESTOS"]).default("GRAVADO"),
});

export async function addMisc(reservationId: string, agencyId: string, data: z.infer<typeof MiscSchema>) {
  const v = MiscSchema.parse(data);
  await prisma.reservationMisc.create({
    data: {
      reservationId,
      providerId: v.providerId,
      description: v.description,
      vatType: v.vatType,
    },
  });
  revalidatePath(`/[agencySlug]/reservas/${reservationId}`);
}

export async function removeMisc(id: string) {
  await prisma.reservationMisc.delete({ where: { id } });
}
