"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EditReservationForm } from "@/components/reservations/edit-reservation-form";
import { StatusActions } from "@/components/reservations/status-actions";
import { formatDate } from "@/lib/utils/dates";
import { formatFullName, formatCurrency, formatGuestCount } from "@/lib/utils/format";
import { RESERVATION_SOURCE_LABELS } from "@/lib/types";
import type { ReservationStatus, ReservationSource } from "@/lib/types";

interface ReservationData {
  id: string;
  reservationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  arrivalDate: string;
  departureDate: string;
  numberOfGuests: number;
  status: string;
  totalPrice: string | null;
  guestNote: string | null;
  internalNote: string | null;
  source: string;
  statusChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ReservationDetailProps {
  reservation: ReservationData;
}

export function ReservationDetail({ reservation }: ReservationDetailProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <EditReservationForm
        reservation={reservation}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with edit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {reservation.reservationNumber}
          </h1>
          <StatusBadge status={reservation.status as ReservationStatus} />
        </div>
        <Button variant="outline" onClick={() => setIsEditing(true)}>
          <Pencil className="h-4 w-4" />
          Bewerken
        </Button>
      </div>
      <p className="text-sm text-neutral-500">
        Aangemaakt op {formatDate(reservation.createdAt)}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gastgegevens */}
        <Card>
          <CardHeader>
            <CardTitle>Gastgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Detail
              label="Naam"
              value={formatFullName(reservation.firstName, reservation.lastName)}
            />
            <Detail label="E-mail" value={reservation.email} />
            <Detail label="Telefoon" value={reservation.phone || "—"} />
          </CardContent>
        </Card>

        {/* Verblijf */}
        <Card>
          <CardHeader>
            <CardTitle>Verblijf</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Detail
              label="Aankomst"
              value={formatDate(reservation.arrivalDate)}
            />
            <Detail
              label="Vertrek"
              value={formatDate(reservation.departureDate)}
            />
            <Detail
              label="Gasten"
              value={formatGuestCount(reservation.numberOfGuests)}
            />
            <Detail
              label="Totaalprijs"
              value={formatCurrency(reservation.totalPrice)}
            />
            <Detail
              label="Bron"
              value={
                RESERVATION_SOURCE_LABELS[
                  reservation.source as ReservationSource
                ] ?? reservation.source
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Status wijzigen */}
      <StatusActions
        reservationId={reservation.id}
        currentStatus={reservation.status as ReservationStatus}
      />

      {/* Notities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Opmerking gast</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">
              {reservation.guestNote || "Geen opmerking"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Interne notitie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">
              {reservation.internalNote || "Geen interne notitie"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tijdstempels */}
      <Card>
        <CardHeader>
          <CardTitle>Tijdlijn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Detail label="Aangemaakt" value={formatDate(reservation.createdAt)} />
          <Detail label="Laatst bijgewerkt" value={formatDate(reservation.updatedAt)} />
          {reservation.statusChangedAt && (
            <Detail
              label="Status gewijzigd"
              value={formatDate(reservation.statusChangedAt)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  );
}
