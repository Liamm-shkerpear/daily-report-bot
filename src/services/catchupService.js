const { DateTime } = require("luxon");
const { loadDB } = require("../utils/storage");
const { TIMEZONE } = require("../config");
const { runDailyCheck } = require("./reportService");

async function catchUpIfMissed(client) {
  const now = DateTime.now().setZone(TIMEZONE);
  const targetDay = now.minus({ days: 1 }).startOf("day");
  const key = targetDay.toISODate();

  const db = loadDB();
  const alreadyChecked = !!db.days?.[key];

  if (!alreadyChecked) {
    console.log(`[CATCHUP] Missed check for ${key}. Running now...`);
    await runDailyCheck(client);
  } else {
    console.log(`[CATCHUP] Already checked for ${key}. Skip.`);
  }
}

module.exports = { catchUpIfMissed };
