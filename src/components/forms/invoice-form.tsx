"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { InvoiceItemsEditor, emptyItem, type InvoiceItemRow } from "./invoice-items-editor";
import { createInvoice, createCreditNote } from "@/actions/facturacion.actions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SalePoint {
  id:     string;
  number: number;
  name:   string | null;
}

interface Client {
  id:          string;
  fantasyName: string;
  taxPosition: string | null;
  taxId:       string | null;
}

interface OriginalInvoice {
  id:         string;
  displayNumber: string;
  letter:     string;
  clientId:   string;
  serviceFrom: string | null;
  serviceTo:   string | null;
}

interface InvoiceFormProps {
  mode:          "nueva" | "nc"; // nueva factura/ND, o nota de crédito
  agencyId:      string;
  agencySlug:    string;
  salePoints:    SalePoint[];
  clients:       Client[];
  // Para NC:
  original?:     OriginalInvoice;
}

function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().substring(0, 10);
}

const TYPE_OPTIONS = [
  { value: "FA", label: "Factura" },
  { value: "ND", label: "Nota de Débito" },
];

export function InvoiceForm({
  mode, agencyId, agencySlug, salePoints, clients, original,
}: InvoiceFormProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // Header state
  const [type, setType]             = useState(mode === "nc" ? "NC" : "FA");
  const [salePointId, setSalePointId] = useState(salePoints[0]?.id ?? "");
  const [clientId, setClientId]     = useState(original?.clientId ?? "");
  const [date, setDate]             = useState(toInputDate(new Date()));
  const [serviceFrom, setServiceFrom] = useState(original?.serviceFrom ? toInputDate(original.serviceFrom) : "");
  const [serviceTo, setServiceTo]   = useState(original?.serviceTo ? toInputDate(original.serviceTo) : "");
  const [currency, setCurrency]     = useState("PESOS");
  const [exchangeRate, setExchangeRate] = useState("");

  // Items
  const [items, setItems] = useState<InvoiceItemRow[]>([emptyItem()]);

  // Derived: letra según condición fiscal del cliente
  const selectedClient = clients.find((c) => c.id === clientId);
  const letter = selectedClient?.taxPosition === "RI" ? "A" : "B";

  // Auto-set serviceFrom/To when date changes (default: same month)
  useEffect(() => {
    if (!serviceFrom && date) {
      const d = new Date(date);
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      setServiceFrom(toInputDate(from));
      setServiceTo(toInputDate(to));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId)    { toast.error("Seleccione un cliente"); return; }
    if (!salePointId) { toast.error("Seleccione un punto de venta"); return; }
    if (!date)        { toast.error("Ingrese la fecha"); return; }
    if (items.every((i) => !i.description || i.amount === 0)) {
      toast.error("Agregue al menos un ítem con importe"); return;
    }

    const data = {
      clientId,
      salePointId,
      type,
      date,
      serviceFrom: serviceFrom || null,
      serviceTo:   serviceTo || null,
      currency,
      exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
      items: items.map(({ description, vatConcept, amount }) => ({ description, vatConcept, amount })),
      creditNoteFor: mode === "nc" ? original?.id : null,
    };

    start(async () => {
      try {
        if (mode === "nc" && original) {
          await createCreditNote(agencyId, agencySlug, original.id, data);
        } else {
          await createInvoice(agencyId, agencySlug, data);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const isNC = mode === "nc";
  const title = isNC ? `Nota de Crédito — ${original?.displayNumber}` : "Nuevo Comprobante";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info NC */}
      {isNC && original && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm">
          <p className="font-medium">Nota de Crédito sobre: <span className="font-mono">{original.displayNumber}</span></p>
          <p className="text-muted-foreground text-xs mt-0.5">La NC hereda la letra de la factura original ({original.letter}).</p>
        </div>
      )}

      {/* Tipo + Punto de Venta */}
      {!isNC && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tipo de comprobante *</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "FA")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Punto de venta *</Label>
            <Select value={salePointId} onValueChange={(v) => setSalePointId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {salePoints.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id}>
                    {String(sp.number).padStart(4, "0")} {sp.name ? `— ${sp.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Cliente + Letra (auto) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Cliente *</Label>
          {isNC ? (
            <p className="text-sm py-2 text-muted-foreground">
              {clients.find((c) => c.id === clientId)?.fantasyName ?? "—"}
            </p>
          ) : (
            <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.fantasyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {clientId && (
          <div className="space-y-1.5">
            <Label>Letra del comprobante</Label>
            <div className="flex items-center gap-2 py-2">
              <Badge variant={letter === "A" ? "default" : "secondary"} className="text-sm px-3">
                {letter === "A" ? "A — RI (IVA discriminado)" : "B — Consumidor / No RI"}
              </Badge>
              {selectedClient?.taxId && (
                <span className="text-xs text-muted-foreground">{selectedClient.taxId}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fecha + Período + Moneda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="date">Fecha *</Label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="serviceFrom">Período desde</Label>
          <input id="serviceFrom" type="date" value={serviceFrom} onChange={(e) => setServiceFrom(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="serviceTo">Período hasta</Label>
          <input id="serviceTo" type="date" value={serviceTo} onChange={(e) => setServiceTo(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
        </div>
        <div className="space-y-1.5">
          <Label>Moneda</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v ?? "PESOS")}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PESOS">Pesos ($)</SelectItem>
              <SelectItem value="USD">Dólares (u$s)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {currency === "USD" && (
        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="exchangeRate">Tipo de cambio ($ por u$s)</Label>
          <Input id="exchangeRate" type="number" min={0} step={0.01} value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)} placeholder="1200.00" />
        </div>
      )}

      {/* Ítems */}
      <div className="space-y-2">
        <Label>Ítems del comprobante *</Label>
        <div className="rounded-md border p-4">
          <InvoiceItemsEditor items={items} onChange={setItems} letter={letter as "A" | "B"} />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {isNC ? "Emitir Nota de Crédito" : "Emitir Comprobante"}
        </Button>
        <Button type="button" variant="outline" disabled={pending}
          onClick={() => router.push(`/${agencySlug}/facturacion`)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
