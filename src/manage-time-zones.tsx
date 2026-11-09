import { randomUUID } from "node:crypto";
import {
  Action, ActionPanel, Clipboard, Form, Icon, List, openExtensionPreferences,
  showToast, Toast, useNavigation,
} from "@raycast/api";
import { useRef, useState } from "react";
import { Clock, formatOffset, formatTime, menuBarTitle, moveClock } from "./lib/clocks";
import { useClocks, useNow } from "./lib/hooks";
import { getAppearance } from "./lib/preferences";
import { refreshMenuBar, writeClocks } from "./lib/storage";
import { describeTimeZone, TIME_ZONES } from "./lib/time-zones";

type SaveClocks = (clocks: Clock[]) => Promise<boolean>;

function ClockForm({ clock, clocks, onSave }: { clock?: Clock; clocks: Clock[]; onSave: SaveClocks }) {
  const { pop } = useNavigation();
  const [timeZone, setTimeZone] = useState(clock?.timeZone ?? (
    ["Europe/London", "Europe/Warsaw", "America/Los_Angeles", "Asia/Dubai", ...TIME_ZONES.map((zone) => zone.id)]
      .find((id) => !clocks.some((item) => item.timeZone === id)) ?? "UTC"
  ));
  const [label, setLabel] = useState(clock?.label ?? describeTimeZone(timeZone).city);
  const [emoji, setEmoji] = useState(clock?.emoji ?? describeTimeZone(timeZone).emoji);
  const [enabled, setEnabled] = useState(clock?.enabled ?? true);
  const [isSaving, setSaving] = useState(false);
  const [labelError, setLabelError] = useState<string>();
  const [emojiError, setEmojiError] = useState<string>();
  const duplicate = clocks.some((item) => item.timeZone === timeZone && item.id !== clock?.id);
  const now = useNow();
  const appearance = getAppearance();

  function selectTimeZone(value: string) {
    const previous = describeTimeZone(timeZone);
    const next = describeTimeZone(value);
    if (label === previous.city) setLabel(next.city);
    if (emoji === previous.emoji) setEmoji(next.emoji);
    setTimeZone(value);
  }

  async function submit() {
    const name = label.trim();
    if (!name || name.length > 32) {
      setLabelError("Enter a label of 1–32 characters.");
      return;
    }
    if (emoji.trim().length > 32) {
      setEmojiError("Use a short emoji or badge (up to 32 characters).");
      return;
    }
    if (duplicate || isSaving) return;
    setSaving(true);
    const next: Clock = { id: clock?.id ?? randomUUID(), timeZone, label: name, emoji: emoji.trim(), enabled };
    const saved = await onSave(clock ? clocks.map((item) => item.id === clock.id ? next : item) : [...clocks, next]);
    setSaving(false);
    if (saved) pop();
  }

  return (
    <Form
      navigationTitle={clock ? `Edit ${clock.label}` : "Add Time Zone"}
      isLoading={isSaving}
      actions={<ActionPanel><Action.SubmitForm title={clock ? "Save Clock" : "Add Clock"} onSubmit={submit} /></ActionPanel>}
    >
      <Form.Dropdown id="timeZone" title="Time Zone" value={timeZone} onChange={selectTimeZone}
        error={duplicate ? "This time zone is already in your list. Edit the existing clock instead." : undefined}>
        {TIME_ZONES.map((zone) => (
          <Form.Dropdown.Item key={zone.id} value={zone.id}
            title={`${zone.emoji} ${zone.city} · ${zone.country} · ${zone.id}`} />
        ))}
      </Form.Dropdown>
      <Form.TextField id="label" title="Label" value={label} error={labelError}
        placeholder="City, teammate, or a short name"
        onChange={(value) => { setLabel(value); setLabelError(undefined); }} />
      <Form.TextField id="emoji" title="Flag or Emoji" value={emoji} error={emojiError}
        placeholder="🇵🇱, 🏠, 💻 — or leave empty"
        info="Country flags are filled in automatically. Use any emoji, or leave this field empty to hide the badge for this clock."
        onChange={(value) => { setEmoji(value); setEmojiError(undefined); }} />
      <Form.Checkbox id="enabled" title="Menu Bar" label="Show this clock in the menu bar"
        value={enabled} onChange={setEnabled}
        info="Hidden clocks remain available in the menu bar's dropdown." />
      <Form.Separator />
      <Form.Description title="Preview" text={menuBarTitle([
        { id: "preview", timeZone, label: label.trim(), emoji: emoji.trim(), enabled: true },
      ], now, appearance)} />
      <Form.Description title="Current Time" text={`${formatTime(now, timeZone, appearance.timeFormat)} · ${formatOffset(now, timeZone)}`} />
      <Form.Description title="Appearance" text="Flags, labels, time format, and separators can be changed in the extension preferences." />
    </Form>
  );
}

export default function Command() {
  const { clocks, setClocks, isLoading, error } = useClocks();
  const [isSaving, setSaving] = useState(false);
  const saving = useRef(false);
  const now = useNow();
  const appearance = getAppearance();

  const save: SaveClocks = async (next) => {
    if (saving.current) return false;
    saving.current = true;
    setSaving(true);
    try {
      await writeClocks(next);
      setClocks(next);
      try {
        await refreshMenuBar();
        await showToast({ style: Toast.Style.Success, title: "Clocks updated" });
      } catch {
        await showToast({ style: Toast.Style.Failure, title: "Saved; menu bar refresh failed",
          message: "Run World Clocks to refresh, or wait for the next background update." });
      }
      return true;
    } catch (reason) {
      await showToast({ style: Toast.Style.Failure, title: "Could not save clocks", message: String(reason) });
      return false;
    } finally {
      saving.current = false;
      setSaving(false);
    }
  };

  const addAction = <Action.Push title="Add Time Zone" icon={Icon.Plus}
    shortcut={{ modifiers: ["cmd"], key: "n" }}
    target={<ClockForm clocks={clocks} onSave={save} />} />;
  const preferencesAction = <Action title="Appearance & Time Format" icon={Icon.Gear}
    shortcut={{ modifiers: ["cmd"], key: "," }} onAction={openExtensionPreferences} />;

  return (
    <List isLoading={isLoading || isSaving} searchBarPlaceholder="Search your clocks by city, country, or time zone…"
      navigationTitle="Manage Time Zones">
      {error ? <List.EmptyView icon={Icon.ExclamationMark} title="Could Not Load Clocks" description={error.message} /> : !isLoading && (
        <>
          <List.Section title="Menu Bar Preview" subtitle={`${clocks.filter((clock) => clock.enabled).length} visible`}>
            <List.Item id="preview" icon={Icon.Clock}
              title={menuBarTitle(clocks, now, appearance) || "No visible clocks — add or show a time zone"}
              keywords={["preview", "settings", "add"]}
              actions={<ActionPanel>{addAction}{preferencesAction}
                <Action title="Refresh Menu Bar" icon={Icon.ArrowClockwise} onAction={async () => {
                  try { await refreshMenuBar(); }
                  catch (reason) { await showToast({ style: Toast.Style.Failure, title: "Could not refresh menu bar", message: String(reason) }); }
                }} />
              </ActionPanel>} />
          </List.Section>
          <List.Section title="Your Time Zones" subtitle="Order here matches the menu bar">
            {clocks.map((clock, index) => {
              const zone = describeTimeZone(clock.timeZone);
              return (
                <List.Item key={clock.id} id={clock.id}
                  title={`${clock.emoji} ${clock.label}`.trim()} subtitle={clock.timeZone}
                  keywords={[zone.city, zone.country, clock.timeZone, clock.label]}
                  accessories={[
                    { text: formatTime(now, clock.timeZone, appearance.timeFormat), tooltip: formatOffset(now, clock.timeZone) },
                    { icon: clock.enabled ? Icon.Eye : Icon.EyeDisabled,
                      tooltip: clock.enabled ? "Visible in menu bar" : "Only in dropdown" },
                  ]}
                  actions={<ActionPanel>
                    <ActionPanel.Section>
                      <Action.Push title="Edit Clock" icon={Icon.Pencil}
                        target={<ClockForm clock={clock} clocks={clocks} onSave={save} />} />
                      <Action title={clock.enabled ? "Hide from Menu Bar" : "Show in Menu Bar"}
                        icon={clock.enabled ? Icon.EyeDisabled : Icon.Eye}
                        shortcut={{ modifiers: ["cmd"], key: "t" }}
                        onAction={async () => { await save(clocks.map((item) => item.id === clock.id ? { ...item, enabled: !item.enabled } : item)); }} />
                      <Action title="Copy Current Time" icon={Icon.Clipboard}
                        shortcut={{ modifiers: ["cmd"], key: "c" }}
                        onAction={async () => {
                          await Clipboard.copy(formatTime(new Date(), clock.timeZone, appearance.timeFormat));
                          await showToast({ style: Toast.Style.Success, title: "Time copied" });
                        }} />
                    </ActionPanel.Section>
                    <ActionPanel.Section>
                      {index > 0 && <Action title="Move Up" icon={Icon.ArrowUp}
                        shortcut={{ modifiers: ["cmd", "shift"], key: "arrowUp" }}
                        onAction={async () => { await save(moveClock(clocks, clock.id, -1)); }} />}
                      {index < clocks.length - 1 && <Action title="Move Down" icon={Icon.ArrowDown}
                        shortcut={{ modifiers: ["cmd", "shift"], key: "arrowDown" }}
                        onAction={async () => { await save(moveClock(clocks, clock.id, 1)); }} />}
                    </ActionPanel.Section>
                    <ActionPanel.Section>{addAction}{preferencesAction}</ActionPanel.Section>
                    <ActionPanel.Section>
                      <Action title="Remove Clock" icon={Icon.Trash} style={Action.Style.Destructive}
                        shortcut={{ modifiers: ["ctrl"], key: "x" }}
                        onAction={async () => { await save(clocks.filter((item) => item.id !== clock.id)); }} />
                    </ActionPanel.Section>
                  </ActionPanel>}
                />
              );
            })}
          </List.Section>
        </>
      )}
    </List>
  );
}
