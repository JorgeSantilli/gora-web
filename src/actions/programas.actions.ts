"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ─── Program header ────────────────────────────────────────────────────────────

const ProgramSchema = z.object({
  code: z.coerce.number().int().positive(),
  name: z.string().min(1).max(120),
  isFixedBase: z.boolean().default(true),
  days: z.coerce.number().int().min(1).optional(),
  nights: z.coerce.number().int().min(0).optional(),
  active: z.boolean().default(true),
});

type ProgramInput = z.infer<typeof ProgramSchema>;

export async function createProgram(agencyId: string, agencySlug: string, data: ProgramInput) {
  const validated = ProgramSchema.parse(data);
  const program = await prisma.program.create({
    data: { agencyId, ...validated },
  });
  revalidatePath(`/${agencySlug}/programas`);
  redirect(`/${agencySlug}/programas/${program.id}`);
}

export async function updateProgram(id: string, agencyId: string, agencySlug: string, data: ProgramInput) {
  const validated = ProgramSchema.parse(data);
  await prisma.program.update({ where: { id, agencyId }, data: validated });
  revalidatePath(`/${agencySlug}/programas`);
  revalidatePath(`/${agencySlug}/programas/${id}`);
}

export async function deleteProgram(id: string, agencyId: string, agencySlug: string) {
  await prisma.program.delete({ where: { id, agencyId } });
  revalidatePath(`/${agencySlug}/programas`);
  redirect(`/${agencySlug}/programas`);
}

export async function toggleProgramActive(id: string, agencyId: string, active: boolean) {
  await prisma.program.update({ where: { id, agencyId }, data: { active } });
  revalidatePath(`/[agencySlug]/programas`);
}

// ─── Hotels ────────────────────────────────────────────────────────────────────

const HotelSchema = z.object({
  providerId: z.string().min(1),
  regime: z.string().optional(),
  nights: z.coerce.number().int().min(1).default(1),
  order: z.coerce.number().int().min(0).default(0),
});

export async function addProgramHotel(programId: string, agencyId: string, data: z.infer<typeof HotelSchema>) {
  const v = HotelSchema.parse(data);
  await prisma.programHotel.create({ data: { programId, ...v, regime: v.regime || undefined } });
  revalidatePath(`/[agencySlug]/programas/${programId}`);
}

export async function removeProgramHotel(id: string) {
  await prisma.programHotel.delete({ where: { id } });
}

// ─── Meals ─────────────────────────────────────────────────────────────────────

const MealSchema = z.object({
  providerId: z.string().min(1),
  foodTypeId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
});

export async function addProgramMeal(programId: string, agencyId: string, data: z.infer<typeof MealSchema>) {
  const v = MealSchema.parse(data);
  await prisma.programMeal.create({ data: { programId, ...v, foodTypeId: v.foodTypeId || undefined } });
  revalidatePath(`/[agencySlug]/programas/${programId}`);
}

export async function removeProgramMeal(id: string) {
  await prisma.programMeal.delete({ where: { id } });
}

// ─── Excursions ────────────────────────────────────────────────────────────────

const ExcursionSchema = z.object({
  providerId: z.string().min(1),
  excursionCodeId: z.string().optional(),
});

export async function addProgramExcursion(programId: string, agencyId: string, data: z.infer<typeof ExcursionSchema>) {
  const v = ExcursionSchema.parse(data);
  await prisma.programExcursion.create({ data: { programId, ...v, excursionCodeId: v.excursionCodeId || undefined } });
  revalidatePath(`/[agencySlug]/programas/${programId}`);
}

export async function removeProgramExcursion(id: string) {
  await prisma.programExcursion.delete({ where: { id } });
}

// ─── Transfers ─────────────────────────────────────────────────────────────────

const TransferSchema = z.object({
  providerId: z.string().min(1),
  transferSegmentId: z.string().optional(),
});

export async function addProgramTransfer(programId: string, agencyId: string, data: z.infer<typeof TransferSchema>) {
  const v = TransferSchema.parse(data);
  await prisma.programTransfer.create({ data: { programId, ...v, transferSegmentId: v.transferSegmentId || undefined } });
  revalidatePath(`/[agencySlug]/programas/${programId}`);
}

export async function removeProgramTransfer(id: string) {
  await prisma.programTransfer.delete({ where: { id } });
}

// ─── Tickets ───────────────────────────────────────────────────────────────────

const TicketSchema = z.object({
  providerId: z.string().min(1),
  ticketSegmentId: z.string().optional(),
});

export async function addProgramTicket(programId: string, agencyId: string, data: z.infer<typeof TicketSchema>) {
  const v = TicketSchema.parse(data);
  await prisma.programTicket.create({ data: { programId, ...v, ticketSegmentId: v.ticketSegmentId || undefined } });
  revalidatePath(`/[agencySlug]/programas/${programId}`);
}

export async function removeProgramTicket(id: string) {
  await prisma.programTicket.delete({ where: { id } });
}

// ─── Rentals ───────────────────────────────────────────────────────────────────

const RentalSchema = z.object({
  providerId: z.string().min(1),
  description: z.string().optional(),
});

export async function addProgramRental(programId: string, agencyId: string, data: z.infer<typeof RentalSchema>) {
  const v = RentalSchema.parse(data);
  await prisma.programRental.create({ data: { programId, ...v, description: v.description || undefined } });
  revalidatePath(`/[agencySlug]/programas/${programId}`);
}

export async function removeProgramRental(id: string) {
  await prisma.programRental.delete({ where: { id } });
}

// ─── Misc ──────────────────────────────────────────────────────────────────────

const MiscSchema = z.object({
  providerId: z.string().min(1),
  description: z.string().optional(),
});

export async function addProgramMisc(programId: string, agencyId: string, data: z.infer<typeof MiscSchema>) {
  const v = MiscSchema.parse(data);
  await prisma.programMisc.create({ data: { programId, ...v, description: v.description || undefined } });
  revalidatePath(`/[agencySlug]/programas/${programId}`);
}

export async function removeProgramMisc(id: string) {
  await prisma.programMisc.delete({ where: { id } });
}
