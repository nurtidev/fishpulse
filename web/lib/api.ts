import type { ForecastResult, SpeciesItem } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function fetchBite(
  lat: number,
  lon: number,
  species: string
): Promise<ForecastResult> {
  const url = `${API_BASE}/api/v1/bite?lat=${lat}&lon=${lon}&species=${species}`;
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchSpecies(): Promise<SpeciesItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/species`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data: SpeciesItem[] = await res.json();
  return data.sort((a, b) => a.name_ru.localeCompare(b.name_ru));
}
