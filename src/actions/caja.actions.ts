"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Crear caja del día (PENDING) ────────────────────────────────────────────

const CreateCajaSchema = z.object({
  date:     z.coerce.date(),
  currency: z.enum(["PESOS", "USD"]),
});

export async function createDailyCash(agencyId: string, agencySlug: string, data: unknown) {
  const v = CreateCajaSchema.parse(data);

  // Número correlativo por agencia
  const last = await prisma.dailyCash.findFirst({
    where:   { agencyId },
    orderBy: { number: "desc" },
    select:  { number: true },
  });
  const number = (last?.number ?? 0) + 1;

  // Normalizar fecha a medianoche UTC para evitar duplicados por zona horaria
  const date = new Date(v.date);
  date.setUTCHours(0, 0, 0, 0);

  const cash = await prisma.dailyCash.create({
    data: { agencyId, date, number, currency: v.currency, status: "PENDING" },
  });

  revalidatePath(`/${agencySlug}/caja`);
  return cash.id;
}

// ─── Abrir caja (PENDING → OPEN) ─────────────────────────────────────────────

export async function openDailyCash(id: string, agencyId: string, agencySlug: string) {
  const cash = await prisma.dailyCash.findUnique({ where: { id, agencyId } });
  if (!cash) throw new Error("Caja no encontrada");
  if (cash.status !== "PENDING") throw new Error("Solo se pueden abrir cajas en estado PENDIENTE");

  await prisma.dailyCash.update({
    where: { id },
    data:  { status: "OPEN" },
  });

  revalidatePath(`/${agencySlug}/caja`);
  revalidatePath(`/${agencySlug}/caja/${id}`);
}

// ─── Cerrar caja (OPEN → CLOSED) ─────────────────────────────────────────────

export async function closeDailyCash(
  id: string,
  agencyId: string,
  agencySlug: string,
  closedBy: string,
) {
  const cash = await prisma.dailyCash.findUnique({ where: { id, agencyId } });
  if (!cash) throw new Error("Caja no encontrada");
  if (cash.status !== "OPEN") throw new Error("Solo se pueden cerrar cajas abiertas");

  await prisma.dailyCash.update({
    where: { id },
    data:  { status: "CLOSED", closedAt: new Date(), closedBy },
  });

  revalidatePath(`/${agencySlug}/caja`);
  revalidatePath(`/${agencySlug}/caja/${id}`);
}

// ─── Agregar transacción manual ───────────────────────────────────────────────

const TransactionSchema = z.object({
  direction:     z.enum(["IN", "OUT"]),
  origin:        z.string().min(1),
  voucherType:   z.string().min(1),
  voucherNumber: z.string().optional().nullable(),
  amount:        z.coerce.number().positive("El importe debe ser mayor a 0"),
  description:   z.string().optional().nullable(),
  accountEntry:  z.string().optional().nullable(),
});

export async function addCashTransaction(
  dailyCashId: string,
  agencyId: string,
  agencySlug: string,
  data: unknown,
) {
  const v = TransactionSchema.parse(data);

  const cash = await prisma.dailyCash.findUnique({ where: { id: dailyCashId, agencyId } });
  if (!cash) throw new Error("Caja no encontrada");
  if (cash.status !== "OPEN") throw new Error("Solo se pueden agregar movimientos a cajas abiertas");

  await prisma.$transaction([
    prisma.cashTransaction.create({
      data: {
        dailyCashId,
        direction:     v.direction,
        origin:        v.origin,
        voucherType:   v.voucherType,
        voucherNumber: v.voucherNumber ?? null,
        amount:        v.amount,
        description:   v.description ?? null,
        accountEntry:  v.accountEntry ?? null,
      },
    }),
    prisma.dailyCash.update({
      where: { id: dailyCashId },
      data: v.direction === "IN"
        ? { totalIn:  { increment: v.amount } }
        : { totalOut: { increment: v.amount } },
    }),
  ]);

  revalidatePath(`/${agencySlug}/caja/${dailyCashId}`);
}

// ─── Eliminar transacción manual ─────────────────────────────────────────────

export async function deleteCashTransaction(
  transactionId: string,
  dailyCashId: string,
  agencyId: string,
  agencySlug: string,
) {
  const cash = await prisma.dailyCash.findUnique({ where: { id: dailyCashId, agencyId } });
  if (!cash) throw new Error("Caja no encontrada");
  if (cash.status !== "OPEN") throw new Error("Solo se pueden eliminar movimientos de cajas abiertas");

  const tx = await prisma.cashTransaction.findUnique({ where: { id: transactionId } });
  if (!tx || tx.dailyCashId !== dailyCashId) throw new Error("Movimiento no encontrado");

  await prisma.$transaction([
    prisma.cashTransaction.delete({ where: { id: transactionId } }),
    prisma.dailyCash.update({
      where: { id: dailyCashId },
      data: tx.direction === "IN"
        ? { totalIn:  { decrement: Number(tx.amount) } }
        : { totalOut: { decrement: Number(tx.amount) } },
    }),
  ]);

  revalidatePath(`/${agencySlug}/caja/${dailyCashId}`);
}
