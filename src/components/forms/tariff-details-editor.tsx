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

// ─── Types ──────────────────────────────────────────────────────────────────

export type ServiceType = "HOTEL" | "MEAL" | "EXCURSION" | "TRANSFER" | "TICKET" | "RENTAL" | "MISC";

export type DetailRow = Record<string, string | number | null>;

interface LookupItem {
  id: string;
  label: string;
}

interface TariffDetailsEditorProps {
  serviceType: ServiceType;
  value: DetailRow[];
  onChange: (rows: DetailRow[]) => void;
  pensionRegimes?: LookupItem[];
  roomTypes?: LookupItem[];
  foodTypes?: LookupItem[];
  excursionCodes?: LookupItem[];
  transferSegments?: LookupItem[];
  ticketSegments?: LookupItem[];
}

// ─── Empty row by type ───────────────────────────────────────────────────────

function emptyRow(serviceType: ServiceType): DetailRow {
  const base = { _id: nanoid() };
  switch (serviceType) {
    case "HOTEL":     return { ...base, pensionRegimeId: "", roomTypeId: "", paxFrom: 1, paxTo: 2, amount: 0 };
    case "MEAL":      return { ...base, foodTypeId: "", paxFrom: 1, paxTo: 2, amount: 0 };
    case "EXCURSION": return { ...base, excursionCodeId: "", paxFrom: 1, paxTo: 2, amount: 0 };
    case "TRANSFER":  return { ...base, transferSegmentId: "", paxFrom: 1, paxTo: 2, amount: 0 };
    case "TICKET":    return { ...base, ticketSegmentId: "", passengerType: "ADULT", amount: 0 };
    case "RENTAL":    return { ...base, description: "", days: 1, amount: 0 };
    case "MISC":      return { ...base, description: "", amount: 0 };
  }
}

// ─── Column headers ──────────────────────────────────────────────────────────

const HEADERS: Record<ServiceType, string[]> = {
  HOTEL:     ["Régimen", "Tipo hab.", "Pax desde", "Pax hasta", "Importe", ""],
  MEAL:      ["Tipo comida", "Pax desde", "Pax hasta", "Importe", ""],
  EXCURSION: ["Excursión", "Pax desde", "Pax hasta", "Importe", ""],
  TRANSFER:  ["Tramo", "Pax desde", "Pax hasta", "Importe", ""],
  TICKET:    ["Tramo ticket", "Tipo pasajero", "Importe", ""],
  RENTAL:    ["Descripción", "Días", "Importe", ""],
  MISC:      ["Descripción", "Importe", ""],
};

// ─── Row editor ──────────────────────────────────────────────────────────────

function RowEditor({
  serviceType, row, onChange, onRemove,
  pensionRegimes = [], roomTypes = [], foodTypes = [],
  excursionCodes = [], transferSegments = [], ticketSegments = [],
}: {
  serviceType: ServiceType;
  row: DetailRow;
  onChange: (row: DetailRow) => void;
  onRemove: () => void;
  pensionRegimes?: LookupItem[];
  roomTypes?: LookupItem[];
  foodTypes?: LookupItem[];
  excursionCodes?: LookupItem[];
  transferSegments?: LookupItem[];
  ticketSegments?: LookupItem[];
}) {
  function set(key: string, val: string | number | null) {
    onChange({ ...row, [key]: val });
  }

  function numTd(key: string, min = 0, w = "w-20") {
    return (
      <td className="pr-2 pb-1">
        <Input
          type="number" min={min}
          value={(row[key] as number) ?? 0}
          onChange={(e) => set(key, parseFloat(e.target.value) || 0)}
          className={`h-8 ${w} text-sm`}
        />
      </td>
    );
  }

  function selectTd(key: string, items: LookupItem[]) {
    return (
      <td className="pr-2 pb-1 min-w-[140px]">
        <Select value={(row[key] as string) || ""} onValueChange={(v) => set(key, v ?? "")}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {items.map((i) => (
              <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    );
  }

  function textTd(key: string) {
    return (
      <td className="pr-2 pb-1">
        <Input
          value={(row[key] as string) || ""}
          onChange={(e) => set(key, e.target.value)}
          className="h-8 text-sm"
        />
      </td>
    );
  }

  const removeTd = (
    <td className="pb-1">
      <Button type="button" size="icon" variant="ghost"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </td>
  );

  switch (serviceType) {
    case "HOTEL":
      return <tr>{selectTd("pensionRegimeId", pensionRegimes)}{selectTd("roomTypeId", roomTypes)}{numTd("paxFrom", 1)}{numTd("paxTo", 1)}{numTd("amount")}{removeTd}</tr>;
    case "MEAL":
      return <tr>{selectTd("foodTypeId", foodTypes)}{numTd("paxFrom", 1)}{numTd("paxTo", 1)}{numTd("amount")}{removeTd}</tr>;
    case "EXCURSION":
      return <tr>{selectTd("excursionCodeId", excursionCodes)}{numTd("paxFrom", 1)}{numTd("paxTo", 1)}{numTd("amount")}{removeTd}</tr>;
    case "TRANSFER":
      return <tr>{selectTd("transferSegmentId", transferSegments)}{numTd("paxFrom", 1)}{numTd("paxTo", 1)}{numTd("amount")}{removeTd}</tr>;
    case "TICKET":
      return (
        <tr>
          {selectTd("ticketSegmentId", ticketSegments)}
          <td className="pr-2 pb-1 w-28">
            <Select value={(row.passengerType as string) || "ADULT"} onValueChange={(v) => set("passengerType", v ?? "ADULT")}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADULT">Adulto</SelectItem>
                <SelectItem value="CHILD">Menor</SelectItem>
                <SelectItem value="INFANT">Infante</SelectItem>
              </SelectContent>
            </Select>
          </td>
          {numTd("amount")}{removeTd}
        </tr>
      );
    case "RENTAL":
      return <tr>{textTd("description")}{numTd("days", 1, "w-16")}{numTd("amount")}{removeTd}</tr>;
    case "MISC":
      return <tr>{textTd("description")}{numTd("amount")}{removeTd}</tr>;
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TariffDetailsEditor({
  serviceType, value, onChange,
  pensionRegimes, roomTypes, foodTypes, excursionCodes, transferSegments, ticketSegments,
}: TariffDetailsEditorProps) {
  function addRow() { onChange([...value, emptyRow(serviceType)]); }
  function updateRow(i: number, row: DetailRow) { const n = [...value]; n[i] = row; onChange(n); }
  function removeRow(i: number) { onChange(value.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {HEADERS[serviceType].map((h, i) => (
                  <th key={i} className="text-left text-xs font-medium text-muted-foreground pb-2 pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((row, i) => (
                <RowEditor
                  key={(row._id as string) || i}
                  serviceType={serviceType}
                  row={row}
                  onChange={(r) => updateRow(i, r)}
                  onRemove={() => removeRow(i)}
                  pensionRegimes={pensionRegimes}
                  roomTypes={roomTypes}
                  foodTypes={foodTypes}
                  excursionCodes={excursionCodes}
                  transferSegments={transferSegments}
                  ticketSegments={ticketSegments}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin filas. Agregue una para definir la tarifa.</p>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Agregar fila
      </Button>
    </div>
  );
}

// ─── Program Tariff Details Editor ──────────────────────────────────────────

export type ProgramDetailRow = {
  _id: string;
  hotelName: string;
  roomTypeId: string;
  pensionRegimeId: string;
  paxFrom: number;
  paxTo: number;
  totalAmount: number;
};

interface ProgramTariffDetailsEditorProps {
  value: ProgramDetailRow[];
  onChange: (rows: ProgramDetailRow[]) => void;
  roomTypes?: LookupItem[];
  pensionRegimes?: LookupItem[];
}

function emptyProgramRow(): ProgramDetailRow {
  return { _id: nanoid(), hotelName: "", roomTypeId: "", pensionRegimeId: "", paxFrom: 1, paxTo: 2, totalAmount: 0 };
}

export function ProgramTariffDetailsEditor({
  value, onChange, roomTypes = [], pensionRegimes = [],
}: ProgramTariffDetailsEditorProps) {
  function addRow() { onChange([...value, emptyProgramRow()]); }
  function updateRow(i: number, row: ProgramDetailRow) { const n = [...value]; n[i] = row; onChange(n); }
  function removeRow(i: number) { onChange(value.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["Hotel", "Tipo hab.", "Régimen", "Pax desde", "Pax hasta", "Tarifa total", ""].map((h, i) => (
                  <th key={i} className="text-left text-xs font-medium text-muted-foreground pb-2 pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((row, i) => (
                <tr key={row._id}>
                  <td className="pr-2 pb-1">
                    <Input value={row.hotelName} onChange={(e) => updateRow(i, { ...row, hotelName: e.target.value })} className="h-8 text-sm" placeholder="Nombre hotel" />
                  </td>
                  <td className="pr-2 pb-1 min-w-[130px]">
                    <Select value={row.roomTypeId} onValueChange={(v) => updateRow(i, { ...row, roomTypeId: v ?? "" })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Hab..." /></SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((rt) => <SelectItem key={rt.id} value={rt.id}>{rt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="pr-2 pb-1 min-w-[130px]">
                    <Select value={row.pensionRegimeId} onValueChange={(v) => updateRow(i, { ...row, pensionRegimeId: v ?? "" })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Régimen..." /></SelectTrigger>
                      <SelectContent>
                        {pensionRegimes.map((pr) => <SelectItem key={pr.id} value={pr.id}>{pr.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="pr-2 pb-1">
                    <Input type="number" min={1} value={row.paxFrom} onChange={(e) => updateRow(i, { ...row, paxFrom: parseInt(e.target.value) || 1 })} className="h-8 w-16 text-sm" />
                  </td>
                  <td className="pr-2 pb-1">
                    <Input type="number" min={1} value={row.paxTo} onChange={(e) => updateRow(i, { ...row, paxTo: parseInt(e.target.value) || 1 })} className="h-8 w-16 text-sm" />
                  </td>
                  <td className="pr-2 pb-1">
                    <Input type="number" min={0} value={row.totalAmount} onChange={(e) => updateRow(i, { ...row, totalAmount: parseFloat(e.target.value) || 0 })} className="h-8 w-24 text-sm" />
                  </td>
                  <td className="pb-1">
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeRow(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin filas. Agregue una por combinación hotel/habitación/pax.</p>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Agregar fila
      </Button>
    </div>
  );
}
