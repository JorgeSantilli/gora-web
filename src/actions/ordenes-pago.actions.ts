"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Ingreso de factura de compra ─────────────────────────────────────────────

const PurchaseInvoiceSchema = z.object({
  providerId:      z.string().optional().nullable(),
  providerName:    z.string().optional().nullable(),
  providerTaxId:   z.string().optional().nullable(),
  providerTaxPos:  z.enum(["RI", "MO", "CF", "EX", "NC"]).optional().nullable(),
  providerAddress: z.string().optional().nullable(),
  type:            z.enum(["FA", "ND", "NC"]).default("FA"),
  number:          z.string().min(1, "Número requerido"),
  date:            z.coerce.date(),
  currency:        z.enum(["PESOS", "USD"]).default("PESOS"),
  exchangeRate:    z.coerce.number().optional().nullable(),
  taxable:         z.coerce.number().min(0).default(0),
  nonComputed:     z.coerce.number().min(0).default(0),
  exempt:          z.coerce.number().min(0).default(0),
  vat:             z.coerce.number().min(0).default(0),
  taxes:           z.coerce.number().min(0).default(0),
  reservationId:   z.string().optional().nullable(),
});

export async function createPurchaseInvoice(
  agencyId: string,
  agencySlug: string,
  data: unknown,
) {
  const v = PurchaseInvoiceSchema.parse(data);
  const total = v.taxable + v.nonComputed + v.exempt + v.vat + v.taxes;

  const inv = await prisma.purchaseInvoice.create({
    data: {
      agencyId,
      providerId:      v.providerId ?? null,
      providerName:    v.providerName ?? null,
      providerTaxId:   v.providerTaxId ?? null,
      providerTaxPos:  v.providerTaxPos ?? null,
      providerAddress: v.providerAddress ?? null,
      type:            v.type,
      number:          v.number,
      date:            v.date,
      currency:        v.currency,
      exchangeRate:    v.exchangeRate ?? null,
      taxable:         v.taxable,
      nonComputed:     v.nonComputed,
      exempt:          v.exempt,
      vat:             v.vat,
      taxes:           v.taxes,
      total,
      balance:         total,
      reservationId:   v.reservationId ?? null,
    },
  });

  // Movimiento de cuenta corriente del prestador (débito)
  if (v.providerId) {
    const lastMov = await prisma.providerAccountMovement.findFirst({
      where:   { agencyId, providerId: v.providerId, currency: v.currency },
      orderBy: { createdAt: "desc" },
      select:  { balance: true },
    });
    const prevBalance = parseFloat(String(lastMov?.balance ?? 0));

    await prisma.providerAccountMovement.create({
      data: {
        agencyId,
        providerId:    v.providerId,
        reservationId: v.reservationId ?? null,
        date:          v.date,
        type:          "DEBIT",
        voucherType:   "Factura Compra",
        voucherNumber: v.number,
        currency:      v.currency,
        debit:         total,
        credit:        0,
        balance:       prevBalance + total,
      },
    });
  }

  revalidatePath(`/${agencySlug}/ordenes-pago`);
  return inv.id;
}

// ─── Obtener facturas de compra pendientes por prestador ─────────────────────

export async function getPendingPurchaseInvoicesByProvider(
  agencyId: string,
  providerId: string,
  currency: string,
) {
  return prisma.purchaseInvoice.findMany({
    where: {
      agencyId,
      providerId,
      currency:  currency as "PESOS" | "USD",
      isVoided:  false,
      balance:   { gt: 0 },
      type:      { in: ["FA", "ND"] },
    },
    orderBy: [{ date: "asc" }, { number: "asc" }],
    select: {
      id:       true,
      type:     true,
      number:   true,
      date:     true,
      total:    true,
      balance:  true,
      currency: true,
    },
  });
}

// ─── Crear orden de pago ──────────────────────────────────────────────────────

const OPItemSchema = z.object({
  purchaseInvoiceId: z.string().min(1),
  amount:            z.coerce.number().positive(),
});

const OPCheckSchema = z.object({
  number:        z.string().min(1),
  bank:          z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  issuedAt:      z.coerce.date().optional().nullable(),
  deferredDate:  z.coerce.date().optional().nullable(),
  beneficiary:   z.string().optional().nullable(),
  amount:        z.coerce.number().positive(),
});

const PaymentOrderSchema = z.object({
  providerId:    z.string().min(1),
  date:          z.coerce.date(),
  currency:      z.enum(["PESOS", "USD"]),
  exchangeRate:  z.coerce.number().optional().nullable(),
  concept:       z.string().optional().nullable(),
  origin:        z.string().optional().nullable(),
  items:         z.array(OPItemSchema).min(1, "Seleccione al menos una factura"),
  checks:        z.array(OPCheckSchema).default([]),
});

export async function createPaymentOrder(
  agencyId: string,
  agencySlug: string,
  createdBy: string,
  data: unknown,
) {
  const v = PaymentOrderSchema.parse(data);

  // Verificar facturas
  const invoices = await prisma.purchaseInvoice.findMany({
    where: { id: { in: v.items.map((i) => i.purchaseInvoiceId) }, agencyId },
    select: { id: true, balance: true, number: true },
  });
  if (invoices.length !== v.items.length) throw new Error("Facturas inválidas");

  for (const item of v.items) {
    const inv = invoices.find((i) => i.id === item.purchaseInvoiceId);
    if (!inv) throw new Error("Factura no encontrada");
    if (parseFloat(String(inv.balance)) < item.amount - 0.01) {
      throw new Error(`El importe supera el saldo de la factura ${inv.number}`);
    }
  }

  const totalAmount = v.items.reduce((s, i) => s + i.amount, 0);
  const checkAmount = v.checks.reduce((s, c) => s + c.amount, 0);
  const cashAmount  = parseFloat((totalAmount - checkAmount).toFixed(2));

  if (cashAmount < -0.01) throw new Error("El importe de cheques supera el total de la orden");

  const paymentMethod = checkAmount > 0 && cashAmount > 0.01 ? "MIXTO"
    : checkAmount > 0 ? "CHEQUES"
    : "EFECTIVO";

  // Número correlativo
  const last = await prisma.paymentOrder.findFirst({
    where:   { agencyId },
    orderBy: { number: "desc" },
    select:  { number: true },
  });
  const number = (last?.number ?? 0) + 1;

  // Saldo anterior cc prestador
  const lastMov = await prisma.providerAccountMovement.findFirst({
    where:   { agencyId, providerId: v.providerId, currency: v.currency },
    orderBy: { createdAt: "desc" },
    select:  { balance: true },
  });
  const prevBalance = parseFloat(String(lastMov?.balance ?? 0));
  const newBalance  = parseFloat((prevBalance - totalAmount).toFixed(2));

  // Caja abierta hoy
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const openCash = await prisma.dailyCash.findFirst({
    where: { agencyId, currency: v.currency, status: "OPEN", date: { gte: today, lt: tomorrow } },
  });

  const op = await prisma.$transaction(async (tx) => {
    // 1. Crear OP
    const order = await tx.paymentOrder.create({
      data: {
        agencyId,
        providerId:    v.providerId,
        number,
        date:          v.date,
        currency:      v.currency,
        exchangeRate:  v.exchangeRate ?? null,
        paymentMethod,
        totalAmount,
        cashAmount:    Math.max(cashAmount, 0),
        checkAmount,
        concept:       v.concept ?? null,
        origin:        v.origin ?? null,
        createdBy,
      },
    });

    // 2. Items
    await tx.paymentOrderItem.createMany({
      data: v.items.map((item) => ({
        paymentOrderId:    order.id,
        purchaseInvoiceId: item.purchaseInvoiceId,
        amount:            item.amount,
        currency:          v.currency,
      })),
    });

    // 3. Actualizar balances de facturas de compra
    for (const item of v.items) {
      await tx.purchaseInvoice.update({
        where: { id: item.purchaseInvoiceId },
        data:  { balance: { decrement: item.amount } },
      });
    }

    // 4. Cheques propios emitidos
    if (v.checks.length > 0) {
      await tx.check.createMany({
        data: v.checks.map((c) => ({
          agencyId,
          paymentOrderId: order.id,
          number:         c.number,
          bank:           c.bank ?? null,
          accountNumber:  c.accountNumber ?? null,
          issuedAt:       c.issuedAt ?? null,
          deferredDate:   c.deferredDate ?? null,
          drawer:         null, // propio
          beneficiary:    c.beneficiary ?? null,
          amount:         c.amount,
          isOwn:          true,
          inPortfolio:    false,
          sentAt:         v.date,
        })),
      });
    }

    // 5. Movimiento cc prestador (crédito / pago)
    const opNumber = `OP-${String(number).padStart(8, "0")}`;
    await tx.providerAccountMovement.create({
      data: {
        agencyId,
        providerId:    v.providerId,
        date:          v.date,
        type:          "CREDIT",
        voucherType:   "Orden de Pago",
        voucherNumber: opNumber,
        currency:      v.currency,
        debit:         0,
        credit:        totalAmount,
        balance:       newBalance,
        paymentOrderId: order.id,
      },
    });

    // 6. Asiento en caja (salida)
    if (openCash) {
      await tx.cashTransaction.create({
        data: {
          dailyCashId:   openCash.id,
          direction:     "OUT",
          origin:        "AdminCobranza",
          voucherType:   "Orden de Pago",
          voucherNumber: opNumber,
          amount:        totalAmount,
          description:   `Pago a prestador`,
          sourceId:      order.id,
        },
      });
      await tx.dailyCash.update({
        where: { id: openCash.id },
        data:  { totalOut: { increment: totalAmount } },
      });
    }

    return order;
  });

  revalidatePath(`/${agencySlug}/ordenes-pago`);
  redirect(`/${agencySlug}/ordenes-pago/${op.id}`);
}
