"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaxPosition, InvoiceLetter, InvoiceType } from "@/generated/prisma";
import { getInvoiceLetter } from "@/lib/invoice-utils";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const InvoiceItemSchema = z.object({
  description: z.string().min(1),
  vatConcept:  z.enum(["GRAVADO", "GRAVADO_TRANSPORTE", "NO_COMPUTABLE", "EXENTO", "IMPUESTOS"]),
  amount:      z.coerce.number(),
});

const InvoiceSchema = z.object({
  reservationId:    z.string().optional().nullable(),
  clientId:         z.string().min(1),
  salePointId:      z.string().min(1),
  type:             z.enum(["FA", "ND", "NC"]).default("FA"),
  date:             z.coerce.date(),
  serviceFrom:      z.coerce.date().optional().nullable(),
  serviceTo:        z.coerce.date().optional().nullable(),
  currency:         z.enum(["PESOS", "USD"]).default("PESOS"),
  exchangeRate:     z.coerce.number().optional().nullable(),
  items:            z.array(InvoiceItemSchema).min(1, "Agregue al menos un ítem"),
  creditNoteFor:    z.string().optional().nullable(), // solo para NC
});

// ─── Calcular importes a partir de items ─────────────────────────────────────

type ItemInput = { vatConcept: string; amount: number };

function calculateTotals(items: ItemInput[]) {
  const taxableAmount    = items.filter((i) => i.vatConcept === "GRAVADO").reduce((s, i) => s + i.amount, 0);
  const transportTaxable = items.filter((i) => i.vatConcept === "GRAVADO_TRANSPORTE").reduce((s, i) => s + i.amount, 0);
  const nonComputed      = items.filter((i) => i.vatConcept === "NO_COMPUTABLE").reduce((s, i) => s + i.amount, 0);
  const exempt           = items.filter((i) => i.vatConcept === "EXENTO").reduce((s, i) => s + i.amount, 0);
  const taxes            = items.filter((i) => i.vatConcept === "IMPUESTOS").reduce((s, i) => s + i.amount, 0);
  const vatGeneral       = parseFloat((taxableAmount * 0.21).toFixed(2));
  const vatTransport     = parseFloat((transportTaxable * 0.105).toFixed(2));
  const total            = parseFloat(
    (taxableAmount + transportTaxable + nonComputed + exempt + vatGeneral + vatTransport + taxes).toFixed(2)
  );
  return { taxableAmount, transportTaxable, nonComputed, exempt, vatGeneral, vatTransport, taxes, total };
}

// ─── Obtener/crear secuencia y número siguiente (atómico) ────────────────────

async function getNextNumber(
  agencyId: string,
  salePointId: string,
  letter: InvoiceLetter,
  type: InvoiceType,
): Promise<number> {
  // Upsert + increment atómico
  const existing = await prisma.invoiceSequence.findUnique({
    where: { salePointId_letter_type: { salePointId, letter, type } },
  });

  if (existing) {
    const updated = await prisma.invoiceSequence.update({
      where: { salePointId_letter_type: { salePointId, letter, type } },
      data:  { lastNumber: { increment: 1 } },
    });
    return updated.lastNumber;
  } else {
    const created = await prisma.invoiceSequence.create({
      data: { agencyId, salePointId, letter, type, lastNumber: 1 },
    });
    return created.lastNumber;
  }
}

// ─── Crear factura / ND ───────────────────────────────────────────────────────

export async function createInvoice(agencyId: string, agencySlug: string, data: unknown) {
  const v = InvoiceSchema.parse(data);

  // Obtener datos del cliente para determinar letra y snapshot fiscal
  const client = await prisma.client.findUnique({
    where: { id: v.clientId },
    select: { taxId: true, taxPosition: true },
  });

  const clientTaxPosition = client?.taxPosition ?? null;
  const letter = getInvoiceLetter(clientTaxPosition);

  // Obtener SalePoint para el número de PV
  const salePointRec = await prisma.salePoint.findUnique({ where: { id: v.salePointId } });
  if (!salePointRec) throw new Error("Punto de venta no encontrado");

  const number = await getNextNumber(agencyId, v.salePointId, letter, v.type as InvoiceType);
  const totals = calculateTotals(v.items);

  const invoice = await prisma.invoice.create({
    data: {
      agencyId,
      reservationId:      v.reservationId ?? null,
      clientId:           v.clientId,
      salePointId:        v.salePointId,
      salePoint:          salePointRec.number,
      letter,
      type:               v.type as InvoiceType,
      number,
      date:               v.date,
      concept:            2, // Servicios (turismo)
      serviceFrom:        v.serviceFrom ?? null,
      serviceTo:          v.serviceTo ?? null,
      clientTaxId:        client?.taxId ?? null,
      clientTaxPosition:  clientTaxPosition,
      currency:           v.currency as "PESOS" | "USD",
      exchangeRate:       v.exchangeRate ?? null,
      authorizationStatus: "LOCAL",
      ...totals,
      balance:            totals.total,
      items: {
        create: v.items.map((item) => ({
          description: item.description,
          vatConcept:  item.vatConcept as "GRAVADO" | "GRAVADO_TRANSPORTE" | "NO_COMPUTABLE" | "EXENTO" | "IMPUESTOS",
          amount:      item.amount,
        })),
      },
    },
  });

  revalidatePath(`/${agencySlug}/facturacion`);
  redirect(`/${agencySlug}/facturacion/${invoice.id}`);
}

// ─── Crear Nota de Crédito sobre una factura existente ───────────────────────

export async function createCreditNote(
  agencyId: string,
  agencySlug: string,
  originalInvoiceId: string,
  data: unknown,
) {
  const v = InvoiceSchema.parse(data);

  const original = await prisma.invoice.findUnique({ where: { id: originalInvoiceId, agencyId } });
  if (!original) throw new Error("Factura original no encontrada");
  if (original.isVoided) throw new Error("La factura ya está anulada");

  const salePointRec = await prisma.salePoint.findUnique({ where: { id: v.salePointId } });
  if (!salePointRec) throw new Error("Punto de venta no encontrado");

  const number = await getNextNumber(agencyId, v.salePointId, original.letter, "NC");
  const totals = calculateTotals(v.items);

  const nc = await prisma.invoice.create({
    data: {
      agencyId,
      reservationId:      original.reservationId,
      clientId:           original.clientId,
      salePointId:        v.salePointId,
      salePoint:          salePointRec.number,
      letter:             original.letter,
      type:               "NC",
      number,
      date:               v.date,
      concept:            original.concept,
      serviceFrom:        original.serviceFrom,
      serviceTo:          original.serviceTo,
      clientTaxId:        original.clientTaxId,
      clientTaxPosition:  original.clientTaxPosition,
      currency:           original.currency,
      exchangeRate:       original.exchangeRate,
      authorizationStatus: "LOCAL",
      ...totals,
      balance:            totals.total,
      creditNoteFor:      originalInvoiceId,
      items: {
        create: v.items.map((item) => ({
          description: item.description,
          vatConcept:  item.vatConcept as "GRAVADO" | "GRAVADO_TRANSPORTE" | "NO_COMPUTABLE" | "EXENTO" | "IMPUESTOS",
          amount:      item.amount,
        })),
      },
    },
  });

  // Actualizar balance de la factura original
  await prisma.invoice.update({
    where: { id: originalInvoiceId },
    data: {
      balance: { decrement: totals.total },
    },
  });

  revalidatePath(`/${agencySlug}/facturacion`);
  redirect(`/${agencySlug}/facturacion/${nc.id}`);
}

// ─── Anular comprobante ───────────────────────────────────────────────────────

export async function voidInvoice(id: string, agencyId: string, agencySlug: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id, agencyId } });
  if (!invoice) throw new Error("Comprobante no encontrado");
  if (invoice.isVoided) throw new Error("Ya está anulado");
  if (invoice.authorizationStatus === "AUTHORIZED") {
    throw new Error(
      "No se puede anular un comprobante ya autorizado por ARCA. Debe emitir una Nota de Crédito."
    );
  }

  await prisma.invoice.update({
    where: { id },
    data: { isVoided: true, voidedAt: new Date(), balance: 0 },
  });

  revalidatePath(`/${agencySlug}/facturacion`);
  redirect(`/${agencySlug}/facturacion`);
}

// ─── SalePoint CRUD ──────────────────────────────────────────────────────────

const SalePointSchema = z.object({
  number: z.coerce.number().int().positive().max(9999),
  name:   z.string().optional(),
  active: z.boolean().default(true),
});

export async function createSalePoint(agencyId: string, data: unknown) {
  const v = SalePointSchema.parse(data);
  await prisma.salePoint.create({
    data: { agencyId, number: v.number, name: v.name ?? null, active: v.active },
  });
  revalidatePath(`/parametros`); // refrescar en parámetros
}

export async function updateSalePoint(id: string, agencyId: string, data: unknown) {
  const v = SalePointSchema.parse(data);
  await prisma.salePoint.update({
    where: { id, agencyId },
    data: { number: v.number, name: v.name ?? null, active: v.active },
  });
}

export async function toggleSalePointActive(id: string, agencyId: string, active: boolean) {
  await prisma.salePoint.update({ where: { id, agencyId }, data: { active } });
}
