// zone.tab is public domain IANA metadata. Time calculations always use Intl's runtime database.
import { readFileSync, writeFileSync } from 'node:fs';
const source = process.argv[2] ?? '/usr/share/zoneinfo/zone.tab';
const zones = Object.fromEntries(readFileSync(source, 'utf8').split('\n')
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => { const [country, , zone] = line.split('\t'); return [zone, country]; }));
writeFileSync(new URL('../src/data/time-zone-countries.json', import.meta.url), JSON.stringify(zones, null, 2) + '\n');
