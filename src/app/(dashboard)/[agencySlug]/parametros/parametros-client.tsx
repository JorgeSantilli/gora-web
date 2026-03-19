"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ParamTable, type ParamColumn } from "@/components/tables/param-table";
import { ParamDialog } from "@/components/forms/param-dialog";
import {
  ServiceProviderTypeForm,
  PensionRegimeForm,
  RoomTypeForm,
  FoodTypeForm,
  ClientTypeForm,
  ProviderOriginForm,
  ReservationOriginForm,
  GuideTypeForm,
} from "@/components/forms/parametros-forms";
import {
  deleteServiceProviderType,
  deletePensionRegime,
  deleteRoomType,
  deleteFoodType,
  deleteClientType,
  deleteProviderOrigin,
  deleteReservationOrigin,
  deleteGuideType,
} from "@/actions/parametros.actions";
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

interface Props {
  agencyId: string;
  serviceProviderTypes: ServiceProviderType[];
  pensionRegimes: PensionRegime[];
  roomTypes: RoomType[];
  foodTypes: FoodType[];
  clientTypes: ClientType[];
  providerOrigins: ProviderOrigin[];
  reservationOrigins: ReservationOrigin[];
  guideTypes: GuideType[];
}

type DialogState =
  | { type: "serviceProviderType"; item?: ServiceProviderType }
  | { type: "pensionRegime"; item?: PensionRegime }
  | { type: "roomType"; item?: RoomType }
  | { type: "foodType"; item?: FoodType }
  | { type: "clientType"; item?: ClientType }
  | { type: "providerOrigin"; item?: ProviderOrigin }
  | { type: "reservationOrigin"; item?: ReservationOrigin }
  | { type: "guideType"; item?: GuideType }
  | null;

export function ParametrosClient({
  agencyId,
  serviceProviderTypes,
  pensionRegimes,
  roomTypes,
  foodTypes,
  clientTypes,
  providerOrigins,
  reservationOrigins,
  guideTypes,
}: Props) {
  const [dialog, setDialog] = useState<DialogState>(null);

  const close = () => setDialog(null);

  // Columns
  const sptColumns: ParamColumn<ServiceProviderType>[] = [
    { key: "code", label: "Cód." },
    { key: "name", label: "Nombre" },
    { key: "active", label: "Activo" },
  ];

  const pensionColumns: ParamColumn<PensionRegime>[] = [
    { key: "code", label: "Cód." },
    { key: "abbreviation", label: "Abrev." },
    { key: "name", label: "Nombre" },
  ];

  const roomColumns: ParamColumn<RoomType>[] = [
    { key: "code", label: "Cód." },
    { key: "abbreviation", label: "Abrev." },
    { key: "name", label: "Nombre" },
    { key: "capacity", label: "Cap." },
    { key: "active", label: "Activo" },
  ];

  const foodColumns: ParamColumn<FoodType>[] = [
    { key: "code", label: "Cód." },
    { key: "name", label: "Nombre" },
    { key: "active", label: "Activo" },
  ];

  const clientTypeColumns: ParamColumn<ClientType>[] = [
    { key: "code", label: "Cód." },
    { key: "name", label: "Nombre" },
    { key: "active", label: "Activo" },
  ];

  const providerOriginColumns: ParamColumn<ProviderOrigin>[] = [
    { key: "code", label: "Cód." },
    { key: "name", label: "Nombre" },
    {
      key: "isForeign",
      label: "Exterior",
      render: (r) =>
        r.isForeign ? (
          <Badge variant="outline" className="text-xs">Exterior</Badge>
        ) : null,
    },
    { key: "active", label: "Activo" },
  ];

  const reservationOriginColumns: ParamColumn<ReservationOrigin>[] = [
    { key: "letter", label: "Letra" },
    { key: "label", label: "Nombre" },
    { key: "lastNumber", label: "Último N°" },
    { key: "autoNumber", label: "Auto" },
  ];

  const guideTypeColumns: ParamColumn<GuideType>[] = [
    { key: "code", label: "Cód." },
    { key: "name", label: "Nombre" },
    { key: "isBilingual", label: "Bilingüe" },
  ];

  return (
    <>
      {/* Grid de tablas 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipos de prestador */}
        <ParamTable
          title="Tipos de Prestador"
          data={serviceProviderTypes}
          columns={sptColumns}
          onNew={() => setDialog({ type: "serviceProviderType" })}
          onEdit={(item) => setDialog({ type: "serviceProviderType", item })}
          onDelete={(id) => deleteServiceProviderType(id, agencyId)}
        />

        {/* Tipos de cliente */}
        <ParamTable
          title="Tipos de Cliente"
          data={clientTypes}
          columns={clientTypeColumns}
          onNew={() => setDialog({ type: "clientType" })}
          onEdit={(item) => setDialog({ type: "clientType", item })}
          onDelete={(id) => deleteClientType(id, agencyId)}
        />

        {/* Regímenes de pensión */}
        <ParamTable
          title="Regímenes de Pensión"
          data={pensionRegimes}
          columns={pensionColumns}
          onNew={() => setDialog({ type: "pensionRegime" })}
          onEdit={(item) => setDialog({ type: "pensionRegime", item })}
          onDelete={(id) => deletePensionRegime(id, agencyId)}
        />

        {/* Tipos de habitación */}
        <ParamTable
          title="Tipos de Habitación"
          data={roomTypes}
          columns={roomColumns}
          onNew={() => setDialog({ type: "roomType" })}
          onEdit={(item) => setDialog({ type: "roomType", item })}
          onDelete={(id) => deleteRoomType(id, agencyId)}
        />

        {/* Tipos de comida */}
        <ParamTable
          title="Tipos de Comida"
          data={foodTypes}
          columns={foodColumns}
          onNew={() => setDialog({ type: "foodType" })}
          onEdit={(item) => setDialog({ type: "foodType", item })}
          onDelete={(id) => deleteFoodType(id, agencyId)}
        />

        {/* Tipos de guía */}
        <ParamTable
          title="Tipos de Guía"
          data={guideTypes}
          columns={guideTypeColumns}
          onNew={() => setDialog({ type: "guideType" })}
          onEdit={(item) => setDialog({ type: "guideType", item })}
          onDelete={(id) => deleteGuideType(id, agencyId)}
        />

        {/* Orígenes de prestadores */}
        <ParamTable
          title="Orígenes de Prestadores"
          data={providerOrigins}
          columns={providerOriginColumns}
          onNew={() => setDialog({ type: "providerOrigin" })}
          onEdit={(item) => setDialog({ type: "providerOrigin", item })}
          onDelete={(id) => deleteProviderOrigin(id, agencyId)}
        />

        {/* Orígenes de reservas */}
        <ParamTable
          title="Orígenes de Reservas (Letras)"
          data={reservationOrigins}
          columns={reservationOriginColumns}
          onNew={() => setDialog({ type: "reservationOrigin" })}
          onEdit={(item) => setDialog({ type: "reservationOrigin", item })}
          onDelete={(id) => deleteReservationOrigin(id, agencyId)}
        />
      </div>

      {/* Dialogs */}
      <ParamDialog
        open={dialog?.type === "serviceProviderType"}
        onClose={close}
        title={dialog?.type === "serviceProviderType" && dialog.item ? "Editar Tipo de Prestador" : "Nuevo Tipo de Prestador"}
      >
        {dialog?.type === "serviceProviderType" && (
          <ServiceProviderTypeForm agencyId={agencyId} item={dialog.item} onDone={close} />
        )}
      </ParamDialog>

      <ParamDialog
        open={dialog?.type === "pensionRegime"}
        onClose={close}
        title={dialog?.type === "pensionRegime" && dialog.item ? "Editar Régimen" : "Nuevo Régimen de Pensión"}
      >
        {dialog?.type === "pensionRegime" && (
          <PensionRegimeForm agencyId={agencyId} item={dialog.item} onDone={close} />
        )}
      </ParamDialog>

      <ParamDialog
        open={dialog?.type === "roomType"}
        onClose={close}
        title={dialog?.type === "roomType" && dialog.item ? "Editar Habitación" : "Nuevo Tipo de Habitación"}
      >
        {dialog?.type === "roomType" && (
          <RoomTypeForm agencyId={agencyId} item={dialog.item} onDone={close} />
        )}
      </ParamDialog>

      <ParamDialog
        open={dialog?.type === "foodType"}
        onClose={close}
        title={dialog?.type === "foodType" && dialog.item ? "Editar Tipo de Comida" : "Nuevo Tipo de Comida"}
      >
        {dialog?.type === "foodType" && (
          <FoodTypeForm agencyId={agencyId} item={dialog.item} onDone={close} />
        )}
      </ParamDialog>

      <ParamDialog
        open={dialog?.type === "clientType"}
        onClose={close}
        title={dialog?.type === "clientType" && dialog.item ? "Editar Tipo de Cliente" : "Nuevo Tipo de Cliente"}
      >
        {dialog?.type === "clientType" && (
          <ClientTypeForm agencyId={agencyId} item={dialog.item} onDone={close} />
        )}
      </ParamDialog>

      <ParamDialog
        open={dialog?.type === "providerOrigin"}
        onClose={close}
        title={dialog?.type === "providerOrigin" && dialog.item ? "Editar Origen" : "Nuevo Origen de Prestador"}
      >
        {dialog?.type === "providerOrigin" && (
          <ProviderOriginForm agencyId={agencyId} item={dialog.item} onDone={close} />
        )}
      </ParamDialog>

      <ParamDialog
        open={dialog?.type === "reservationOrigin"}
        onClose={close}
        title={dialog?.type === "reservationOrigin" && dialog.item ? "Editar Origen" : "Nuevo Origen de Reserva"}
      >
        {dialog?.type === "reservationOrigin" && (
          <ReservationOriginForm agencyId={agencyId} item={dialog.item} onDone={close} />
        )}
      </ParamDialog>

      <ParamDialog
        open={dialog?.type === "guideType"}
        onClose={close}
        title={dialog?.type === "guideType" && dialog.item ? "Editar Tipo de Guía" : "Nuevo Tipo de Guía"}
      >
        {dialog?.type === "guideType" && (
          <GuideTypeForm agencyId={agencyId} item={dialog.item} onDone={close} />
        )}
      </ParamDialog>
    </>
  );
}
