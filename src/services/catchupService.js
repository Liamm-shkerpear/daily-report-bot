const { DateTime } = require("luxon");
const { loadDB } = require("../utils/storage");
const { TIMEZONE, GUILD_ID } = require("../config");
const { runDailyCheck } = require("./reportService");

function getLastCheckedDate(db) {
  const days = db.days || {};
  const checkedKeys = Object.keys(days).filter((k) => !!days[k]?.checkedAt);
  if (checkedKeys.length === 0) return null;

  checkedKeys.sort(); // YYYY-MM-DD sort được
  return checkedKeys[checkedKeys.length - 1];
}

async function catchUpIfMissed(client) {
  const now = DateTime.now().setZone(TIMEZONE);
  const yesterday = now.minus({ days: 1 }).startOf("day");

  const guild = await client.guilds.fetch(GUILD_ID);

  // ✅ FETCH 1 LẦN DUY NHẤT
  await guild.members.fetch();

  const db = loadDB();
  db.days = db.days || {};
  db.meta = db.meta || {};

  const lastChecked = getLastCheckedDate(db);

  let startDay = lastChecked
    ? DateTime.fromISO(lastChecked).setZone(TIMEZONE).plus({ days: 1 }).startOf("day")
    : yesterday;

  for (let d = startDay; d <= yesterday; d = d.plus({ days: 1 })) {
    const key = d.toISODate();

    if (!db.days[key]?.checkedAt) {
      console.log(`[CATCHUP] Missing check for ${key}. Running now...`);
      await runDailyCheck(client, key); // ❗ không fetch members nữa
    }
  }

  db.meta.lastCheckedDate = yesterday.toISODate();
  saveDB(db);
}


module.exports = { catchUpIfMissed };
