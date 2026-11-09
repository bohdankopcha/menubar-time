import countries from "../data/time-zone-countries.json";
import { isTimeZone } from "./clocks";

export interface TimeZoneOption {
  id: string;
  city: string;
  country: string;
  emoji: string;
}

export function countryFlag(code: string): string {
  return /^[A-Z]{2}$/.test(code)
    ? String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)))
    : "🌐";
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryByZone = new Map<string, string>();
for (const [zone, country] of Object.entries(countries)) {
  if (!isTimeZone(zone)) continue;
  countryByZone.set(zone, country);
  countryByZone.set(new Intl.DateTimeFormat("en", { timeZone: zone }).resolvedOptions().timeZone, country);
}

export function describeTimeZone(id: string): TimeZoneOption {
  const code = countryByZone.get(id);
  return {
    id,
    city: id === "UTC" ? "UTC" : id.split("/").slice(1).join(" / ").replaceAll("_", " ") || id,
    country: code ? regionNames.of(code) ?? code : "Worldwide",
    emoji: code ? countryFlag(code) : "🌐",
  };
}

// Keep runtime-supported names plus geographic aliases such as Europe/Kyiv.
export const TIME_ZONES = [...new Set([
  "UTC",
  ...Intl.supportedValuesOf("timeZone"),
  ...Object.keys(countries).filter(isTimeZone),
])].map(describeTimeZone).sort((a, b) => a.city.localeCompare(b.city));
