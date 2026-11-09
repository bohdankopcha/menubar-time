import { getPreferenceValues } from "@raycast/api";
import { Appearance } from "./clocks";

export function getAppearance(): Appearance {
  const preferences = getPreferenceValues<Appearance>();
  return {
    timeFormat: preferences.timeFormat ?? "24h",
    showFlags: preferences.showFlags ?? true,
    showLabels: preferences.showLabels ?? false,
    separator: preferences.separator ?? "divider",
  };
}
