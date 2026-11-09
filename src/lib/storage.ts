import { launchCommand, LaunchType, LocalStorage } from "@raycast/api";
import { Clock, decodeClocks } from "./clocks";

const STORAGE_KEY = "clocks-v1";

export async function readClocks(): Promise<Clock[]> {
  return decodeClocks(await LocalStorage.getItem<string>(STORAGE_KEY));
}

export async function writeClocks(clocks: Clock[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(clocks));
}

export async function refreshMenuBar(): Promise<void> {
  await launchCommand({ name: "world-clocks", type: LaunchType.Background });
}
