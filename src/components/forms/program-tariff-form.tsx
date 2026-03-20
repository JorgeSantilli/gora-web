"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ProgramTariffDetailsEditor, type ProgramDetailRow } from "./tariff-details-editor";
import { createProgramTariff, updateProgramTariff, deleteProgramTariff } from "@/actions/tarifas.actions";

interface LookupItem {
  id: string;
  label: string;
}

interface Program {
  id: string;
  code: number;
  name: string;
}

interface ProgramTariffData {
  id: string;
  programId: string;
  medium: string;
  validFrom: Date;
  validTo: Date;
  currency: string;
  transportTaxable: unknown;
  exempt: unknown;
  taxes: unknown;
  details: unknown;
}

interface ProgramTariffFormProps {
  agencyId: string;
  agencySlug: string;
  item?: ProgramTariffData;
  programs: Program[];
  roomTypes: LookupItem[];
  pensionRegimes: LookupItem[];
}

function toInputDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().substring(0, 10);
}

const MEDIUM_OPTIONS = [
  { value: "SIN_TRANSPORTE", label: "Sin transporte" },
  { value: "CON_BUS",        label: "Con bus" },
  { value: "CON_AEREO",      label: "Con aéreo" },
];

export function ProgramTariffForm({
  agencyId, agencySlug, item, programs, roomTypes, pensionRegimes,
}: ProgramTariffFormProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [programId, setProgramId]               = useState(item?.programId ?? "");
  const [medium, setMedium]                     = useState(item?.medium ?? "SIN_TRANSPORTE");
  const [validFrom, setValidFrom]               = useState(toInputDate(item?.validFrom));
  const [validTo, setValidTo]                   = useState(toInputDate(item?.validTo));
  const [currency, setCurrency]                 = useState(item?.currency ?? "PESOS");
  const [transportTaxable, setTransportTaxable] = useState(item?.transportTaxable ? String(item.transportTaxable) : "");
  const [exempt, setExempt]                     = useState(item?.exempt ? String(item.exempt) : "");
  const [taxes, setTaxes]                       = useState(item?.taxes ? String(item.taxes) : "");
  const [details, setDetails]                   = useState<ProgramDetailRow[]>((item?.details as ProgramDetailRow[]) ?? []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!programId) { toast.error("Seleccione un programa"); return; }
    if (!validFrom || !validTo) { toast.error("Complete las fechas de vigencia"); return; }

    const data = {
      programId, medium, validFrom, validTo, currency,
      transportTaxable: transportTaxable ? parseFloat(transportTaxable) : null,
      exempt: exempt ? parseFloat(exempt) : null,
      taxes: taxes ? parseFloat(taxes) : null,
      details,
    };

    start(async () => {
      try {
        if (item) await updateProgramTariff(item.id, agencyId, agencySlug, data);
        else await createProgramTariff(agencyId, agencySlug, data);
      } catch {
        toast.error("Error al guardar");
      }
    });
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm("¿Eliminar esta tarifa de programa? Esta acción no se puede deshacer.")) return;
    start(async () => {
      try {
        await deleteProgramTariff(item.id, agencyId, agencySlug);
      } catch {
        toast.error("Error al eliminar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Programa + Medio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Programa *</Label>
          <Select value={programId} onValueChange={(v) => setProgramId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar programa..." />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Medio de transporte</Label>
          <Select value={medium} onValueChange={(v) => setMedium(v ?? "SIN_TRANSPORTE")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEDIUM_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vigencia + Moneda */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="validFrom">Vigencia desde *</Label>
          <input
            id="validFrom" type="date" value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)} required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="validTo">Vigencia hasta *</Label>
          <input
            id="validTo" type="date" value={validTo}
            onChange={(e) => setValidTo(e.target.value)} required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
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

      {/* Importes fiscales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="transportTaxable">Gravado transporte</Label>
          <Input id="transportTaxable" type="number" min={0} step={0.01} value={transportTaxable} onChange={(e) => setTransportTaxable(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exempt">Exento</Label>
          <Input id="exempt" type="number" min={0} step={0.01} value={exempt} onChange={(e) => setExempt(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="taxes">Impuestos</Label>
          <Input id="taxes" type="number" min={0} step={0.01} value={taxes} onChange={(e) => setTaxes(e.target.value)} placeholder="0.00" />
        </div>
      </div>

      {/* Detalle */}
      <div className="space-y-2">
        <Label>Detalle por hotel / habitación / rango de pax</Label>
        <div className="rounded-md border p-4">
          <ProgramTariffDetailsEditor
            value={details}
            onChange={setDetails}
            roomTypes={roomTypes}
            pensionRegimes={pensionRegimes}
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {item ? "Actualizar Tarifa de Programa" : "Crear Tarifa de Programa"}
        </Button>
        <Button type="button" variant="outline" disabled={pending}
          onClick={() => router.push(`/${agencySlug}/tarifas?tab=programas`)}>
          Cancelar
        </Button>
        {item && (
          <Button type="button" variant="destructive" disabled={pending}
            onClick={handleDelete} className="ml-auto">
            Eliminar
          </Button>
        )}
      </div>
    </form>
  );
}
