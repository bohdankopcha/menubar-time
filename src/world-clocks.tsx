import {
  Clipboard, Icon, launchCommand, LaunchType, MenuBarExtra,
  openExtensionPreferences, showHUD,
} from "@raycast/api";
import { dayDifference, dayLabel, formatDate, formatOffset, formatTime, menuBarTitle } from "./lib/clocks";
import { useClocks, useNow } from "./lib/hooks";
import { getAppearance } from "./lib/preferences";

export default function Command() {
  const { clocks, isLoading, error } = useClocks();
  const now = useNow();
  const appearance = getAppearance();
  const title = menuBarTitle(clocks, now, appearance);

  return (
    <MenuBarExtra
      title={title || undefined}
      icon={title ? undefined : error ? Icon.ExclamationMark : Icon.Clock}
      isLoading={isLoading}
      tooltip={error ? error.message : clocks.length ? clocks.map((clock) =>
        `${clock.emoji} ${clock.label}: ${formatTime(now, clock.timeZone, appearance.timeFormat)} · ${formatDate(now, clock.timeZone)}`,
      ).join("\n") : "Add your first clock in Manage Time Zones"}
    >
      {error ? <MenuBarExtra.Item title="Could not load clocks" subtitle={error.message} /> : (
        <MenuBarExtra.Section title="World Clocks · Click to Copy Time">
          {clocks.length === 0 && <MenuBarExtra.Item title="No clocks yet — add a time zone below" />}
          {clocks.map((clock) => {
            const time = formatTime(now, clock.timeZone, appearance.timeFormat);
            const day = dayLabel(dayDifference(now, clock.timeZone));
            return (
              <MenuBarExtra.Item
                key={clock.id}
                title={`${clock.emoji} ${clock.label}  ${time}${day ? ` (${day})` : ""}`.trim()}
                subtitle={`${formatDate(now, clock.timeZone)} · ${formatOffset(now, clock.timeZone)}`}
                tooltip={`${clock.timeZone}${clock.enabled ? "" : " · Hidden from menu bar"}`}
                onAction={async () => {
                  await Clipboard.copy(formatTime(new Date(), clock.timeZone, appearance.timeFormat));
                  await showHUD(`Copied ${clock.label} time`);
                }}
              />
            );
          })}
        </MenuBarExtra.Section>
      )}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item title="Manage Time Zones…" icon={Icon.Globe}
          onAction={() => launchCommand({ name: "manage-time-zones", type: LaunchType.UserInitiated })} />
        <MenuBarExtra.Item title="Appearance & Time Format…" icon={Icon.Gear}
          onAction={openExtensionPreferences} />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
