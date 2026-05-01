"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

type LocationPickerProps = {
  latitude?: string | null;
  longitude?: string | null;
  onChange: (value: { latitude: string; longitude: string }) => void;
};

const defaultCenter: [number, number] = [3.5952, 98.6722];

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function parseCoordinate(value?: string | null) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return null;
  }

  return numberValue;
}

function clampLatitude(value: number) {
  return Math.max(-90, Math.min(90, value));
}

function normalizeLongitude(value: number) {
  let longitude = value;

  while (longitude > 180) {
    longitude -= 360;
  }

  while (longitude < -180) {
    longitude += 360;
  }

  return longitude;
}

function normalizeCoordinate(lat: number, lng: number) {
  return {
    latitude: clampLatitude(lat).toFixed(7),
    longitude: normalizeLongitude(lng).toFixed(7),
  };
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

function ClickHandler({
  onChange,
}: {
  onChange: (value: { latitude: string; longitude: string }) => void;
}) {
  useMapEvents({
    click(event) {
      onChange(normalizeCoordinate(event.latlng.lat, event.latlng.lng));
    },
  });

  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);

  const center = useMemo<[number, number]>(() => {
    if (lat !== null && lng !== null) {
      return [clampLatitude(lat), normalizeLongitude(lng)];
    }

    return defaultCenter;
  }, [lat, lng]);

  const hasMarker = lat !== null && lng !== null;

  return (
    <div className="gym-map-picker overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        worldCopyJump
        maxBounds={[
          [-90, -180],
          [90, 180],
        ]}
        maxBoundsViscosity={1}
        className="h-[320px]"
      >
        <ChangeView center={center} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onChange={onChange} />

        {hasMarker ? (
          <Marker
            position={center}
            draggable
            eventHandlers={{
              dragend(event) {
                const marker = event.target;
                const position = marker.getLatLng();

                onChange(normalizeCoordinate(position.lat, position.lng));
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
