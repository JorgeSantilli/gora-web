"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function revalidate(agencySlug: string) {
  revalidatePath(`/${agencySlug}/receptivo`);
}

// ─── VEHICLE ──────────────────────────────────────────────────────────────────

const VehicleSchema = z.object({
  code:         z.coerce.number().int().positive(),
  description:  z.string().min(1),
  plate:        z.string().optional(),
  internalCode: z.string().optional(),
  seats:        z.coerce.number().int().positive().optional(),
  isOwn:        z.boolean().default(true),
  providerId:   z.string().optional(),
  active:       z.boolean().default(true),
  notes:        z.string().optional(),
});

export async function createVehicle(agencyId: string, agencySlug: string, data: unknown) {
  const parsed = VehicleSchema.parse(data);
  await prisma.vehicle.create({
    data: {
      agencyId,
      code:         parsed.code,
      description:  parsed.description,
      plate:        parsed.plate || null,
      internalCode: parsed.internalCode || null,
      seats:        parsed.seats || null,
      isOwn:        parsed.isOwn,
      providerId:   parsed.providerId || null,
      active:       parsed.active,
      notes:        parsed.notes || null,
    },
  });
  revalidate(agencySlug);
  redirect(`/${agencySlug}/receptivo?tab=vehiculos`);
}

export async function updateVehicle(id: string, agencyId: string, agencySlug: string, data: unknown) {
  const parsed = VehicleSchema.parse(data);
  await prisma.vehicle.update({
    where: { id, agencyId },
    data: {
      description:  parsed.description,
      plate:        parsed.plate || null,
      internalCode: parsed.internalCode || null,
      seats:        parsed.seats || null,
      isOwn:        parsed.isOwn,
      providerId:   parsed.providerId || null,
      active:       parsed.active,
      notes:        parsed.notes || null,
    },
  });
  revalidate(agencySlug);
  redirect(`/${agencySlug}/receptivo?tab=vehiculos`);
}

// ─── VEHICLE EXPIRY ───────────────────────────────────────────────────────────

const ExpirySchema = z.object({
  concept:   z.string().min(1),
  expiresAt: z.string().min(1),
  alertDays: z.coerce.number().int().min(1).default(30),
});

export async function addVehicleExpiry(vehicleId: string, agencyId: string, agencySlug: string, vehicleDbId: string, data: unknown) {
  // Verify vehicle belongs to agency
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleDbId, agencyId } });
  if (!vehicle) throw new Error("Vehículo no encontrado");

  const parsed = ExpirySchema.parse(data);
  await prisma.vehicleExpiry.create({
    data: {
      vehicleId: vehicleDbId,
      concept:   parsed.concept,
      expiresAt: new Date(parsed.expiresAt),
      alertDays: parsed.alertDays,
    },
  });
  revalidatePath(`/${agencySlug}/receptivo/vehiculos/${vehicleId}`);
}

export async function deleteVehicleExpiry(expiryId: string, agencyId: string, agencySlug: string, vehicleSlug: string) {
  const expiry = await prisma.vehicleExpiry.findUnique({
    where:   { id: expiryId },
    include: { vehicle: { select: { agencyId: true } } },
  });
  if (!expiry || expiry.vehicle.agencyId !== agencyId) throw new Error("No encontrado");
  await prisma.vehicleExpiry.delete({ where: { id: expiryId } });
  revalidatePath(`/${agencySlug}/receptivo/vehiculos/${vehicleSlug}`);
}

// ─── DRIVER ───────────────────────────────────────────────────────────────────

const DriverSchema = z.object({
  code:        z.coerce.number().int().positive(),
  name:        z.string().min(1),
  address:     z.string().optional(),
  city:        z.string().optional(),
  phone:       z.string().optional(),
  taxId:       z.string().optional(),
  isOwn:       z.boolean().default(true),
  active:      z.boolean().default(true),
});

export async function createDriver(agencyId: string, agencySlug: string, data: unknown) {
  const parsed = DriverSchema.parse(data);
  await prisma.driver.create({
    data: {
      agencyId,
      code:    parsed.code,
      name:    parsed.name,
      address: parsed.address || null,
      city:    parsed.city || null,
      phone:   parsed.phone || null,
      taxId:   parsed.taxId || null,
      isOwn:   parsed.isOwn,
      active:  parsed.active,
    },
  });
  revalidate(agencySlug);
  redirect(`/${agencySlug}/receptivo?tab=choferes`);
}

export async function updateDriver(id: string, agencyId: string, agencySlug: string, data: unknown) {
  const parsed = DriverSchema.parse(data);
  await prisma.driver.update({
    where: { id, agencyId },
    data: {
      name:    parsed.name,
      address: parsed.address || null,
      city:    parsed.city || null,
      phone:   parsed.phone || null,
      taxId:   parsed.taxId || null,
      isOwn:   parsed.isOwn,
      active:  parsed.active,
    },
  });
  revalidate(agencySlug);
  redirect(`/${agencySlug}/receptivo?tab=choferes`);
}

export async function addDriverExpiry(driverId: string, agencyId: string, agencySlug: string, data: unknown) {
  const driver = await prisma.driver.findUnique({ where: { id: driverId, agencyId } });
  if (!driver) throw new Error("Chofer no encontrado");

  const parsed = ExpirySchema.parse(data);
  await prisma.driverExpiry.create({
    data: {
      driverId,
      concept:   parsed.concept,
      expiresAt: new Date(parsed.expiresAt),
      alertDays: parsed.alertDays,
    },
  });
  revalidatePath(`/${agencySlug}/receptivo/choferes/${driverId}`);
}

export async function deleteDriverExpiry(expiryId: string, agencyId: string, agencySlug: string, driverId: string) {
  await prisma.driverExpiry.delete({ where: { id: expiryId } });
  revalidatePath(`/${agencySlug}/receptivo/choferes/${driverId}`);
}

// ─── GUIDE ────────────────────────────────────────────────────────────────────

const GuideSchema = z.object({
  code:      z.coerce.number().int().positive(),
  name:      z.string().min(1),
  phone:     z.string().optional(),
  taxId:     z.string().optional(),
  languages: z.string().optional(), // comma-separated
  active:    z.boolean().default(true),
});

export async function createGuide(agencyId: string, agencySlug: string, data: unknown) {
  const parsed = GuideSchema.parse(data);
  const langs = parsed.languages
    ? parsed.languages.split(",").map((l) => l.trim()).filter(Boolean)
    : [];
  await prisma.guide.create({
    data: {
      agencyId,
      code:      parsed.code,
      name:      parsed.name,
      phone:     parsed.phone || null,
      taxId:     parsed.taxId || null,
      languages: langs,
      active:    parsed.active,
    },
  });
  revalidate(agencySlug);
  redirect(`/${agencySlug}/receptivo?tab=guias`);
}

export async function updateGuide(id: string, agencyId: string, agencySlug: string, data: unknown) {
  const parsed = GuideSchema.parse(data);
  const langs = parsed.languages
    ? parsed.languages.split(",").map((l) => l.trim()).filter(Boolean)
    : [];
  await prisma.guide.update({
    where: { id, agencyId },
    data: {
      name:      parsed.name,
      phone:     parsed.phone || null,
      taxId:     parsed.taxId || null,
      languages: langs,
      active:    parsed.active,
    },
  });
  revalidate(agencySlug);
  redirect(`/${agencySlug}/receptivo?tab=guias`);
}

// ─── DAILY TRANSFER ───────────────────────────────────────────────────────────

const DailyTransferSchema = z.object({
  date: z.string().min(1),
  type: z.enum(["ENTRADA", "SALIDA", "CENA_SHOW", "CONEXION", "ASISTENCIA"]),
});

export async function createDailyTransfer(agencyId: string, agencySlug: string, data: unknown) {
  const parsed = DailyTransferSchema.parse(data);
  const created = await prisma.dailyTransfer.create({
    data: {
      agencyId,
      date: new Date(parsed.date + "T00:00:00"),
      type: parsed.type,
    },
  });
  revalidate(agencySlug);
  redirect(`/${agencySlug}/receptivo/traslados/${created.id}`);
}

export async function deleteDailyTransfer(id: string, agencyId: string, agencySlug: string) {
  await prisma.dailyTransfer.delete({ where: { id, agencyId } });
  revalidate(agencySlug);
  redirect(`/${agencySlug}/receptivo?tab=traslados`);
}

// ─── DAILY EXCURSION ──────────────────────────────────────────────────────────

const DailyExcursionSchema = z.object({
  date:           z.string().min(1),
  excursionCodeId: z.string().optional(),
  time:           z.string().optional(),
  comments:       z.string().optional(),
});

export async function createDailyExcursion(agencyId: string, agencySlug: string, data: unknown) {
  const parsed = DailyExcursionSchema.parse(data);
  const created = await prisma.dailyExcursion.create({
    data: {
      agencyId,
      date:           new Date(parsed.date + "T00:00:00"),
      excursionCodeId: parsed.excursionCodeId || null,
      time:           parsed.time || null,
      comments:       parsed.comments || null,
    },
  });
  revalidate(agencySlug);
  redirect(`/${agencySlug}/receptivo/excursiones/${created.id}`);
}

export async function updateDailyExcursion(id: string, agencyId: string, agencySlug: string, data: unknown) {
  const parsed = DailyExcursionSchema.parse(data);
  await prisma.dailyExcursion.update({
    where: { id, agencyId },
    data: {
      date:           new Date(parsed.date + "T00:00:00"),
      excursionCodeId: parsed.excursionCodeId || null,
      time:           parsed.time || null,
      comments:       parsed.comments || null,
    },
  });
  revalidate(agencySlug);
  redirect(`/${agencySlug}/receptivo?tab=excursiones`);
}

export async function addExcursionVehicle(
  excursionId: string,
  agencyId: string,
  agencySlug: string,
  data: { vehicleId?: string; driverId?: string; guideId?: string; transportCompanyId?: string; copies?: number }
) {
  const excursion = await prisma.dailyExcursion.findUnique({ where: { id: excursionId, agencyId } });
  if (!excursion) throw new Error("Excursión no encontrada");
  await prisma.dailyExcursionVehicle.create({
    data: {
      dailyExcursionId:   excursionId,
      vehicleId:          data.vehicleId || null,
      driverId:           data.driverId || null,
      guideId:            data.guideId || null,
      transportCompanyId: data.transportCompanyId || null,
      copies:             data.copies ?? 1,
    },
  });
  revalidatePath(`/${agencySlug}/receptivo/excursiones/${excursionId}`);
}

export async function removeExcursionVehicle(devId: string, excursionId: string, agencyId: string, agencySlug: string) {
  await prisma.dailyExcursionVehicle.delete({ where: { id: devId } });
  revalidatePath(`/${agencySlug}/receptivo/excursiones/${excursionId}`);
}
