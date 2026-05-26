export interface BiteFactors {
  solunar: number;
  pressure: number;
  temperature: number;
  time_of_day: number;
  wind: number;
  clouds: number;
  precipitation: number;
}

export interface ReasonCode {
  code: string;
  value?: number;
}

export interface BiteResult {
  time: string;
  index: number;
  label: "Poor" | "Fair" | "Good" | "Excellent";
  factors: BiteFactors;
  reason: string;
  reason_codes: ReasonCode[];
  solunar_period: "major" | "minor" | "";
}

export interface SolunarWindow {
  type: "major" | "minor";
  start: string; // ISO UTC
  end: string;   // ISO UTC
}

export interface ForecastResult {
  lat: number;
  lon: number;
  species: string;
  current: BiteResult;
  forecast: BiteResult[];
  best_window: BiteResult;
  daily_rating: number;
  moon_phase_pct: number;
  solunar_windows: SolunarWindow[];
  advice?: string;
}

export interface HabitatZone {
  name: string;
  name_ru: string;
  lat_min: number;
  lat_max: number;
  lon_min: number;
  lon_max: number;
}

export interface SpeciesItem {
  key: string;
  name: string;
  name_ru: string;
  name_kz: string;
  notes: string;
  habitat_zones?: HabitatZone[];
}

export interface NowItem {
  species: string;
  name: string;
  name_ru: string;
  name_kz: string;
  index: number;
  label: BiteResult["label"];
  solunar_period: "major" | "minor" | "";
  reason_codes: ReasonCode[];
  hint: string;
}

export interface NextItem {
  species: string;
  name: string;
  name_ru: string;
  name_kz: string;
  window_start: string;
  window_end: string;
  peak_index: number;
  peak_at: string;
  hours_until: number;
  solunar_period: "major" | "minor" | "";
  hint: string;
}

export interface NowAndNextResult {
  lat: number;
  lon: number;
  threshold: number;
  now: NowItem[];
  next: NextItem[];
}
