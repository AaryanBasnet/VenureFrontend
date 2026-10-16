// Runs the unit tests under several host time zones: the calendar code must give the same answers in all of them.
import { spawnSync } from "node:child_process";

const zones = process.argv.slice(2).length ? process.argv.slice(2) : ["UTC", "America/New_York", "Asia/Kathmandu"];
let failed = false;
for (const tz of zones) {
  console.log(`\n=== TZ=${tz} ===`);
  const result = spawnSync("npx", ["vitest", "run"], { stdio: "inherit", shell: true, env: { ...process.env, TZ: tz } });
  if (result.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
