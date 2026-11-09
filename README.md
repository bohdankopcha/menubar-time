# Menu Bar Time

A Raycast extension for keeping your favorite time zones in the macOS menu bar, with country flags, custom emoji, and optional labels.

```text
🇵🇱 14:30  |  🇺🇸 08:30  |  🇯🇵 22:30
```

## Features

- Display multiple time zones in one menu bar item.
- Search time zones by city, country, or IANA identifier.
- Use automatic country flags, custom emoji, or no badge.
- Rename, reorder, and show or hide individual clocks.
- Keep hidden clocks available in the dropdown menu.
- Choose a 12-hour or 24-hour format and customize separators and labels.
- See each clock's date, UTC offset, and day difference from your Mac.
- Click a clock in the dropdown to copy its current time.
- Work offline with automatic daylight saving time handling.

## Requirements

- macOS with [Raycast](https://www.raycast.com/) installed.
- Node.js 22.14 or later and npm for installation and builds.

## Install

From the project directory, run:

```sh
npm ci
npm run setup:raycast
```

The setup command registers the extension using the Raycast CLI, stops the development watcher, and creates a production build. Once it finishes, you can close the terminal.

Open Raycast and run **World Clocks** to activate the menu bar clocks and background refresh. Run **Manage Time Zones** to configure them, or open it from the clocks' dropdown menu.

The default clocks are Warsaw, New York, and Tokyo.

### Update an existing installation

After updating the source, run:

```sh
npm ci
npm run build
```

Then run **World Clocks** again to refresh the menu bar item.

`npm run build` writes the production build to `~/.config/raycast/extensions/menubar-time`. It finishes after building and does not need to stay running.

If the commands do not appear in Raycast after a successful build, run `npm run setup:raycast` once. Building alone does not register a new extension.

## Configure your clocks

Open **Manage Time Zones** in Raycast:

| Action | Shortcut | Description |
| --- | --- | --- |
| Add Time Zone | `⌘N` | Search for a city, country, or zone such as `Europe/Warsaw`. |
| Edit Clock | `↵` on a clock | Change its time zone, label, flag, or emoji. |
| Show / Hide from Menu Bar | `⌘T` | Toggle visibility while keeping the clock in the dropdown. |
| Move Up / Down | `⌘⇧↑` / `⌘⇧↓` | Change the display order. |
| Copy Current Time | `⌘C` | Copy the selected clock's current time. |
| Remove Clock | `⌃X` | Remove a clock; you can add it again later. |
| Appearance & Time Format | `⌘,` | Open the extension preferences. |

Country flags are filled in automatically. Replace one with any emoji, such as `🏠` or `💻`, or leave the field empty to hide the badge for that clock.

In **Appearance & Time Format**, choose:

- 12-hour or 24-hour time.
- Whether to show flags and emoji.
- Whether to show city names or custom labels.
- A vertical line, dot, or space between clocks.

Changes to the clock list are saved locally and trigger a menu bar refresh. Appearance changes take effect on the next refresh; run **World Clocks** to apply them immediately.

## Menu bar dropdown

Click the menu bar clocks to see all saved clocks, including hidden ones, with their current dates and UTC offsets. A `+1d` or `-1d` marker means the clock's calendar date differs from your Mac's date. Click a clock to copy its current time.

If you remove or hide every clock, a clock icon remains in the menu bar so you can still open the settings.

All visible clocks share one menu bar item. If it becomes too wide, hide some clocks or disable labels. macOS determines how much menu bar space is available.

## Time calculation and resource use

The extension reads the current time from your Mac and uses `Intl.DateTimeFormat` with the time zone database provided by Raycast's runtime. Daylight saving time and fractional UTC offsets are handled automatically. No network requests, accounts, or API keys are needed during normal use.

Background refresh is configured to run **once per minute**, the [minimum interval supported by Raycast](https://developers.raycast.com/information/manifest#command-properties). Raycast [unloads menu bar commands after rendering](https://developers.raycast.com/api-reference/menu-bar-commands), so the extension does not keep a background timer running continuously. While its menu or settings are open, it updates the displayed time once per second.

Refresh timing depends on Raycast's scheduler and is not guaranteed to align with the start of each minute. Updates do not run while your Mac is asleep. Opening the dropdown recalculates the time.

## Development

```sh
npm ci
npm run dev
```

This starts Raycast's development mode with automatic rebuilding. Stop it with `Ctrl+C`; the registered extension remains available in Raycast.

```sh
npm run check
```

This checks TypeScript, runs the tests, and builds into the project's `dist/` directory without installing into Raycast.

The tests cover daylight saving transitions, fractional offsets, date boundaries, time formatting, clock visibility and order, saved settings, country flags, and setup process cleanup.

| Command | Purpose |
| --- | --- |
| `npm run setup:raycast` | Register the extension and create an installed production build. |
| `npm run dev` | Develop with automatic rebuilding. |
| `npm run build` | Build directly into Raycast's extension directory. |
| `npm run build:dist` | Build into the local `dist/` directory. |
| `npm run typecheck` | Check TypeScript. |
| `npm test` | Run the tests. |
| `npm run check` | Run type checking, tests, and a local production build. |

### Time zone metadata

Country mappings in `src/data/time-zone-countries.json` come from the public-domain IANA `zone.tab` file. The picker also includes runtime-supported zones from `Intl.supportedValuesOf` and geographic aliases such as `Europe/Kyiv`. Actual time calculations use the runtime's time zone database.

Regenerate the country mappings on macOS:

```sh
node scripts/update-time-zones.mjs
```

### Extension icon

The icon source is `scripts/create-icon.swift`. Regenerate it on macOS with:

```sh
swift scripts/create-icon.swift
```

## License

[MIT](LICENSE)
