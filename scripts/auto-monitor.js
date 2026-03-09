/**
 * Auto-monitor script — runs alongside the dev server.
 * Calls the /api/monitor cron endpoint every 30 seconds
 * to check all sites automatically.
 */

const INTERVAL_MS = 30_000; // 30 seconds
const MONITOR_URL = "http://localhost:3000/api/monitor";
const CRON_SECRET = "dev-cron-secret";

async function runCheck() {
  try {
    const res = await fetch(MONITOR_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });
    const data = await res.json();
    const timestamp = new Date().toLocaleTimeString();
    if (res.ok) {
      console.log(`[${timestamp}] Checked ${data.checked} site(s) — ${JSON.stringify(data.results?.map(r => `${r.url}: ${r.status}`) || [])}`);
    } else {
      console.log(`[${timestamp}] Check failed:`, data.error);
    }
  } catch (err) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Server not ready — retrying in ${INTERVAL_MS / 1000}s`);
  }
}

console.log("SiteDoc Auto-Monitor started");
console.log(`Checking all sites every ${INTERVAL_MS / 1000} seconds...\n`);

// Run immediately, then on interval
runCheck();
setInterval(runCheck, INTERVAL_MS);
