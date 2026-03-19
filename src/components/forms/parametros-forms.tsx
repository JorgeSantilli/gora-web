"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type {
  ServiceProviderType,
  PensionRegime,
  RoomType,
  FoodType,
  ClientType,
  ProviderOrigin,
  ReservationOrigin,
  GuideType,
} from "@/generated/prisma";
import {
  createServiceProviderType,
  updateServiceProviderType,
  createPensionRegime,
  updatePensionRegime,
  createRoomType,
  updateRoomType,
  createFoodType,
  updateFoodType,
  createClientType,
  updateClientType,
  createProviderOrigin,
  updateProviderOrigin,
  createReservationOrigin,
  updateReservationOrigin,
  createGuideType,
  updateGuideType,
} from "@/actions/parametros.actions";

// ─── Helpers ───────────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-center gap-3">
      <Label className="text-right text-sm col-span-1">{label}</Label>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function FormActions({
  onCancel,
  loading,
  isEdit,
}: {
  onCancel: () => void;
  loading: boolean;
  isEdit: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={loading}>
        Cancelar
      </Button>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
      </Button>
    </div>
  );
}

// ─── ServiceProviderType Form ──────────────────────────────────────────────

export function ServiceProviderTypeForm({
  agencyId,
  item,
  onDone,
}: {
  agencyId: string;
  item?: ServiceProviderType;
  onDone: () => void;
}) {
  const [code, setCode] = useState(item?.code?.toString() ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { code: Number(code), name, description: description || undefined, active };
      if (item) {
        await updateServiceProviderType(item.id, agencyId, data);
      } else {
        await createServiceProviderType(agencyId, data);
      }
      toast.success(item ? "Tipo actualizado" : "Tipo creado");
      onDone();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FieldRow label="Código">
        <Input type="number" value={code} onChange={(e) => setCode(e.target.value)} required min={1} />
      </FieldRow>
      <FieldRow label="Nombre">
        <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </FieldRow>
      <FieldRow label="Descripción">
        <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
      </FieldRow>
      <SwitchRow label="Activo" checked={active} onChange={setActive} />
      <FormActions onCancel={onDone} loading={loading} isEdit={!!item} />
    </form>
  );
}

// ─── PensionRegime Form ────────────────────────────────────────────────────

export function PensionRegimeForm({
  agencyId,
  item,
  onDone,
}: {
  agencyId: string;
  item?: PensionRegime;
  onDone: () => void;
}) {
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(item?.abbreviation ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { code, name, abbreviation };
      if (item) {
        await updatePensionRegime(item.id, agencyId, data);
      } else {
        await createPensionRegime(agencyId, data);
      }
      toast.success(item ? "Régimen actualizado" : "Régimen creado");
      onDone();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FieldRow label="Código">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required maxLength={4} placeholder="AD"
        />
      </FieldRow>
      <FieldRow label="Nombre">
        <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </FieldRow>
      <FieldRow label="Abreviatura">
        <Input
          value={abbreviation}
          onChange={(e) => setAbbreviation(e.target.value)}
          required maxLength={6} placeholder="AD"
        />
      </FieldRow>
      <FormActions onCancel={onDone} loading={loading} isEdit={!!item} />
    </form>
  );
}

// ─── RoomType Form ─────────────────────────────────────────────────────────

export function RoomTypeForm({
  agencyId,
  item,
  onDone,
}: {
  agencyId: string;
  item?: RoomType;
  onDone: () => void;
}) {
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(item?.abbreviation ?? "");
  const [capacity, setCapacity] = useState(item?.capacity?.toString() ?? "2");
  const [isVoucherComplement, setIsVoucherComplement] = useState(item?.isVoucherComplement ?? false);
  const [active, setActive] = useState(item?.active ?? true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { code, name, abbreviation, capacity: Number(capacity), isVoucherComplement, active };
      if (item) {
        await updateRoomType(item.id, agencyId, data);
      } else {
        await createRoomType(agencyId, data);
      }
      toast.success(item ? "Habitación actualizada" : "Habitación creada");
      onDone();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FieldRow label="Código">
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required maxLength={8} placeholder="DBL" />
      </FieldRow>
      <FieldRow label="Nombre">
        <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </FieldRow>
      <FieldRow label="Abreviatura">
        <Input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} required maxLength={8} />
      </FieldRow>
      <FieldRow label="Capacidad">
        <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required min={1} max={20} />
      </FieldRow>
      <SwitchRow label="Complemento de voucher (cuna, etc.)" checked={isVoucherComplement} onChange={setIsVoucherComplement} />
      <SwitchRow label="Activo" checked={active} onChange={setActive} />
      <FormActions onCancel={onDone} loading={loading} isEdit={!!item} />
    </form>
  );
}

// ─── FoodType Form ─────────────────────────────────────────────────────────

export function FoodTypeForm({
  agencyId,
  item,
  onDone,
}: {
  agencyId: string;
  item?: FoodType;
  onDone: () => void;
}) {
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { code, name, active };
      if (item) {
        await updateFoodType(item.id, agencyId, data);
      } else {
        await createFoodType(agencyId, data);
      }
      toast.success(item ? "Tipo actualizado" : "Tipo creado");
      onDone();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FieldRow label="Código">
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required maxLength={4} placeholder="ALM" />
      </FieldRow>
      <FieldRow label="Nombre">
        <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </FieldRow>
      <SwitchRow label="Activo" checked={active} onChange={setActive} />
      <FormActions onCancel={onDone} loading={loading} isEdit={!!item} />
    </form>
  );
}

// ─── ClientType Form ───────────────────────────────────────────────────────

export function ClientTypeForm({
  agencyId,
  item,
  onDone,
}: {
  agencyId: string;
  item?: ClientType;
  onDone: () => void;
}) {
  const [code, setCode] = useState(item?.code?.toString() ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { code: Number(code), name, active };
      if (item) {
        await updateClientType(item.id, agencyId, data);
      } else {
        await createClientType(agencyId, data);
      }
      toast.success(item ? "Tipo actualizado" : "Tipo creado");
      onDone();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FieldRow label="Código">
        <Input type="number" value={code} onChange={(e) => setCode(e.target.value)} required min={1} />
      </FieldRow>
      <FieldRow label="Nombre">
        <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </FieldRow>
      <SwitchRow label="Activo" checked={active} onChange={setActive} />
      <FormActions onCancel={onDone} loading={loading} isEdit={!!item} />
    </form>
  );
}

// ─── ProviderOrigin Form ───────────────────────────────────────────────────

export function ProviderOriginForm({
  agencyId,
  item,
  onDone,
}: {
  agencyId: string;
  item?: ProviderOrigin;
  onDone: () => void;
}) {
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [includeExcursion, setIncludeExcursion] = useState(item?.includeExcursion ?? false);
  const [includeTransfer, setIncludeTransfer] = useState(item?.includeTransfer ?? false);
  const [isForeign, setIsForeign] = useState(item?.isForeign ?? false);
  const [active, setActive] = useState(item?.active ?? true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { code, name, includeExcursion, includeTransfer, isForeign, active };
      if (item) {
        await updateProviderOrigin(item.id, agencyId, data);
      } else {
        await createProviderOrigin(agencyId, data);
      }
      toast.success(item ? "Origen actualizado" : "Origen creado");
      onDone();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FieldRow label="Código">
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required maxLength={6} placeholder="NAC" />
      </FieldRow>
      <FieldRow label="Nombre">
        <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </FieldRow>
      <SwitchRow label="Incluir en planilla excursiones" checked={includeExcursion} onChange={setIncludeExcursion} />
      <SwitchRow label="Incluir en planilla traslados" checked={includeTransfer} onChange={setIncludeTransfer} />
      <SwitchRow label="Servicios en el exterior (IVA No Computable)" checked={isForeign} onChange={setIsForeign} />
      <SwitchRow label="Activo" checked={active} onChange={setActive} />
      <FormActions onCancel={onDone} loading={loading} isEdit={!!item} />
    </form>
  );
}

// ─── ReservationOrigin Form ────────────────────────────────────────────────

export function ReservationOriginForm({
  agencyId,
  item,
  onDone,
}: {
  agencyId: string;
  item?: ReservationOrigin;
  onDone: () => void;
}) {
  const [letter, setLetter] = useState(item?.letter ?? "");
  const [label, setLabel] = useState(item?.label ?? "");
  const [autoNumber, setAutoNumber] = useState(item?.autoNumber ?? true);
  const [lastNumber, setLastNumber] = useState(item?.lastNumber?.toString() ?? "0");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { letter, label, autoNumber, lastNumber: Number(lastNumber) };
      if (item) {
        await updateReservationOrigin(item.id, agencyId, data);
      } else {
        await createReservationOrigin(agencyId, data);
      }
      toast.success(item ? "Origen actualizado" : "Origen creado");
      onDone();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FieldRow label="Letra">
        <Input
          value={letter}
          onChange={(e) => setLetter(e.target.value.toUpperCase())}
          required maxLength={2} placeholder="M"
          disabled={!!item}
        />
      </FieldRow>
      <FieldRow label="Nombre">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} required maxLength={80} placeholder="Mendoza" />
      </FieldRow>
      <SwitchRow label="Numeración automática" checked={autoNumber} onChange={setAutoNumber} />
      <FieldRow label="Último número">
        <Input type="number" value={lastNumber} onChange={(e) => setLastNumber(e.target.value)} required min={0} />
      </FieldRow>
      <FormActions onCancel={onDone} loading={loading} isEdit={!!item} />
    </form>
  );
}

// ─── GuideType Form ────────────────────────────────────────────────────────

export function GuideTypeForm({
  agencyId,
  item,
  onDone,
}: {
  agencyId: string;
  item?: GuideType;
  onDone: () => void;
}) {
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [isBilingual, setIsBilingual] = useState(item?.isBilingual ?? false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { code, name, isBilingual };
      if (item) {
        await updateGuideType(item.id, agencyId, data);
      } else {
        await createGuideType(agencyId, data);
      }
      toast.success(item ? "Tipo actualizado" : "Tipo creado");
      onDone();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FieldRow label="Código">
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required maxLength={6} placeholder="LOC" />
      </FieldRow>
      <FieldRow label="Nombre">
        <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </FieldRow>
      <SwitchRow label="Bilingüe" checked={isBilingual} onChange={setIsBilingual} />
      <FormActions onCancel={onDone} loading={loading} isEdit={!!item} />
    </form>
  );
}
