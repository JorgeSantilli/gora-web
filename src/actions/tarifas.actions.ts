"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Schemas ───────────────────────────────────────────────────────────────

const DetailRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));

const CostTariffSchema = z.object({
  providerId: z.string().min(1),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
  currency: z.enum(["PESOS", "USD"]).default("PESOS"),
  serviceType: z.enum(["HOTEL", "MEAL", "EXCURSION", "TRANSFER", "TICKET", "RENTAL", "MISC"]),
  details: z.array(DetailRowSchema).default([]),
});

const ProgramTariffSchema = z.object({
  programId: z.string().min(1),
  medium: z.enum(["SIN_TRANSPORTE", "CON_BUS", "CON_AEREO"]).default("SIN_TRANSPORTE"),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
  currency: z.enum(["PESOS", "USD"]).default("PESOS"),
  transportTaxable: z.coerce.number().optional().nullable(),
  exempt: z.coerce.number().optional().nullable(),
  taxes: z.coerce.number().optional().nullable(),
  details: z.array(DetailRowSchema).default([]),
});

// ─── Costs ─────────────────────────────────────────────────────────────────

export async function createCost(agencyId: string, agencySlug: string, data: unknown) {
  const v = CostTariffSchema.parse(data);
  await prisma.cost.create({
    data: {
      agencyId,
      providerId: v.providerId,
      validFrom: v.validFrom,
      validTo: v.validTo,
      currency: v.currency,
      serviceType: v.serviceType,
      details: v.details,
    },
  });
  revalidatePath(`/${agencySlug}/tarifas`);
  redirect(`/${agencySlug}/tarifas?tab=costos`);
}

export async function updateCost(id: string, agencyId: string, agencySlug: string, data: unknown) {
  const v = CostTariffSchema.parse(data);
  await prisma.cost.update({
    where: { id, agencyId },
    data: {
      providerId: v.providerId,
      validFrom: v.validFrom,
      validTo: v.validTo,
      currency: v.currency,
      serviceType: v.serviceType,
      details: v.details,
    },
  });
  revalidatePath(`/${agencySlug}/tarifas`);
  redirect(`/${agencySlug}/tarifas?tab=costos`);
}

export async function deleteCost(id: string, agencyId: string, agencySlug: string) {
  await prisma.cost.delete({ where: { id, agencyId } });
  revalidatePath(`/${agencySlug}/tarifas`);
  redirect(`/${agencySlug}/tarifas?tab=costos`);
}

// ─── Tariffs ────────────────────────────────────────────────────────────────

export async function createTariff(agencyId: string, agencySlug: string, data: unknown) {
  const v = CostTariffSchema.parse(data);
  await prisma.tariff.create({
    data: {
      agencyId,
      providerId: v.providerId,
      validFrom: v.validFrom,
      validTo: v.validTo,
      currency: v.currency,
      serviceType: v.serviceType,
      details: v.details,
    },
  });
  revalidatePath(`/${agencySlug}/tarifas`);
  redirect(`/${agencySlug}/tarifas?tab=ventas`);
}

export async function updateTariff(id: string, agencyId: string, agencySlug: string, data: unknown) {
  const v = CostTariffSchema.parse(data);
  await prisma.tariff.update({
    where: { id, agencyId },
    data: {
      providerId: v.providerId,
      validFrom: v.validFrom,
      validTo: v.validTo,
      currency: v.currency,
      serviceType: v.serviceType,
      details: v.details,
    },
  });
  revalidatePath(`/${agencySlug}/tarifas`);
  redirect(`/${agencySlug}/tarifas?tab=ventas`);
}

export async function deleteTariff(id: string, agencyId: string, agencySlug: string) {
  await prisma.tariff.delete({ where: { id, agencyId } });
  revalidatePath(`/${agencySlug}/tarifas`);
  redirect(`/${agencySlug}/tarifas?tab=ventas`);
}

// ─── Program Tariffs ────────────────────────────────────────────────────────

export async function createProgramTariff(agencyId: string, agencySlug: string, data: unknown) {
  const v = ProgramTariffSchema.parse(data);
  await prisma.programTariff.create({
    data: {
      agencyId,
      programId: v.programId,
      medium: v.medium,
      validFrom: v.validFrom,
      validTo: v.validTo,
      currency: v.currency,
      transportTaxable: v.transportTaxable ?? null,
      exempt: v.exempt ?? null,
      taxes: v.taxes ?? null,
      details: v.details,
    },
  });
  revalidatePath(`/${agencySlug}/tarifas`);
  redirect(`/${agencySlug}/tarifas?tab=programas`);
}

export async function updateProgramTariff(id: string, agencyId: string, agencySlug: string, data: unknown) {
  const v = ProgramTariffSchema.parse(data);
  await prisma.programTariff.update({
    where: { id, agencyId },
    data: {
      programId: v.programId,
      medium: v.medium,
      validFrom: v.validFrom,
      validTo: v.validTo,
      currency: v.currency,
      transportTaxable: v.transportTaxable ?? null,
      exempt: v.exempt ?? null,
      taxes: v.taxes ?? null,
      details: v.details,
    },
  });
  revalidatePath(`/${agencySlug}/tarifas`);
  redirect(`/${agencySlug}/tarifas?tab=programas`);
}

export async function deleteProgramTariff(id: string, agencyId: string, agencySlug: string) {
  await prisma.programTariff.delete({ where: { id, agencyId } });
  revalidatePath(`/${agencySlug}/tarifas`);
  redirect(`/${agencySlug}/tarifas?tab=programas`);
}
