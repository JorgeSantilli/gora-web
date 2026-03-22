"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createPurchaseInvoice } from "@/actions/ordenes-pago.actions";

interface Provider {
  id:          string;
  fantasyName: string;
  taxId:       string | null;
  taxPosition: string | null;
  address:     string | null;
}

interface Props {
  agencyId:   string;
  agencySlug: string;
  providers:  Provider[];
}

const TAX_POSITIONS = [
  { value: "RI", label: "Responsable Inscripto" },
  { value: "MO", label: "Monotributista" },
  { value: "CF", label: "Consumidor Final" },
  { value: "EX", label: "Exento" },
  { value: "NC", label: "No Categorizado" },
];

export function PurchaseInvoiceForm({ agencyId, agencySlug, providers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const [providerId,      setProviderId]      = useState("");
  const [providerName,    setProviderName]    = useState("");
  const [providerTaxId,   setProviderTaxId]   = useState("");
  const [providerTaxPos,  setProviderTaxPos]  = useState("");
  const [providerAddress, setProviderAddress] = useState("");
  const [isEventual,      setIsEventual]      = useState(false);

  const [type,         setType]         = useState("FA");
  const [number,       setNumber]       = useState("");
  const [date,         setDate]         = useState(today);
  const [currency,     setCurrency]     = useState("PESOS");
  const [exchangeRate, setExchangeRate] = useState("");
  const [taxable,      setTaxable]      = useState("");
  const [nonComputed,  setNonComputed]  = useState("");
  const [exempt,       setExempt]       = useState("");
  const [vat,          setVat]          = useState("");
  const [taxes,        setTaxes]        = useState("");

  const n = (v: string) => parseFloat(v) || 0;
  const total = n(taxable) + n(nonComputed) + n(exempt) + n(vat) + n(taxes);
  const symbol = currency === "USD" ? "u$s" : "$";

  function handleProviderChange(id: string) {
    setProviderId(id);
    if (id === "eventual") {
      setIsEventual(true);
      setProviderName(""); setProviderTaxId(""); setProviderTaxPos(""); setProviderAddress("");
    } else {
      setIsEventual(false);
      const prov = providers.find((p) => p.id === id);
      if (prov) {
        setProviderName(prov.fantasyName);
        setProviderTaxId(prov.taxId ?? "");
        setProviderTaxPos(prov.taxPosition ?? "");
        setProviderAddress(prov.address ?? "");
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createPurchaseInvoice(agencyId, agencySlug, {
          providerId:      isEventual ? null : (providerId || null),
          providerName:    providerName || null,
          providerTaxId:   providerTaxId || null,
          providerTaxPos:  providerTaxPos || null,
          providerAddress: providerAddress || null,
          type,
          number,
          date,
          currency,
          exchangeRate:    exchangeRate ? parseFloat(exchangeRate) : null,
          taxable:         n(taxable),
          nonComputed:     n(nonComputed),
          exempt:          n(exempt),
          vat:             n(vat),
          taxes:           n(taxes),
        });
        router.push(`/${agencySlug}/ordenes-pago`);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Prestador */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold text-sm">Prestador / Proveedor</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Prestador</Label>
            <Select value={providerId} onValueChange={(v) => handleProviderChange(v ?? "")}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.fantasyName}</SelectItem>
                ))}
                <SelectItem value="eventual">— Proveedor eventual —</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isEventual && (
            <>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Razón social / Nombre *</Label>
                <Input className="h-8 text-sm" value={providerName}
                  onChange={(e) => setProviderName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CUIT</Label>
                <Input className="h-8 text-sm font-mono" value={providerTaxId}
                  onChange={(e) => setProviderTaxId(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Condición IVA</Label>
                <Select value={providerTaxPos} onValueChange={(v) => setProviderTaxPos(v ?? "")}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {TAX_POSITIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Datos del comprobante */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold text-sm">Datos del comprobante</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "FA")}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FA">Factura</SelectItem>
                <SelectItem value="ND">Nota de Débito</SelectItem>
                <SelectItem value="NC">Nota de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Número *</Label>
            <Input className="h-8 text-sm font-mono" placeholder="0001-00001234"
              value={number} onChange={(e) => setNumber(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fecha *</Label>
            <Input type="date" className="h-8 text-sm" value={date}
              onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Moneda</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v ?? "PESOS")}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PESOS">PESOS</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {currency === "USD" && (
            <div className="space-y-1">
              <Label className="text-xs">Tipo de cambio</Label>
              <Input className="h-8 text-sm font-mono" type="number" step="0.01"
                value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Importes */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold text-sm">Importes ({symbol})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Neto Gravado",  state: taxable,     setState: setTaxable },
            { label: "No Computable", state: nonComputed, setState: setNonComputed },
            { label: "Exento",        state: exempt,      setState: setExempt },
            { label: "IVA",           state: vat,         setState: setVat },
            { label: "Otros tributos",state: taxes,       setState: setTaxes },
          ].map(({ label, state, setState }) => (
            <div key={label} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input className="h-8 text-sm font-mono text-right" type="number" step="0.01" min="0"
                placeholder="0.00" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-1 border-t">
          <span className="font-semibold text-sm">
            Total: <span className="font-mono">{symbol} {total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || !number || total <= 0}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar Factura
        </Button>
        <Button type="button" variant="ghost"
          render={<Link href={`/${agencySlug}/ordenes-pago`} />}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

import Link from "next/link";
