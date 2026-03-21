import type { InvoiceLetter, InvoiceType, TaxPosition } from "@/generated/prisma";

// ─── ARCA: cbteTipo mapping (para futura integración) ────────────────────────
// FA-A=1, ND-A=2, NC-A=3, FA-B=6, ND-B=7, NC-B=8
export function getCbteTipo(letter: InvoiceLetter, type: InvoiceType): number {
  if (letter === "A") {
    if (type === "FA") return 1;
    if (type === "ND") return 2;
    if (type === "NC") return 3;
  }
  if (type === "FA") return 6;
  if (type === "ND") return 7;
  if (type === "NC") return 8;
  return 6;
}

// ─── Determina letra según condición fiscal del receptor ─────────────────────
export function getInvoiceLetter(clientTaxPosition: TaxPosition | null | undefined): InvoiceLetter {
  return clientTaxPosition === "RI" ? "A" : "B";
}

// ─── Formatea número de comprobante ARCA ──────────────────────────────────────
export function formatInvoiceNumber(letter: string, salePoint: number, number: number): string {
  return `${letter}-${String(salePoint).padStart(4, "0")}-${String(number).padStart(8, "0")}`;
}
