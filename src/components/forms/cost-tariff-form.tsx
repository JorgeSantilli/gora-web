"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TariffDetailsEditor, type ServiceType, type DetailRow } from "./tariff-details-editor";
import { createCost, updateCost, deleteCost, createTariff, updateTariff, deleteTariff } from "@/actions/tarifas.actions";

interface LookupItem {
  id: string;
  label: string;
}

interface Provider {
  id: string;
  fantasyName: string;
}

interface CostTariffData {
  id: string;
  providerId: string;
  validFrom: Date;
  validTo: Date;
  currency: string;
  serviceType: string;
  details: unknown;
}

interface CostTariffFormProps {
  mode: "cost" | "tariff";
  agencyId: string;
  agencySlug: string;
  item?: CostTariffData;
  providers: Provider[];
  pensionRegimes: LookupItem[];
  roomTypes: LookupItem[];
  foodTypes: LookupItem[];
  excursionCodes: LookupItem[];
  transferSegments: LookupItem[];
  ticketSegments: LookupItem[];
}

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "HOTEL",     label: "Hotel / Alojamiento" },
  { value: "MEAL",      label: "Comidas" },
  { value: "EXCURSION", label: "Excursiones" },
  { value: "TRANSFER",  label: "Traslados" },
  { value: "TICKET",    label: "Tickets / Aéreos" },
  { value: "RENTAL",    label: "Rentas" },
  { value: "MISC",      label: "Varios" },
];

function toInputDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().substring(0, 10);
}

export function CostTariffForm({
  mode, agencyId, agencySlug, item,
  providers, pensionRegimes, roomTypes, foodTypes, excursionCodes, transferSegments, ticketSegments,
}: CostTariffFormProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [providerId, setProviderId]   = useState(item?.providerId ?? "");
  const [validFrom, setValidFrom]     = useState(toInputDate(item?.validFrom));
  const [validTo, setValidTo]         = useState(toInputDate(item?.validTo));
  const [currency, setCurrency]       = useState(item?.currency ?? "PESOS");
  const [serviceType, setServiceType] = useState<ServiceType>((item?.serviceType as ServiceType) ?? "HOTEL");
  const [details, setDetails]         = useState<DetailRow[]>((item?.details as DetailRow[]) ?? []);

  function handleServiceTypeChange(type: ServiceType) {
    setServiceType(type);
    setDetails([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId) { toast.error("Seleccione un prestador"); return; }
    if (!validFrom || !validTo) { toast.error("Complete las fechas de vigencia"); return; }

    const data = { providerId, validFrom, validTo, currency, serviceType, details };

    start(async () => {
      try {
        if (item) {
          if (mode === "cost") await updateCost(item.id, agencyId, agencySlug, data);
          else await updateTariff(item.id, agencyId, agencySlug, data);
        } else {
          if (mode === "cost") await createCost(agencyId, agencySlug, data);
          else await createTariff(agencyId, agencySlug, data);
        }
      } catch {
        toast.error("Error al guardar");
      }
    });
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm("¿Eliminar esta tarifa? Esta acción no se puede deshacer.")) return;
    start(async () => {
      try {
        if (mode === "cost") await deleteCost(item.id, agencyId, agencySlug);
        else await deleteTariff(item.id, agencyId, agencySlug);
      } catch {
        toast.error("Error al eliminar");
      }
    });
  }

  const modeLabel = mode === "cost" ? "Costo" : "Tarifa de Venta";
  const backTab = mode === "cost" ? "costos" : "ventas";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Prestador + Tipo servicio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Prestador *</Label>
          <Select value={providerId} onValueChange={(v) => setProviderId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar prestador..." />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.fantasyName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Tipo de servicio *</Label>
          <Select
            value={serviceType}
            onValueChange={(v) => handleServiceTypeChange((v ?? "HOTEL") as ServiceType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map((st) => (
                <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
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
            id="validFrom"
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="validTo">Vigencia hasta *</Label>
          <input
            id="validTo"
            type="date"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Moneda</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v ?? "PESOS")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PESOS">Pesos ($)</SelectItem>
              <SelectItem value="USD">Dólares (u$s)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Detalles dinámicos */}
      <div className="space-y-2">
        <Label>Detalle de tarifas</Label>
        <p className="text-xs text-muted-foreground">
          Cada fila define un rango de precios según el tipo de servicio seleccionado.
          {serviceType === "HOTEL" && " Al cambiar el tipo de servicio se limpian las filas existentes."}
        </p>
        <div className="rounded-md border p-4">
          <TariffDetailsEditor
            serviceType={serviceType}
            value={details}
            onChange={setDetails}
            pensionRegimes={pensionRegimes}
            roomTypes={roomTypes}
            foodTypes={foodTypes}
            excursionCodes={excursionCodes}
            transferSegments={transferSegments}
            ticketSegments={ticketSegments}
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {item ? `Actualizar ${modeLabel}` : `Crear ${modeLabel}`}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.push(`/${agencySlug}/tarifas?tab=${backTab}`)}
        >
          Cancelar
        </Button>
        {item && (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
            className="ml-auto"
          >
            Eliminar
          </Button>
        )}
      </div>
    </form>
  );
}
