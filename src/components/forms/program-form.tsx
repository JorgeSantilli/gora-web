"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createProgram, updateProgram } from "@/actions/programas.actions";
import type { Program } from "@/generated/prisma";

interface ProgramFormProps {
  agencyId: string;
  agencySlug: string;
  program?: Program;
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export function ProgramForm({ agencyId, agencySlug, program }: ProgramFormProps) {
  const isEdit = !!program;
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState(program?.code?.toString() ?? "");
  const [name, setName] = useState(program?.name ?? "");
  const [isFixedBase, setIsFixedBase] = useState(program?.isFixedBase ?? true);
  const [days, setDays] = useState(program?.days?.toString() ?? "");
  const [nights, setNights] = useState(program?.nights?.toString() ?? "");
  const [active, setActive] = useState(program?.active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        code: Number(code),
        name,
        isFixedBase,
        days: days ? Number(days) : undefined,
        nights: nights ? Number(nights) : undefined,
        active,
      };

      if (isEdit) {
        await updateProgram(program.id, agencyId, agencySlug, data);
        toast.success("Programa actualizado");
        setLoading(false);
      } else {
        await createProgram(agencyId, agencySlug, data);
        // redirect happens inside action
      }
    } catch {
      toast.error("Error al guardar");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Código" required>
          <Input
            type="number"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required min={1}
            placeholder="1"
          />
        </Field>
        <Field label="Días / Noches">
          <div className="flex gap-2">
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min={1}
              placeholder="Días"
            />
            <Input
              type="number"
              value={nights}
              onChange={(e) => setNights(e.target.value)}
              min={0}
              placeholder="Noches"
            />
          </div>
        </Field>
      </div>

      <Field label="Nombre del programa" required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          placeholder="MENDOZA CLÁSICO"
        />
      </Field>

      <div className="flex gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label>Base fija</Label>
            <p className="text-xs text-muted-foreground">Precio por paquete cerrado</p>
          </div>
          <Switch checked={isFixedBase} onCheckedChange={setIsFixedBase} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label>Activo</Label>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear Programa"}
        </Button>
      </div>
    </form>
  );
}
