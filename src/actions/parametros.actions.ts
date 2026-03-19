"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ─── ServiceProviderType ───────────────────────────────────────────────────

const ServiceProviderTypeSchema = z.object({
  code: z.coerce.number().int().positive(),
  name: z.string().min(1).max(80),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export async function createServiceProviderType(
  agencyId: string,
  data: z.infer<typeof ServiceProviderTypeSchema>
) {
  const validated = ServiceProviderTypeSchema.parse(data);
  await prisma.serviceProviderType.create({ data: { agencyId, ...validated } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function updateServiceProviderType(
  id: string,
  agencyId: string,
  data: z.infer<typeof ServiceProviderTypeSchema>
) {
  const validated = ServiceProviderTypeSchema.parse(data);
  await prisma.serviceProviderType.update({
    where: { id, agencyId },
    data: validated,
  });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function deleteServiceProviderType(id: string, agencyId: string) {
  await prisma.serviceProviderType.delete({ where: { id, agencyId } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

// ─── PensionRegime ─────────────────────────────────────────────────────────

const PensionRegimeSchema = z.object({
  code: z.string().min(1).max(4).toUpperCase(),
  name: z.string().min(1).max(80),
  abbreviation: z.string().min(1).max(6),
});

export async function createPensionRegime(
  agencyId: string,
  data: z.infer<typeof PensionRegimeSchema>
) {
  const validated = PensionRegimeSchema.parse(data);
  await prisma.pensionRegime.create({ data: { agencyId, ...validated } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function updatePensionRegime(
  id: string,
  agencyId: string,
  data: z.infer<typeof PensionRegimeSchema>
) {
  const validated = PensionRegimeSchema.parse(data);
  await prisma.pensionRegime.update({ where: { id, agencyId }, data: validated });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function deletePensionRegime(id: string, agencyId: string) {
  await prisma.pensionRegime.delete({ where: { id, agencyId } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

// ─── RoomType ──────────────────────────────────────────────────────────────

const RoomTypeSchema = z.object({
  code: z.string().min(1).max(8).toUpperCase(),
  name: z.string().min(1).max(80),
  abbreviation: z.string().min(1).max(8),
  capacity: z.coerce.number().int().min(1).max(20),
  isVoucherComplement: z.boolean().default(false),
  active: z.boolean().default(true),
});

export async function createRoomType(
  agencyId: string,
  data: z.infer<typeof RoomTypeSchema>
) {
  const validated = RoomTypeSchema.parse(data);
  await prisma.roomType.create({ data: { agencyId, ...validated } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function updateRoomType(
  id: string,
  agencyId: string,
  data: z.infer<typeof RoomTypeSchema>
) {
  const validated = RoomTypeSchema.parse(data);
  await prisma.roomType.update({ where: { id, agencyId }, data: validated });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function deleteRoomType(id: string, agencyId: string) {
  await prisma.roomType.delete({ where: { id, agencyId } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

// ─── FoodType ──────────────────────────────────────────────────────────────

const FoodTypeSchema = z.object({
  code: z.string().min(1).max(4).toUpperCase(),
  name: z.string().min(1).max(80),
  active: z.boolean().default(true),
});

export async function createFoodType(
  agencyId: string,
  data: z.infer<typeof FoodTypeSchema>
) {
  const validated = FoodTypeSchema.parse(data);
  await prisma.foodType.create({ data: { agencyId, ...validated } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function updateFoodType(
  id: string,
  agencyId: string,
  data: z.infer<typeof FoodTypeSchema>
) {
  const validated = FoodTypeSchema.parse(data);
  await prisma.foodType.update({ where: { id, agencyId }, data: validated });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function deleteFoodType(id: string, agencyId: string) {
  await prisma.foodType.delete({ where: { id, agencyId } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

// ─── ClientType ────────────────────────────────────────────────────────────

const ClientTypeSchema = z.object({
  code: z.coerce.number().int().positive(),
  name: z.string().min(1).max(80),
  active: z.boolean().default(true),
});

export async function createClientType(
  agencyId: string,
  data: z.infer<typeof ClientTypeSchema>
) {
  const validated = ClientTypeSchema.parse(data);
  await prisma.clientType.create({ data: { agencyId, ...validated } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function updateClientType(
  id: string,
  agencyId: string,
  data: z.infer<typeof ClientTypeSchema>
) {
  const validated = ClientTypeSchema.parse(data);
  await prisma.clientType.update({ where: { id, agencyId }, data: validated });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function deleteClientType(id: string, agencyId: string) {
  await prisma.clientType.delete({ where: { id, agencyId } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

// ─── ProviderOrigin ────────────────────────────────────────────────────────

const ProviderOriginSchema = z.object({
  code: z.string().min(1).max(6).toUpperCase(),
  name: z.string().min(1).max(80),
  includeExcursion: z.boolean().default(false),
  includeTransfer: z.boolean().default(false),
  isForeign: z.boolean().default(false),
  active: z.boolean().default(true),
});

export async function createProviderOrigin(
  agencyId: string,
  data: z.infer<typeof ProviderOriginSchema>
) {
  const validated = ProviderOriginSchema.parse(data);
  await prisma.providerOrigin.create({ data: { agencyId, ...validated } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function updateProviderOrigin(
  id: string,
  agencyId: string,
  data: z.infer<typeof ProviderOriginSchema>
) {
  const validated = ProviderOriginSchema.parse(data);
  await prisma.providerOrigin.update({ where: { id, agencyId }, data: validated });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function deleteProviderOrigin(id: string, agencyId: string) {
  await prisma.providerOrigin.delete({ where: { id, agencyId } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

// ─── ReservationOrigin ─────────────────────────────────────────────────────

const ReservationOriginSchema = z.object({
  letter: z.string().min(1).max(2).toUpperCase(),
  label: z.string().min(1).max(80),
  autoNumber: z.boolean().default(true),
  lastNumber: z.coerce.number().int().min(0).default(0),
});

export async function createReservationOrigin(
  agencyId: string,
  data: z.infer<typeof ReservationOriginSchema>
) {
  const validated = ReservationOriginSchema.parse(data);
  await prisma.reservationOrigin.create({ data: { agencyId, ...validated } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function updateReservationOrigin(
  id: string,
  agencyId: string,
  data: z.infer<typeof ReservationOriginSchema>
) {
  const validated = ReservationOriginSchema.parse(data);
  await prisma.reservationOrigin.update({ where: { id, agencyId }, data: validated });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function deleteReservationOrigin(id: string, agencyId: string) {
  await prisma.reservationOrigin.delete({ where: { id, agencyId } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

// ─── GuideType ─────────────────────────────────────────────────────────────

const GuideTypeSchema = z.object({
  code: z.string().min(1).max(6).toUpperCase(),
  name: z.string().min(1).max(80),
  isBilingual: z.boolean().default(false),
});

export async function createGuideType(
  agencyId: string,
  data: z.infer<typeof GuideTypeSchema>
) {
  const validated = GuideTypeSchema.parse(data);
  await prisma.guideType.create({ data: { agencyId, ...validated } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function updateGuideType(
  id: string,
  agencyId: string,
  data: z.infer<typeof GuideTypeSchema>
) {
  const validated = GuideTypeSchema.parse(data);
  await prisma.guideType.update({ where: { id, agencyId }, data: validated });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}

export async function deleteGuideType(id: string, agencyId: string) {
  await prisma.guideType.delete({ where: { id, agencyId } });
  revalidatePath(`/[agencySlug]/parametros`, "page");
}
