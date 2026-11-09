import { strict as assert } from "node:assert";
import { test } from "node:test";
import { Appearance, dayDifference, decodeClocks, DEFAULT_CLOCKS, formatOffset, formatTime, menuBarTitle, moveClock } from "../src/lib/clocks";
import { countryFlag, TIME_ZONES } from "../src/lib/time-zones";

test("New York skips the spring DST hour and repeats the autumn hour", () => {
  assert.equal(formatTime(new Date("2026-03-08T06:59:00Z"), "America/New_York", "24h"), "01:59");
  assert.equal(formatTime(new Date("2026-03-08T07:00:00Z"), "America/New_York", "24h"), "03:00");
  assert.equal(formatTime(new Date("2026-11-01T05:30:00Z"), "America/New_York", "24h"), "01:30");
  assert.equal(formatTime(new Date("2026-11-01T06:30:00Z"), "America/New_York", "24h"), "01:30");
  assert.equal(formatOffset(new Date("2026-11-01T05:30:00Z"), "America/New_York"), "UTC-4");
  assert.equal(formatOffset(new Date("2026-11-01T06:30:00Z"), "America/New_York"), "UTC-5");
});

test("Europe and America change DST on different dates", () => {
  const date = new Date("2026-03-15T12:00:00Z");
  assert.equal(formatTime(date, "Europe/Warsaw", "24h"), "13:00");
  assert.equal(formatTime(date, "America/New_York", "24h"), "08:00");
});

test("supports fractional offsets, UTC midnight, noon and 12-hour format", () => {
  const date = new Date("2026-01-01T00:00:00Z");
  assert.equal(formatTime(date, "Asia/Kathmandu", "24h"), "05:45");
  assert.equal(formatOffset(date, "Asia/Kathmandu"), "UTC+5:45");
  assert.equal(formatTime(date, "UTC", "24h"), "00:00");
  assert.equal(formatTime(date, "UTC", "12h"), "12:00 AM");
  assert.equal(formatTime(new Date("2026-01-01T12:00:00Z"), "UTC", "12h"), "12:00 PM");
});

test("day differences handle year boundaries and the international date line", () => {
  const date = new Date("2026-01-01T10:30:00Z");
  assert.equal(dayDifference(date, "Pacific/Kiritimati", "Pacific/Honolulu"), 1);
  assert.equal(dayDifference(new Date("2026-01-01T00:30:00Z"), "America/Los_Angeles", "UTC"), -1);
});

test("menu bar respects visibility, order, empty emoji, labels and separators", () => {
  const date = new Date("2026-01-01T12:00:00Z");
  const options: Appearance = { timeFormat: "24h", showFlags: true, showLabels: false, separator: "divider" };
  assert.equal(menuBarTitle(DEFAULT_CLOCKS, date, options), "🇵🇱 13:00  |  🇺🇸 07:00  |  🇯🇵 21:00");
  const clocks = DEFAULT_CLOCKS.map((clock, index) => ({ ...clock, enabled: index === 1, emoji: "" }));
  assert.equal(menuBarTitle(clocks, date, { ...options, showLabels: true }), "New York 07:00");
  assert.equal(menuBarTitle([], date, options), "");
  assert.equal(menuBarTitle(DEFAULT_CLOCKS.slice(0, 2), date, { ...options, showFlags: false, separator: "dot" }), "13:00  ·  07:00");
  const moved = moveClock(DEFAULT_CLOCKS, "tokyo", -1);
  assert.equal(moved[1].id, "tokyo");
  assert.equal(DEFAULT_CLOCKS[1].id, "new-york");
  assert.deepEqual(moveClock(DEFAULT_CLOCKS, "warsaw", -1), DEFAULT_CLOCKS);
});

test("storage distinguishes a first run from intentionally empty settings and rejects corruption", () => {
  assert.deepEqual(decodeClocks(undefined), DEFAULT_CLOCKS);
  assert.deepEqual(decodeClocks("[]"), []);
  assert.deepEqual(decodeClocks(JSON.stringify(DEFAULT_CLOCKS)), DEFAULT_CLOCKS);
  assert.throws(() => decodeClocks("{}"));
  assert.throws(() => decodeClocks("not json"));
  assert.throws(() => decodeClocks(JSON.stringify([{ ...DEFAULT_CLOCKS[0], timeZone: "Invalid/Zone" }])));
  assert.throws(() => decodeClocks(JSON.stringify([DEFAULT_CLOCKS[0], DEFAULT_CLOCKS[0]])));
});

test("catalog contains regional flags and searchable geographic aliases", () => {
  assert.equal(countryFlag("PL"), "🇵🇱");
  assert.equal(TIME_ZONES.find((zone) => zone.id === "Europe/Warsaw")?.emoji, "🇵🇱");
  assert.equal(TIME_ZONES.find((zone) => zone.id === "America/New_York")?.emoji, "🇺🇸");
  assert.equal(TIME_ZONES.find((zone) => zone.id === "Europe/Kyiv")?.emoji, "🇺🇦");
  assert.equal(TIME_ZONES.find((zone) => zone.id === "UTC")?.emoji, "🌐");
  assert.ok(TIME_ZONES.length > 400);
});
