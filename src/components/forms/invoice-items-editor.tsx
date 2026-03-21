"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VatConcept = "GRAVADO" | "GRAVADO_TRANSPORTE" | "NO_COMPUTABLE" | "EXENTO" | "IMPUESTOS";

export interface InvoiceItemRow {
  _id:        string;
  description: string;
  vatConcept: VatConcept;
  amount:     number;
}

const VAT_CONCEPTS: { value: VatConcept; label: string; rate: string }[] = [
  { value: "GRAVADO",            label: "Gravado 21%",              rate: "21%" },
  { value: "GRAVADO_TRANSPORTE", label: "Gravado Transporte 10.5%", rate: "10.5%" },
  { value: "NO_COMPUTABLE",      label: "No Computable",            rate: "0%" },
  { value: "EXENTO",             label: "Exento",                   rate: "0%" },
  { value: "IMPUESTOS",          label: "Impuestos / Tributos",     rate: "—" },
];

export function emptyItem(): InvoiceItemRow {
  return { _id: nanoid(), description: "", vatConcept: "GRAVADO", amount: 0 };
}

// ─── Totals calculator ───────────────────────────────────────────────────────

export interface InvoiceTotals {
  taxableAmount:    number;
  transportTaxable: number;
  nonComputed:      number;
  exempt:           number;
  vatGeneral:       number;
  vatTransport:     number;
  taxes:            number;
  total:            number;
}

export function calculateTotals(items: InvoiceItemRow[]): InvoiceTotals {
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

// ─── Component ───────────────────────────────────────────────────────────────

interface InvoiceItemsEditorProps {
  items:    InvoiceItemRow[];
  onChange: (items: InvoiceItemRow[]) => void;
  letter?:  "A" | "B"; // A discrimina IVA, B no (pero igual se carga)
}

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function InvoiceItemsEditor({ items, onChange, letter = "B" }: InvoiceItemsEditorProps) {
  const totals = calculateTotals(items);

  function addItem() {
    onChange([...items, emptyItem()]);
  }

  function updateItem(idx: number, field: keyof InvoiceItemRow, value: string | number) {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      {/* Items table */}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground pb-2">Descripción</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-2 w-52">Concepto IVA</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2 w-32">Neto / Importe</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item._id} className="align-middle">
                  <td className="pr-2 pb-1.5">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      placeholder="Descripción del servicio..."
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="pr-2 pb-1.5">
                    <Select
                      value={item.vatConcept}
                      onValueChange={(v) => updateItem(idx, "vatConcept", (v ?? "GRAVADO") as VatConcept)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VAT_CONCEPTS.map((vc) => (
                          <SelectItem key={vc.value} value={vc.value}>
                            {vc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="pr-2 pb-1.5">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.amount}
                      onChange={(e) => updateItem(idx, "amount", parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm text-right"
                    />
                  </td>
                  <td className="pb-1.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Agregar ítem
      </Button>

      {/* Totals panel */}
      {items.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-4 mt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Resumen de importes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {totals.taxableAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Neto gravado 21%</span>
                <span className="font-mono">$ {fmt(totals.taxableAmount)}</span>
              </div>
            )}
            {totals.transportTaxable > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Neto gravado 10.5%</span>
                <span className="font-mono">$ {fmt(totals.transportTaxable)}</span>
              </div>
            )}
            {totals.nonComputed > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">No computable</span>
                <span className="font-mono">$ {fmt(totals.nonComputed)}</span>
              </div>
            )}
            {totals.exempt > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exento</span>
                <span className="font-mono">$ {fmt(totals.exempt)}</span>
              </div>
            )}
            {letter === "A" && totals.vatGeneral > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA 21%</span>
                <span className="font-mono">$ {fmt(totals.vatGeneral)}</span>
              </div>
            )}
            {letter === "A" && totals.vatTransport > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA 10.5%</span>
                <span className="font-mono">$ {fmt(totals.vatTransport)}</span>
              </div>
            )}
            {totals.taxes > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos / Tributos</span>
                <span className="font-mono">$ {fmt(totals.taxes)}</span>
              </div>
            )}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between items-center">
            <span className="font-semibold">TOTAL</span>
            <span className="font-mono font-bold text-lg">$ {fmt(totals.total)}</span>
          </div>
          {letter === "B" && (totals.vatGeneral + totals.vatTransport) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              IVA incluido: $ {fmt(totals.vatGeneral + totals.vatTransport)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
