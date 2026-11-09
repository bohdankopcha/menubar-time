import { useEffect, useState } from "react";
import { Clock } from "./clocks";
import { readClocks } from "./storage";

export function useClocks() {
  const [clocks, setClocks] = useState<Clock[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let active = true;
    readClocks().then((value) => {
      if (active) setClocks(value);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason : new Error(String(reason)));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return { clocks, setClocks, isLoading, error };
}

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Raycast unloads menu-bar commands after rendering. This only runs while a view/menu is open.
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
