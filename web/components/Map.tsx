"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface Props {
  onLocationSelect: (lat: number, lon: number, name?: string) => void;
}

const KZ_SPOTS = [
  { name: "Есіл өзені (Астана)", lat: 51.1801, lon: 71.446 },
  { name: "Балқаш көлі", lat: 46.5, lon: 74.5 },
  { name: "Қапшағай су қоймасы", lat: 43.87, lon: 77.08 },
  { name: "Бұқтырма су қоймасы", lat: 49.0, lon: 84.5 },
  { name: "Ертіс өзені", lat: 52.28, lon: 76.97 },
  { name: "Жайық өзені", lat: 51.22, lon: 51.36 },
];

// Returns true if coords are roughly inside Kazakhstan bounding box
function isInKazakhstan(lat: number, lon: number) {
  return lat >= 40.5 && lat <= 55.5 && lon >= 50.0 && lon <= 87.5;
}

export default function Map({ onLocationSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Guard against React StrictMode double-invoke:
    // The async import may resolve after cleanup already ran.
    // We use a `cancelled` flag to abort stale callbacks.
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      // If Leaflet already attached to this DOM node, bail out
      if ((containerRef.current as any)._leaflet_id) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [48.0, 68.0],
        zoom: 5,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
        // @ts-ignore
        r: L.Browser.retina ? "@2x" : "",
      }).addTo(map);

      // --- Geolocation: fly to user if they're in Kazakhstan ---
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            if (cancelled) return;
            const { latitude: lat, longitude: lon } = coords;
            if (isInKazakhstan(lat, lon)) {
              map.flyTo([lat, lon], 10, { duration: 1.5 });
            }
          },
          () => {}, // silently ignore if denied
          { timeout: 5000 }
        );
      }

      // Selected location marker
      let marker: ReturnType<typeof L.marker> | null = null;

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (marker) marker.remove();
        marker = L.marker([lat, lng]).addTo(map);
        onLocationSelect(lat, lng);
      });

      // Water body quick-access markers
      const spotIcon = L.divIcon({
        html: `<div style="
          background: #0ea5e9;
          border: 2.5px solid #fff;
          border-radius: 50%;
          width: 12px; height: 12px;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.3);
        "></div>`,
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      KZ_SPOTS.forEach((spot) => {
        L.marker([spot.lat, spot.lon], { icon: spotIcon })
          .addTo(map)
          .bindTooltip(spot.name, {
            direction: "top",
            offset: [0, -10],
            className: "fishpulse-tooltip",
          })
          .on("click", (e) => {
            // Prevent map click from firing too
            L.DomEvent.stopPropagation(e);
            if (marker) marker.remove();
            marker = L.marker([spot.lat, spot.lon]).addTo(map);
            onLocationSelect(spot.lat, spot.lon, spot.name);
          });
      });
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onLocationSelect]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .fishpulse-tooltip {
          background: #0f172a;
          border: 1px solid #334155;
          color: #e2e8f0;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .fishpulse-tooltip::before { display: none; }
        .leaflet-container { background: #0f172a; }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
}
