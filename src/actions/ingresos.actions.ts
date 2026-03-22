"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const ReceiptItemSchema = z.object({
  invoiceId: z.string().min(1),
  amount:    z.coerce.number().positive(),
});

const CheckInputSchema = z.object({
  number:        z.string().min(1),
  bank:          z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  issuedAt:      z.coerce.date().optional().nullable(),
  deferredDate:  z.coerce.date().optional().nullable(),
  drawer:        z.string().optional().nullable(),
  beneficiary:   z.string().optional().nullable(),
  amount:        z.coerce.number().positive(),
});

const CurrencyBillInputSchema = z.object({
  serialNumber: z.string().min(1),
  amount:       z.coerce.number().positive(),
  deliveredBy:  z.string().optional().nullable(),
});

const ReceiptSchema = z.object({
  clientId:      z.string().min(1),
  reservationId: z.string().optional().nullable(),
  date:          z.coerce.date(),
  currency:      z.enum(["PESOS", "USD"]),
  exchangeRate:  z.coerce.number().optional().nullable(),
  origin:        z.string().optional().nullable(),
  items:         z.array(ReceiptItemSchema).min(1, "Seleccione al menos una factura"),
  checks:        z.array(CheckInputSchema).default([]),
  bills:         z.array(CurrencyBillInputSchema).default([]),
});

// ─── Crear recibo ─────────────────────────────────────────────────────────────

export async function createReceipt(
  agencyId: string,
  agencySlug: string,
  createdBy: string,
  data: unknown,
) {
  const v = ReceiptSchema.parse(data);

  // Verificar que todas las facturas pertenecen a la agencia y tienen saldo
  const invoices = await prisma.invoice.findMany({
    where: { id: { in: v.items.map((i) => i.invoiceId) }, agencyId },
    select: { id: true, balance: true, currency: true, salePoint: true, letter: true, type: true, number: true },
  });
  if (invoices.length !== v.items.length) throw new Error("Facturas inválidas");

  for (const item of v.items) {
    const inv = invoices.find((i) => i.id === item.invoiceId);
    if (!inv) throw new Error("Factura no encontrada");
    if (parseFloat(String(inv.balance)) < item.amount) {
      throw new Error(`El importe supera el saldo de la factura ${inv.letter}-${String(inv.salePoint).padStart(4,"0")}-${String(inv.number).padStart(8,"0")}`);
    }
  }

  const totalAmount  = v.items.reduce((s, i) => s + i.amount, 0);
  const checkAmount  = v.checks.reduce((s, c) => s + c.amount, 0);
  const billAmount   = v.bills.reduce((s, b) => s + b.amount, 0);
  const cashAmount   = parseFloat((totalAmount - checkAmount - billAmount).toFixed(2));

  if (cashAmount < -0.01) throw new Error("El importe de cheques/billetes supera el total del recibo");

  // Número correlativo por agencia
  const last = await prisma.receipt.findFirst({
    where:   { agencyId },
    orderBy: { number: "desc" },
    select:  { number: true },
  });
  const number = (last?.number ?? 0) + 1;

  // Saldo anterior en cc del cliente (misma moneda)
  const lastMovement = await prisma.clientAccountMovement.findFirst({
    where:   { agencyId, clientId: v.clientId, currency: v.currency },
    orderBy: { createdAt: "desc" },
    select:  { balance: true },
  });
  const prevBalance  = parseFloat(String(lastMovement?.balance ?? 0));
  const newBalance   = parseFloat((prevBalance - totalAmount).toFixed(2));

  // Caja abierta hoy para esta moneda (para asentar el ingreso)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const openCash = await prisma.dailyCash.findFirst({
    where: {
      agencyId,
      currency: v.currency,
      status:   "OPEN",
      date:     { gte: today, lt: tomorrow },
    },
  });

  // Transacción atómica
  const receipt = await prisma.$transaction(async (tx) => {
    // 1. Crear recibo
    const rc = await tx.receipt.create({
      data: {
        agencyId,
        clientId:      v.clientId,
        reservationId: v.reservationId ?? null,
        number,
        date:          v.date,
        currency:      v.currency,
        exchangeRate:  v.exchangeRate ?? null,
        totalAmount,
        cashAmount:    Math.max(cashAmount, 0),
        checkAmount,
        origin:        v.origin ?? null,
        createdBy,
      },
    });

    // 2. Items (factura↔recibo)
    await tx.receiptItem.createMany({
      data: v.items.map((item) => ({
        receiptId: rc.id,
        invoiceId: item.invoiceId,
        amount:    item.amount,
        currency:  v.currency,
      })),
    });

    // 3. Actualizar balance de cada factura
    for (const item of v.items) {
      await tx.invoice.update({
        where: { id: item.invoiceId },
        data:  { balance: { decrement: item.amount } },
      });
    }

    // 4. Cheques
    if (v.checks.length > 0) {
      await tx.check.createMany({
        data: v.checks.map((c) => ({
          agencyId,
          receiptId:     rc.id,
          number:        c.number,
          bank:          c.bank ?? null,
          accountNumber: c.accountNumber ?? null,
          issuedAt:      c.issuedAt ?? null,
          deferredDate:  c.deferredDate ?? null,
          drawer:        c.drawer ?? null,
          beneficiary:   c.beneficiary ?? null,
          amount:        c.amount,
          isOwn:         false,
          inPortfolio:   true,
          receivedAt:    v.date,
        })),
      });
    }

    // 5. Billetes (USD)
    if (v.bills.length > 0) {
      await tx.currencyBill.createMany({
        data: v.bills.map((b) => ({
          agencyId,
          receiptId:    rc.id,
          currency:     "USD" as const,
          serialNumber: b.serialNumber,
          amount:       b.amount,
          deliveredBy:  b.deliveredBy ?? null,
          receivedAt:   v.date,
        })),
      });
    }

    // 6. Movimiento cuenta corriente cliente (crédito)
    const formatNum = (sp: number, n: number, l: string, t: string) =>
      `${l}-${String(sp).padStart(4,"0")}-${String(n).padStart(8,"0")} (RC ${number})`;
    const voucherDetail = `RC-${String(number).padStart(8,"0")}`;

    await tx.clientAccountMovement.create({
      data: {
        agencyId,
        clientId:      v.clientId,
        reservationId: v.reservationId ?? null,
        date:          v.date,
        type:          "CREDIT",
        voucherType:   "Recibo",
        voucherNumber: voucherDetail,
        currency:      v.currency,
        debit:         0,
        credit:        totalAmount,
        balance:       newBalance,
        receiptId:     rc.id,
      },
    });

    // 7. Asiento en caja (si hay caja abierta hoy)
    if (openCash) {
      await tx.cashTransaction.create({
        data: {
          dailyCashId:   openCash.id,
          direction:     "IN",
          origin:        "AdminCobranza",
          voucherType:   "Recibo",
          voucherNumber: voucherDetail,
          amount:        totalAmount,
          description:   `Cobro a cliente`,
          sourceId:      rc.id,
        },
      });
      await tx.dailyCash.update({
        where: { id: openCash.id },
        data:  { totalIn: { increment: totalAmount } },
      });
    }

    return rc;
  });

  revalidatePath(`/${agencySlug}/ingresos`);
  redirect(`/${agencySlug}/ingresos/${receipt.id}`);
}

// ─── Obtener facturas pendientes por cliente ──────────────────────────────────

export async function getPendingInvoicesByClient(
  agencyId: string,
  clientId: string,
  currency: string,
) {
  return prisma.invoice.findMany({
    where: {
      agencyId,
      clientId,
      currency: currency as "PESOS" | "USD",
      isVoided: false,
      balance:  { gt: 0 },
      type:     { in: ["FA", "ND"] }, // NC no genera deuda
    },
    orderBy: [{ date: "asc" }, { number: "asc" }],
    select: {
      id:       true,
      letter:   true,
      type:     true,
      salePoint: true,
      number:   true,
      date:     true,
      total:    true,
      balance:  true,
      currency: true,
    },
  });
}
