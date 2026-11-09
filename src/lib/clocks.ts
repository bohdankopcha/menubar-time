export interface Clock {
  id: string;
  timeZone: string;
  label: string;
  emoji: string;
  enabled: boolean;
}

export interface Appearance {
  timeFormat: "12h" | "24h";
  showFlags: boolean;
  showLabels: boolean;
  separator: "divider" | "dot" | "space";
}

export const DEFAULT_CLOCKS: Clock[] = [
  { id: "warsaw", timeZone: "Europe/Warsaw", label: "Warsaw", emoji: "🇵🇱", enabled: true },
  { id: "new-york", timeZone: "America/New_York", label: "New York", emoji: "🇺🇸", enabled: true },
  { id: "tokyo", timeZone: "Asia/Tokyo", label: "Tokyo", emoji: "🇯🇵", enabled: true },
];

export function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function decodeClocks(value: string | undefined): Clock[] {
  if (value === undefined) return DEFAULT_CLOCKS.map((clock) => ({ ...clock }));
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error("Saved clocks are not a list.");
  const ids = new Set<string>();
  for (const clock of parsed) {
    if (
      !clock || typeof clock !== "object" ||
      typeof clock.id !== "string" || !clock.id || ids.has(clock.id) ||
      typeof clock.timeZone !== "string" || !isTimeZone(clock.timeZone) ||
      typeof clock.label !== "string" || typeof clock.emoji !== "string" ||
      typeof clock.enabled !== "boolean"
    ) throw new Error("A saved clock is invalid. Your settings have been kept; please restore a valid backup.");
    ids.add(clock.id);
  }
  return parsed as Clock[];
}

export function formatTime(date: Date, timeZone: string, format: Appearance["timeFormat"]): string {
  return new Intl.DateTimeFormat(format === "12h" ? "en-US" : "en-GB", {
    timeZone,
    hour: format === "12h" ? "numeric" : "2-digit",
    minute: "2-digit",
    hourCycle: format === "12h" ? "h12" : "h23",
  }).format(date);
}

export function formatDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short" }).format(date);
}

export function formatOffset(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en", { timeZone, timeZoneName: "shortOffset" })
    .formatToParts(date).find((part) => part.type === "timeZoneName")!.value.replace("GMT", "UTC");
}

function calendarDay(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone, year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)!.value);
  return Date.UTC(get("year"), get("month") - 1, get("day")) / 86_400_000;
}

export function dayDifference(date: Date, timeZone: string, localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone): number {
  return calendarDay(date, timeZone) - calendarDay(date, localTimeZone);
}

export function dayLabel(difference: number): string {
  if (!difference) return "";
  return `${difference > 0 ? "+" : ""}${difference}d`;
}

export function menuBarTitle(clocks: Clock[], date: Date, appearance: Appearance): string {
  const separator = { divider: "  |  ", dot: "  ·  ", space: "   " }[appearance.separator];
  return clocks.filter((clock) => clock.enabled).map((clock) => [
    appearance.showFlags ? clock.emoji : "",
    appearance.showLabels ? clock.label : "",
    formatTime(date, clock.timeZone, appearance.timeFormat),
  ].filter(Boolean).join(" ")).join(separator);
}

export function moveClock(clocks: Clock[], id: string, direction: -1 | 1): Clock[] {
  const index = clocks.findIndex((clock) => clock.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= clocks.length) return clocks;
  const result = [...clocks];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
